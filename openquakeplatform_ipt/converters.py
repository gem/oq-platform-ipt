# -*- coding: utf-8 -*-
# vim: tabstop=4 shiftwidth=4 softtabstop=4
#
# Copyright (C) 2016-2019 GEM Foundation
#
# OpenQuake is free software: you can redistribute it and/or modify it
# under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# OpenQuake is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with OpenQuake. If not, see <http://www.gnu.org/licenses/>.

import sys
import os
import json

try:
    from multienv_common import VolConst
except ImportError:
    from openquakeplatform_ipt.multienv_common import VolConst


GDAL2_AVAILABLE = False
try:
    from osgeo import gdal
    if int(gdal.VersionInfo("VERSION_NUM")) > 2000000:
        import re
        import gc
        import csv
        import numpy
        from osgeo import ogr, osr
        from pyproj import Proj, transform

        GDAL2_AVAILABLE = True

        def gem_raster2polyg(hea, epsg_in, raster, csv_filepath):
            driver = dst_ds = sourceBand = srs_in = transform = outband = None
            sourceBand = outDatasource = outLayer = newField = multi = None
            geom = wkt = None

            try:
                dst_filename = 'rast_gen_out.vrt'

                driver = gdal.GetDriverByName("MEM")

                dst_ds = driver.Create(dst_filename,
                                       xsize=hea['ncols'],
                                       ysize=hea['nrows'],
                                       bands=1, eType=gdal.GDT_Float32)

                srs_in = osr.SpatialReference()
                srs_in.ImportFromEPSG(int(epsg_in))

                epsg = 4326
                srs = osr.SpatialReference()
                if int(gdal.VersionInfo("VERSION_NUM")[0]) >= 3:
                    # GDAL 3 changes axis order:
                    #          https://github.com/OSGeo/gdal/issues/1546
                    srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
                srs.ImportFromEPSG(epsg)

                transform = None
                if not srs_in.IsSame(srs):
                    transform = osr.CoordinateTransformation(
                        srs_in, srs)

                pixw = hea['cellsize']

                dst_ds.SetGeoTransform((
                    hea['xllcorner'],
                    pixw, 0,
                    hea['yllcorner'] + float(pixw * hea['nrows']),
                    0, -pixw))

                dst_ds.SetProjection(srs_in.ExportToWkt())
                outband = dst_ds.GetRasterBand(1)
                outband.WriteArray(raster)
                outband.FlushCache()

                # Once we're done, close properly the dataset

                sourceBand = dst_ds.GetRasterBand(1)
                sourceBand.SetNoDataValue(0.0)
                sourceBand.WriteRaster(
                    0, 0, hea['ncols'], hea['nrows'],
                    sourceBand.ReadRaster())

                driver = ogr.GetDriverByName("Memory")
                outDatasource = driver.CreateDataSource('poly_ds')
                outLayer = outDatasource.CreateLayer("polygonized", srs=srs)

                newField = ogr.FieldDefn('poly', ogr.OFTReal)
                outLayer.CreateField(newField)

                gdal.Polygonize(sourceBand, sourceBand, outLayer, -1, [],
                                callback=None)

                multi = ogr.Geometry(ogr.wkbMultiPolygon)
                for feature in outLayer:
                    geom = feature.GetGeometryRef()
                    if transform:
                        geom.Transform(transform)

                    geom.FlattenTo2D()
                    wkt = geom.ExportToWkt()
                    multi.AddGeometryDirectly(ogr.CreateGeometryFromWkt(wkt))

                with open(csv_filepath, 'w', newline='') as f_out:
                    f_out.write('geom\n"')
                    f_out.write(str(multi))
                    f_out.write('"\n')
            finally:
                driver = dst_ds = sourceBand = srs_in = transform = None
                sourceBand = outDatasource = outLayer = newField = multi = None
                outband = geom = wkt = None
                gc.collect()

        class TransToWGS84(object):
            def __init__(self, epsg_in):
                self.proj_in = Proj(init='epsg:%s' % epsg_in)
                self.proj_out = Proj(init='epsg:%s' % VolConst.epsg_out)

            def coord(self, x_in, y_in):
                x_out, y_out = transform(self.proj_in, self.proj_out,
                                         x_in, y_in)
                return (x_out, y_out)

        def gem_esritxt2wkt_coreconv_exec(input_filepath, csv_filepath,
                                          epsg_in, density, nodata_extra_in):
            if nodata_extra_in is None:
                nodata_extra = []
            else:
                nodata_extra = nodata_extra_in

            hea = {'ncols': None,
                   'nrows': None,
                   'xllcorner': None,
                   'yllcorner': None,
                   'cellsize': None,
                   'nodata_value': None}

            is_head = True
            row_ct = 0
            with open(input_filepath, "r") as f:
                for row_s in f:
                    row = re.split(r'[\s]\s*', row_s)
                    if is_head:
                        if row[0].lower() in hea:
                            hea[row[0].lower()] = row[1]
                            continue
                        else:
                            raster = numpy.zeros(
                                (
                                    int(hea['nrows']),
                                    int(hea['ncols'])
                                ),
                                dtype=numpy.float32)

                            hea['xllcorner'] = float(hea['xllcorner'])
                            hea['yllcorner'] = float(hea['yllcorner'])
                            hea['cellsize'] = float(hea['cellsize'])
                            hea['ncols'] = int(hea['ncols'])
                            hea['nrows'] = int(hea['nrows'])
                            hea['nodata_value'] = float(
                                hea['nodata_value'])
                            is_head = False

                    if not is_head:
                        for i in range(0, len(row)):
                            if row[i].strip() == "":
                                continue
                            row[i] = (1.0 if (
                                float(row[i]) != hea['nodata_value']
                                and row[i] not in nodata_extra) else 0.0)
                        raster[row_ct] = row[0:hea['ncols']]
                        row_ct += 1
                        if row_ct >= hea['nrows']:
                            break

            gem_raster2polyg(hea, epsg_in, raster, csv_filepath)

        def gem_esritxt_coreconv_exec(input_filepath, csv_filepath, epsg_in,
                                      density):
            raster = gdal.Open(input_filepath)
            rasterArray = raster.ReadAsArray()
            lon, lon_delta, _, lat, _, lat_delta = raster.GetGeoTransform()

            if epsg_in is not VolConst.epsg_out:
                trans = TransToWGS84(epsg_in)

            with open(csv_filepath, 'w', newline='') as csv_fout:
                csv_out = csv.writer(csv_fout)
                csv_out.writerow(['lon', 'lat', 'intensity'])

                lat_out = lat + (lat_delta / 2.0)
                for row in rasterArray:
                    lon_out = lon + (lon_delta / 2.0)
                    for el in row:
                        if float(el) <= 0.0:
                            continue
                        if epsg_in is not VolConst.epsg_out:
                            # original coordinates
                            # transformed to EPGS:4326 using pyproj
                            lon_out, lat_out = trans.coord(lon_out, lat_out)

                        if not (density is None):
                            el = ((float(density) * VolConst.g *
                                   (float(el) / 1000.)) / 1000.)

                        row_out = ["%.5f" % lon_out, "%.5f" % lat_out,
                                   "%.5f" % el]
                        csv_out.writerow(row_out)

                        lon_out += lon_delta
                    lat_out += lat_delta

        def gem_titan2_coreconv_exec(input_filepath, csv_filepath, epsg_in):
            if epsg_in is not VolConst.epsg_out:
                trans = TransToWGS84(epsg_in)

            with open(input_filepath, 'r', newline='') as file_in, open(
                    csv_filepath + '.temp', 'w', newline='') as csv_fout:
                csv_out = csv.writer(csv_fout)
                csv_out.writerow(['lon', 'lat', 'intensity'])

                line1 = file_in.readline()
                ret = re.search(
                    '^Nx=([0-9]+): X={[ 	]*([0-9]+),[ 	]*([0-9]+)',
                    line1)

                ret1_grp = ret.groups()
                if len(ret1_grp) != 3:
                    raise ValueError(
                        'Malformed Titan2 first line header [%s]' % line1)
                cols_n = int(ret1_grp[0])
                x_min = float(ret1_grp[1])
                x_max = float(ret1_grp[2])

                line2 = file_in.readline()
                ret = re.search(
                    '^Ny=([0-9]+): Y={[ 	]*([0-9]+),[ 	]*([0-9]+)',
                    line2)

                ret2_grp = ret.groups()
                if len(ret2_grp) != 3:
                    raise ValueError(
                        'Malformed Titan2 second line header [%s]' % line2)
                rows_n = int(ret1_grp[0])
                y_min = float(ret1_grp[1])
                y_max = float(ret1_grp[2])

                x_step = float((x_max - x_min) / float(cols_n))
                y_step = float((y_max - y_min) / float(rows_n))

                line3 = file_in.readline()
                ret = re.search('^(Pileheight=)\s*', line3)

                ret3_grp = ret.groups()
                if len(ret3_grp) != 1:
                    raise ValueError(
                        'Malformed Titan2 third line header [%s]' % line3)

                x_cur = 0
                y_cur = 0
                for row in file_in:
                    for el in re.split(r'\s+', row.strip()):
                        if float(el) <= 0.0:
                            x_cur += 1
                            if x_cur == cols_n:
                                x_cur = 0
                                y_cur += 1
                            continue
                        x = x_min + (x_step / 2.0) + x_cur * x_step
                        y = y_min + (y_step / 2.0) + y_cur * y_step
                        lon, lat = trans.coord(x, y)
                        # This is necessary ONLY for converted geo coordinates
                        if lon > 180.0:
                            lon = lon - 360.0
                        # Writing .csv file with EPGS:4326 coordinates

                        csv_out.writerow(["%.5f" % lon, "%.5f" % lat,
                                          "%.5f" % float(el)])

                        x_cur += 1
                        if x_cur == cols_n:
                            x_cur = 0
                            y_cur += 1

        def gem_titan2wkt_coreconv_exec(input_filepath, csv_filepath, epsg_in):
            if epsg_in is not VolConst.epsg_out:
                trans = TransToWGS84(epsg_in)

            with open(input_filepath, 'r', newline='') as file_in:
                line1 = file_in.readline()
                ret = re.search(
                    '^Nx=([0-9]+): X={[ 	]*([0-9]+),[ 	]*([0-9]+)',
                    line1)

                ret1_grp = ret.groups()
                if len(ret1_grp) != 3:
                    raise ValueError(
                        'Malformed Titan2 first line header [%s]' % line1)
                cols_n = int(ret1_grp[0])
                x_min = float(ret1_grp[1])
                x_max = float(ret1_grp[2])

                line2 = file_in.readline()
                ret = re.search(
                    '^Ny=([0-9]+): Y={[ 	]*([0-9]+),[ 	]*([0-9]+)',
                    line2)

                ret2_grp = ret.groups()
                if len(ret2_grp) != 3:
                    raise ValueError(
                        'Malformed Titan2 second line header [%s]' % line2)
                rows_n = int(ret1_grp[0])
                y_min = float(ret1_grp[1])
                y_max = float(ret1_grp[2])

                x_step = float((x_max - x_min) / float(cols_n))
                y_step = float((y_max - y_min) / float(rows_n))

                line3 = file_in.readline()
                ret = re.search('^(Pileheight=)\s*', line3)

                ret3_grp = ret.groups()
                if len(ret3_grp) != 1:
                    raise ValueError(
                        'Malformed Titan2 third line header [%s]' % line3)

                if x_step != y_step:
                    raise ValueError(
                        'Malformed Titan2 x and y distance'
                        ' are different [%f, %f]' % (x_step, y_step))

                x_cur = 0
                y_cur = 0
                for row in file_in:
                    for el in re.split(r'\s+', row.strip()):
                        if float(el) <= 0.0:
                            x_cur += 1
                            if x_cur == cols_n:
                                x_cur = 0
                                y_cur += 1
                            continue
                        x = x_min + (x_step / 2.0) + x_cur * x_step
                        y = y_min + (y_step / 2.0) + y_cur * y_step
                        lon, lat = trans.coord(x, y)
                        # This is necessary ONLY for converted geo coordinates
                        if lon > 180.0:
                            lon = lon - 360.0
                        # Writing .csv file with EPGS:4326 coordinates

                        csv_out.writerow(["%.5f" % lon, "%.5f" % lat,
                                          "%.5f" % float(el)])

                        x_cur += 1
                        if x_cur == cols_n:
                            x_cur = 0
                            y_cur += 1

        def gem_shape_coreconv_exec(input_filepath, csv_filepath,
                                    attrib, p_size, density):
            try:
                tmp_path = os.path.dirname(input_filepath)
                shp_filename = os.path.basename(input_filepath)
                tif_filename = shp_filename[:-4] + ".tif"
                xyz_filename = shp_filename[:-4] + ".xyz"
                csv_filename = shp_filename[:-4] + "__shp.csv"
                ogr_drv = ogr.GetDriverByName('ESRI Shapefile')
                s_ds = ogr_drv.Open(input_filepath)
                s_layer = s_ds.GetLayer()
                l_name = s_layer.GetName()
                x_min, x_max, y_min, y_max = s_layer.GetExtent()

                InDS = gdal.OpenEx(input_filepath,
                                   nOpenFlags=(gdal.OF_VECTOR |
                                               gdal.OF_VERBOSE_ERROR))

                rast_opts_s = (
                    "-l {0} -a {1} -tr {2} {2} -te {3} {4} {5} {6}"
                    " -of GTiff -ot Float16 -a_srs EPSG:4326".format(
                        l_name,
                        attrib, p_size,
                        x_min, y_min, x_max, y_max))
                rast_opts = gdal.RasterizeOptions(options=rast_opts_s)

                RetDS = gdal.Rasterize(os.path.join(tmp_path, tif_filename),
                                       InDS, options=rast_opts)

                trans_opts_s = ("-of XYZ -tr {0} {0} -r bilinear"
                                " -co COLUMN_SEPARATOR=,".format(p_size))
                trans_opts = gdal.TranslateOptions(options=trans_opts_s)
                gdal.Translate(os.path.join(tmp_path, xyz_filename),
                               RetDS, options=trans_opts)

                csv_filepath = os.path.join(tmp_path, csv_filename)
                with open(os.path.join(tmp_path, xyz_filename),
                          "r") as f_in, open(
                              csv_filepath, 'w', newline='') as f_out:
                    csv_in = csv.reader(f_in)
                    csv_out = csv.writer(f_out)
                    csv_out.writerow(['lon', 'lat', 'intensity'])
                    for r in csv_in:
                        if float(r[2]) <= 0.0:
                            continue
                        if density is None:
                            intens = r[2].strip()
                        else:
                            load_kpa = ((float(density) * VolConst.g *
                                         (float(r[2]) / 1000.)) / 1000.)
                            intens = "%.5f" % load_kpa
                        csv_out.writerow(
                            ["%.5f" % float(r[0]), "%.5f" % float(r[1]),
                             intens])
            finally:
                del RetDS
                del s_ds
                del InDS
                del ogr_drv
                gc.collect()

        def gem_shape2wkt_coreconv_exec(input_filepath, wkt_filepath):
            try:
                ogr_drv = ogr.GetDriverByName('ESRI Shapefile')
                shp_ds = ogr_drv.Open(input_filepath, 0)
                shp_layer = shp_ds.GetLayerByIndex(0)

                if shp_layer.GetFeatureCount() != 1:
                    raise ValueError('1 feature only layers are supported')

                target_prj = osr.SpatialReference()
                target_prj.ImportFromEPSG(4326)
                source_prj = shp_layer.GetSpatialRef()

                transform = None
                if not source_prj.IsSame(target_prj):
                    transform = osr.CoordinateTransformation(
                        source_prj, target_prj)

                for shp_fea in shp_layer:
                    geom = shp_fea.GetGeometryRef()

                    if transform:
                        geom.Transform(transform)
                    # Excluding Z dimension
                    geom.FlattenTo2D()
                    geom_wkt = geom.ExportToWkt()
                    break

                with open(wkt_filepath, 'w', newline='') as f_out:
                    f_out.write('geom\n"')
                    f_out.write(geom_wkt)
                    f_out.write('"\n')
            finally:
                del shp_ds
                del ogr_drv
                gc.collect()

        def gem_shapefile_get_fields_exec(input_filepath, tmp_path):
            with ZipFile(input_filepath, 'r') as zip:
                zip.extractall(path=tmp_path)

            shp_files = [f for f in os.listdir(tmp_path) if (
                f.endswith('.shp') or f.endswith('.SHP'))]

            if len(shp_files) != 1:
                raise ValueError(
                    'Not uniq .shp file not found in [%s] file.' %
                    input_filepath)

            shp_filename = shp_files[0]
            shp_filepath = os.path.join(tmp_path, shp_filename)

            ogr_drv = ogr.GetDriverByName('ESRI Shapefile')
            s_ds = ogr_drv.Open(shp_filepath)
            s_layer = s_ds.GetLayer()
            # here the layer name l_name = s_layer.GetName()
            ldefn = s_layer.GetLayerDefn()
            schema = []
            for n in range(ldefn.GetFieldCount()):
                fdefn = ldefn.GetFieldDefn(n)
                schema.append(fdefn.name)
            return schema

        if __name__ == '__main__':
            from zipfile import ZipFile

            if sys.argv[1] == 'esritxt':
                if len(sys.argv) < 5 or len(sys.argv) > 6:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                csv_filepath = sys.argv[3]
                epsg_in = sys.argv[4]
                if len(sys.argv) > 5:
                    density = sys.argv[5]
                else:
                    density = None

                gem_esritxt_coreconv_exec(input_filepath, csv_filepath,
                                          epsg_in, density)
            elif sys.argv[1] == 'esritxt-to-wkt':
                if len(sys.argv) < 5 or len(sys.argv) > 7:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                csv_filepath = sys.argv[3]
                epsg = int(sys.argv[4])
                if sys.argv[5] != '':
                    density = float(sys.argv[5])
                else:
                    density = None
                if len(sys.argv) > 6:
                    nodata_extra = sys.argv[6]
                else:
                    nodata_extra = None

                gem_esritxt2wkt_coreconv_exec(
                    input_filepath, csv_filepath,
                    epsg, density, nodata_extra)
            elif sys.argv[1] == 'shape':
                if len(sys.argv) < 6 or len(sys.argv) > 7:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                csv_filepath = sys.argv[3]
                attrib = sys.argv[4]
                p_size = sys.argv[5]
                if len(sys.argv) > 6:
                    density = sys.argv[6]
                else:
                    density = None

                gem_shape_coreconv_exec(input_filepath, csv_filepath,
                                        attrib, p_size, density)
            elif sys.argv[1] == 'shapefile-get-fields':
                if len(sys.argv) != 4:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                tmp_path = sys.argv[3]

                schema = gem_shapefile_get_fields_exec(input_filepath,
                                                       tmp_path)
                for i in schema:
                    print(i)
            elif sys.argv[1] == 'shape-to-wkt':
                if len(sys.argv) != 4:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                wkt_filepath = sys.argv[3]

                gem_shape2wkt_coreconv_exec(input_filepath, wkt_filepath)
            elif sys.argv[1] == 'titan2':
                if len(sys.argv) != 5:
                    sys.exit(2)
                input_filepath = sys.argv[2]
                csv_filepath = sys.argv[3]
                epsg_in = sys.argv[4]

                gem_titan2_coreconv_exec(input_filepath, csv_filepath,
                                         epsg_in)
            else:
                sys.exit(1)
            sys.exit(0)

