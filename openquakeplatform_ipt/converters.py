from pyproj import Proj, transform
import re
import csv


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

            
    with open ...

