import os
import re
import csv
import tempfile
import shutil
from pyproj import Proj, transform
from osgeo import ogr, gdal
from openquakeplatform_ipt.common import (
    VolConst, get_full_path, get_tmp_path,
    zwrite_or_collect)
from zipfile import ZipFile


class TransToWGS84(object):
    def __init__(self, epsg_in):
        self.proj_in = Proj(init='epsg:%s' % epsg_in)
        self.proj_out = Proj(init='epsg:4326')

    def coord(self, x_in, y_in):
        x_out, y_out = transform(self.proj_in, self.proj_out,
                                 x_in, y_in)
        return (x_out, y_out)


def Ash3DToOpenQuake(file_in, file_out, epsg_in):
    """
NCOLS    74
NROWS    75
XLLCORNER    280.860
YLLCORNER      3.395
CELLSIZE      0.099
NODATA_VALUE  0.000
     0.000     0.000     0.000     0.000     0.000     0.000 ... (10 values)
...
<white line>
     0.000     0.000     0.000     0.000     0.000     0.000 ...
...
.
.
.
"""
    ash3d_header = {
        "NCOLS": None,
        "NROWS": None,
        "XLLCORNER": None,
        "YLLCORNER": None,
        "CELLSIZE": None,
        "NODATA_VALUE": None
    }

    trans = TransToWGS84(epsg_in)
    csv_out = csv.writer(file_out)
    check_header = True

    for l in file_in:
        if not l.startswith(' '):
            fie = re.split(r'\s+', l.strip())
            if fie[0] not in ash3d_header.keys():
                continue
            else:
                ash3d_header[fie] = fie[1]
                continue

        if check_header is True:
            # check header completeness
            if any(x is None for x in ash3d_header.values()):
                raise ValueError('malformed header')
            check_header = False


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
        tif_filename = shp_filename[:-4] + ".tif"
        xyz_filename = shp_filename[:-4] + ".xyz"
        csv_filename = shp_filename[:-4] + "__shp.csv"
        ogr_drv = ogr.GetDriverByName('ESRI Shapefile')
        shp_filepath = os.path.join(tmp_path, shp_filename)
        s_ds = ogr_drv.Open(shp_filepath)
        s_layer = s_ds.GetLayer()
        l_name = s_layer.GetName()
        # spatialRef = s_layer.GetSpatialRef()
        # l_def = s_layer.GetLayerDefn()
        x_min, x_max, y_min, y_max = s_layer.GetExtent()

        InDS = gdal.OpenEx(shp_filepath,
                           nOpenFlags=(gdal.OF_VECTOR | gdal.OF_VERBOSE_ERROR))

        rast_opts_s = ("-l {0} -a {1} -tr {2} {2} -te {3} {4} {5} {6}"
                       " -of GTiff -ot Float16 -a_srs EPSG:4326".format(
                           l_name, attrib, p_size, x_min, y_min, x_max, y_max))
        rast_opts = gdal.RasterizeOptions(options=rast_opts_s)

        print(rast_opts)
        RetDS = gdal.Rasterize(os.path.join(tmp_path, tif_filename),
                               InDS, options=rast_opts)

        print(RetDS)

        trans_opts_s = ("-of XYZ -tr {0} {0} -r bilinear"
                        " -co COLUMN_SEPARATOR=,".format(p_size))
        trans_opts = gdal.TranslateOptions(options=trans_opts_s)
        gdal.Translate(os.path.join(tmp_path, xyz_filename),
                       RetDS, options=trans_opts)

        csv_filepath = os.path.join(tmp_path, csv_filename)
        with open(os.path.join(tmp_path, xyz_filename),
                  "r") as f_in, open(csv_filepath, 'w') as f_out:
            csv_in = csv.reader(f_in)
            csv_out = csv.writer(f_out)
            csv_out.writerow(['lon', 'lat', 'intensity'])
            for r in csv_in:
                if float(r[2]) <= 0.0:
                    continue
                if density is None:
                    intens = r[2]
                else:
                    load_kpa = ((float(density) * 9.80665 *
                                 (float(r[2]) / 1000.)) / 1000.)
                    intens = "%.5f" % load_kpa
                csv_out.writerow(
                    ["%.5f" % float(r[0]), "%.5f" % float(r[1]),
                     intens])

        zwrite_or_collect(z, userid, 'tmp',
                          os.path.join(tmp_path, csv_filename),
                          file_collect)
        csv_name = os.path.basename(csv_filename)

    finally:
        if tmp_path:
            for f_del in os.listdir(tmp_path):
                os.remove(os.path.join(tmp_path, f_del))
            os.rmdir(tmp_path)

    return csv_name


def gem_input_converter(z, input_type, userid, namespace, filename,
                        file_collect, *args):
    """
    a part of mandatory fields, optional are managed as follow:
    input_type == VolConst.ty_shape:
       p_size = args[0]
       attrib = args[1]
       density = args[1]

    input_type == VolConst.ty_text:
       epsg_in = arg[0]

    """
    if input_type == VolConst.ty_shap:
        p_size = args[0]
        attrib = args[1]
        density = args[2]
        return gem_shape_converter(z, userid, namespace, filename,
                                   file_collect, p_size, attrib, density)