except ImportError:
    # if gdal 2 not available delegate to external environment
    # geo-related operations
    pass

if not GDAL2_AVAILABLE:
    def gem_esritxt_coreconv_exec(input_filepath, csv_filepath, epsg_in,
                                  density):
        raise NotImplementedError(
            '"gem_esritxt_coreconv_exec" not implemented'
            ' with this environment')

    def gem_esritxt2wkt_coreconv_exec(input_filepath, csv_filepath,
                                      epsg_in, density, nodata_extra_in):
        raise NotImplementedError(
            '"gem_esritxt2wkt_coreconv_exec" not implemented'
            ' with this environment')

    def gem_shape_coreconv_exec(input_filepath, csv_filepath,
                                attrib, p_size, density):
        raise NotImplementedError(
            '"gem_shape_coreconv_exec" not implemented'
            ' with this environment')

    def gem_shape2wkt_coreconv_exec(input_filepath, wkt_filepath):
        raise NotImplementedError(
            '"gem_shape2wkt_coreconv_exec" not implemented'
            ' with this environment')

    def gem_titan2_coreconv_exec(input_filepath, csv_filepath, epsg_in):
        raise NotImplementedError(
            '"gem_titan2_coreconv_exec" not implemented'
            ' with this environment')



# I'm sorry, E402 of python linter appear for a good reason.
import tempfile
import shutil
import subprocess
from openquakeplatform_ipt.common import (
    get_full_path, get_tmp_path, zwrite_or_collect)
