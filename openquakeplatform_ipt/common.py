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

import os
from os.path import basename
from django.conf import settings
from openquakeplatform.python3compat import encode


class VolConst():
    ph_ashf = 'ASH'
    ph_lava = 'LAVA'
    ph_laha = 'LAHAR'
    ph_pyro = 'PYRO'

    ty_text = 'text'
    ty_open = 'openquake'
    ty_shap = 'shape'

    g = 9.80665

    epsg_out = '4326'


def get_tmp_path(userid):
    tmp_path = os.path.normpath(os.path.join(
        settings.FILE_PATH_FIELD_DIRECTORY, userid, 'tmp'))
    if os.path.exists(tmp_path):
        if os.path.isfile(tmp_path):
            raise IOError('[%s] is not a directory' % tmp_path)
    else:
        os.makedirs(tmp_path)
    return tmp_path


def get_full_path(userid, namespace, subdir_and_filename=""):
    return os.path.normpath(os.path.join(settings.FILE_PATH_FIELD_DIRECTORY,
                            userid, namespace, subdir_and_filename))


def zwrite_or_collect(z, userid, namespace, fname, file_collect):
    """if z is None add the couple full_pathname, filename to a list,
    else append the file to the z zip object"""

    zip_filename = basename(fname)
    if z is None:
        for item in file_collect:
            if item[1] == zip_filename:
                raise ValueError(
                    'File "%s" already exists.'
                    ' Upload it again with a different name.' % zip_filename)
        file_collect.append(["file", zip_filename, fname])
    else:
        for item_name in z.namelist():
            if item_name == zip_filename:
                raise ValueError(
                    'File "%s" already exists.'
                    ' Upload it again with a different name.' % zip_filename)
        z.write(get_full_path(userid, namespace, fname),
                zip_filename)


def zwrite_or_collect_str(z, fname, content, file_collect):
    if z is None:
        file_collect.append(["string", fname, content])
    else:
        z.writestr(fname, encode(content))