from zipfile import ZipFile

GEM_PYTHONPATH_BIN = '/opt/openquake/bin/python3'


def reexecute_with_engine_py3(args_in, out=None):
    py_name = (__file__[:-1] if __file__.endswith('.pyc') else __file__)
    args = [GEM_PYTHONPATH_BIN, py_name]
    args.extend(args_in)
    sp = subprocess.Popen(
        args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, err = sp.communicate()
    if sp.returncode != 0:
        raise ValueError("Return code: %d\nSTDOUT: %s\nSTDERR: %s" % (
            sp.returncode, output, err))
    if type(out) is list:
        out.append(output)
    return True


def gem_esritxt_coreconv_delegate(input_filepath, csv_filepath, epsg_in,
                                  density):
    params = ['esritxt', input_filepath, csv_filepath, epsg_in]
    if density:
        params.append(density)
    return reexecute_with_engine_py3(params)


def gem_esritxt_coreconv(input_filepath, csv_filepath, epsg_in, density):
    if GDAL2_AVAILABLE:
        method = gem_esritxt_coreconv_exec
    else:
        method = gem_esritxt_coreconv_delegate

    return method(input_filepath, csv_filepath, epsg_in, density)


def gem_esritxt2wkt_coreconv_delegate(input_filepath, csv_filepath,
                                      epsg_in, density, nodata_extra):
    params = ['esritxt-to-wkt', input_filepath, csv_filepath,
              epsg_in]
    if density:
        params.append(density)
    else:
        params.append('')

    if nodata_extra:
        params.append(json.dumps(nodata_extra))

    return reexecute_with_engine_py3(params)


def gem_esritxt2wkt_coreconv(input_filepath, csv_filepath, epsg_in, density,
                             nodata_extra):
    if GDAL2_AVAILABLE:
        method = gem_esritxt2wkt_coreconv_exec
    else:
        method = gem_esritxt2wkt_coreconv_delegate

    return method(input_filepath, csv_filepath, epsg_in, density, nodata_extra)


def gem_shape_coreconv_delegate(input_filepath, csv_filepath,
                                attrib, p_size, density):
    params = ['shape', input_filepath, csv_filepath, attrib, p_size]
    if density:
        params.append(density)

    return reexecute_with_engine_py3(params)


def gem_shape_coreconv(input_filepath, csv_filepath,
                       attrib, p_size, density):
    if GDAL2_AVAILABLE:
        method = gem_shape_coreconv_exec
    else:
        method = gem_shape_coreconv_delegate

    return method(input_filepath, csv_filepath,
                  attrib, p_size, density)


def gem_shape2wkt_coreconv_delegate(input_filepath, wkt_filepath):
    params = ['shape-to-wkt', input_filepath, wkt_filepath]

    return reexecute_with_engine_py3(params)


def gem_shape2wkt_coreconv(input_filepath, wkt_filepath):
    if GDAL2_AVAILABLE:
        method = gem_shape2wkt_coreconv_exec
    else:
        method = gem_shape2wkt_coreconv_delegate

    return method(input_filepath, wkt_filepath)


def gem_titan2_coreconv_delegate(input_filepath, csv_filepath, epsg_in):
    params = ['titan2', input_filepath, csv_filepath, epsg_in]
    return reexecute_with_engine_py3(params)


def gem_titan2_coreconv(input_filepath, csv_filepath, epsg_in):
    if GDAL2_AVAILABLE:
        method = gem_titan2_coreconv_exec
    else:
        method = gem_titan2_coreconv_delegate

    return method(input_filepath, csv_filepath, epsg_in)


def gem_shapefile_get_fields_delegate(input_filepath, tmp_path):
    params = ['shapefile-get-fields', input_filepath, tmp_path]
    out = []

    if reexecute_with_engine_py3(params, out):
        return out[0].strip().split('\n')
    else:
        return False


def gem_shapefile_get_fields(userid, namespace, filename):
    input_filepath = get_full_path(userid, namespace, filename)
    tmp_basepath = get_tmp_path(userid)
    tmp_path = tempfile.mkdtemp(prefix='shpin_', dir=tmp_basepath)

    if GDAL2_AVAILABLE:
        method = gem_shapefile_get_fields_exec
    else:
        method = gem_shapefile_get_fields_delegate

    try:
        ret = method(input_filepath, tmp_path)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            shutil.rmtree(tmp_path)

    return ret


def gem_esritxt_converter(z, userid, namespace, filename, file_collect,
                          epsg_in, density):
    csv_filepath = None
    csv_filename = ""
    try:
        input_filepath = get_full_path(userid, namespace, filename)
        output_file = os.path.basename(filename)
        extension = os.path.splitext(output_file)[1][1:]
        if not extension:
            raise ValueError('extension of input file not found')

        csv_filename = output_file[:-4] + "__" + extension + ".csv"

        tmp_path = get_tmp_path(userid)
        csv_filepath = os.path.join(tmp_path, csv_filename)
        gem_esritxt_coreconv(input_filepath, csv_filepath, epsg_in, density)
        zwrite_or_collect(z, userid, 'tmp', csv_filename, file_collect)
    finally:
        if os.path.exists(csv_filepath):
            os.remove(csv_filepath)

    return csv_filename


def gem_esritext2wkt_converter(z, userid, namespace, filename, file_collect,
                               epsg_in, density, nodata_extra):
    csv_filepath = None
    csv_filename = ""
    try:
        input_filepath = get_full_path(userid, namespace, filename)
        output_file = os.path.basename(filename)
        extension = os.path.splitext(output_file)[1][1:]
        if not extension:
            raise ValueError('extension of input file not found')

        csv_filename = output_file[:-4] + "__" + extension + ".csv"

        tmp_path = get_tmp_path(userid)
        csv_filepath = os.path.join(tmp_path, csv_filename)
        gem_esritxt2wkt_coreconv(input_filepath, csv_filepath, epsg_in,
                                 density, nodata_extra)
        zwrite_or_collect(z, userid, 'tmp', csv_filename, file_collect)
    finally:
        if os.path.exists(csv_filepath):
            os.remove(csv_filepath)

    return csv_filename


def gem_titan2_converter(z, userid, namespace, filename, file_collect,
                         epsg_in):
    """
    Note: Only Pileheight!
    Nx=1024: X={              641941,              645559}
    Ny=1024: Y={             2154941,             2158559}
    Pileheight=
    """
    csv_filepath = None
    csv_filename = ""
    try:
        input_filepath = get_full_path(userid, namespace, filename)
        output_file = os.path.basename(filename)
        extension = os.path.splitext(output_file)[1][2:]
        if not extension:
            raise ValueError('extension of input file not found')

        csv_filename = output_file[:-7] + "__" + extension + ".csv"

        tmp_path = get_tmp_path(userid)
        csv_filepath = os.path.join(tmp_path, csv_filename)
        gem_titan2_coreconv(input_filepath, csv_filepath, epsg_in)
        zwrite_or_collect(z, userid, 'tmp', csv_filename,
                          file_collect)
    finally:
        if os.path.exists(csv_filepath):
            os.remove(csv_filepath)

    return csv_filename


def gem_shape_converter(z, userid, namespace, filename, file_collect,
                        p_size, attrib, density):
    if z is None:
        raise ValueError("Shapefile input format not yet supported for"
                         " hybridge QGIS integration")

    input_filepath = get_full_path(userid, namespace, filename)
    tmp_basepath = get_tmp_path(userid)
    tmp_path = tempfile.mkdtemp(prefix='shpin_', dir=tmp_basepath)
    try:
        with ZipFile(input_filepath, 'r') as zip:
            zip.extractall(path=tmp_path)

        shp_files = [f for f in os.listdir(tmp_path) if (
            f.endswith('.shp') or f.endswith('.SHP'))]

        if len(shp_files) != 1:
            raise ValueError('Not uniq .shp file not found in [%s] file.' %
                             filename)

        shp_filename = shp_files[0]
        csv_filename = shp_filename[:-4] + "__shp.csv"
        shp_filepath = os.path.join(tmp_path, shp_filename)
        csv_filepath = os.path.join(tmp_path, csv_filename)

        gem_shape_coreconv(shp_filepath, csv_filepath,
                           attrib, p_size, density)

        zwrite_or_collect(z, userid, 'tmp',
                          csv_filepath, file_collect)
        csv_name = os.path.basename(csv_filename)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            shutil.rmtree(tmp_path)

    return csv_name


def gem_shape2wkt_converter(z, userid, namespace, filename, file_collect):
    if z is None:
        raise ValueError("Shapefile input format not yet supported for"
                         " hybridge QGIS integration")

    input_filepath = get_full_path(userid, namespace, filename)
    tmp_basepath = get_tmp_path(userid)
    tmp_path = tempfile.mkdtemp(prefix='shpin_', dir=tmp_basepath)
    try:
        with ZipFile(input_filepath, 'r') as zip:
            zip.extractall(path=tmp_path)

        shp_files = [f for f in os.listdir(tmp_path) if (
            f.endswith('.shp') or f.endswith('.SHP'))]

        if len(shp_files) != 1:
            raise ValueError('Not uniq .shp file not found in [%s] file.' %
                             filename)

        shp_filename = shp_files[0]
        wkt_filename = shp_filename[:-4] + "__shp.csv"
        shp_filepath = os.path.join(tmp_path, shp_filename)
        wkt_filepath = os.path.join(tmp_path, wkt_filename)

        gem_shape2wkt_coreconv(shp_filepath, wkt_filepath)

        zwrite_or_collect(z, userid, 'tmp',
                          wkt_filepath, file_collect)
        wkt_name = os.path.basename(wkt_filename)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            shutil.rmtree(tmp_path)

    return wkt_name


def gem_input_converter(z, key, input_type, userid, namespace, filename,
                        file_collect, *args):
    """
    a part of mandatory fields, optional are managed as follow:
    input_type == VolConst.ty_shape:
        p_size = args[0]
        attrib = args[1]
        density = args[2] (value or None)

    input_type == VolConst.ty_text && key != pyro:
        epsg_in = arg[0]
        density = args[2] (value or None)
    input_type == VolConst.ty_text && key == pyro:
        epsg_in = arg[0]
    """
    if input_type == VolConst.ty_shap:
        p_size = args[0]
        attrib = args[1]
        density = args[2]
        return gem_shape_converter(z, userid, namespace, filename,
                                   file_collect, p_size, attrib, density)
    elif input_type == VolConst.ty_swkt:
        return gem_shape2wkt_converter(z, userid, namespace, filename,
                                       file_collect)
    elif input_type == VolConst.ty_text:
        epsg_in = args[0]
        density = args[1]

        if key in [VolConst.ph_ashf]:
            return gem_esritxt_converter(
                z, userid, namespace, filename, file_collect,
                epsg_in, density)
    elif input_type == VolConst.ty_twkt:
        epsg_in = args[0]
        density = args[1]
        nodata_extra = args[2]

        if key == VolConst.ph_lava:
            return gem_esritext2wkt_converter(
                z, userid, namespace, filename, file_collect,
                epsg_in, density, nodata_extra)
        elif key == VolConst.ph_laha:
            return gem_esritext2wkt_converter(
                z, userid, namespace, filename, file_collect,
                epsg_in, density, nodata_extra)
        else:  # pyro case
            return gem_titan2_converter(
                z, userid, namespace, filename, file_collect,
                epsg_in)
