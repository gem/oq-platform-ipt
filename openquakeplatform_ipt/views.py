# -*- coding: utf-8 -*-
# vim: tabstop=4 shiftwidth=4 softtabstop=4
#
# Copyright (C) 2016-2017 GEM Foundation
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
import re
import random
import string
import json
import zipfile
import tempfile
import shutil
import requests
import django
import xml.etree.ElementTree as etree

try:
    from email.utils import formatdate
except ImportError:  # Python 2
    from email.Utils import formatdate
from requests import HTTPError
from django.shortcuts import render
from django.http import (HttpResponse,
                         HttpResponseBadRequest,
                         )
from django.conf import settings
from django import forms

from django.template.loader import get_template

from openquakeplatform import __version__ as oqp_version
from openquakeplatform.settings import WEBUIURL, TIME_INVARIANT_OUTPUTS
from openquakeplatform.python3compat import unicode, encode, decode
from openquakeplatform.utils import oq_is_qgis_browser
from openquakeplatform_ipt.build_rupture_plane import get_rupture_surface_round
from distutils.version import StrictVersion

django_version = django.get_version()

if StrictVersion(django_version) < StrictVersion('1.8'):
    from django.template import Context

ALLOWED_DIR = {
    'rupture_file': ('xml',),
    'list_of_sites': ('csv',),
    'gmf_file': ('xml', 'csv'),
    'exposure_csv': ('csv',),
    'exposure_model': ('xml', 'zip'),
    'site_model': ('xml',),
    'site_conditions': ('xml',),
    'imt': ('xml',),
    'fragility_model': ('xml',),
    'fragility_cons': ('xml',),
    'vulnerability_model': ('xml',),
    'gsim_logic_tree_file': ('xml',),
    'source_model_logic_tree_file': ('xml',),
    'source_model_file': ('xml',),

    'ashfall_file': ('csv',),
    'lavaflow_file': ('csv',),
    'lahar_file': ('csv',),
    'pyroclasticflow_file': ('csv',),

    'ashfall_frag_file': ('xml',),
    'ashfall_cons_file': ('xml',),
}

NEEDS_EPSG = ['ashfall_file', 'lavaflow_file', 'lahar_file',
              'pyroclasticflow_file']


def _get_error_line(exc_msg):
    # check if the exc_msg contains a line number indication
    search_match = re.search(r'line \d+', exc_msg)
    if search_match:
        error_line = int(search_match.group(0).split()[1])
    else:
        error_line = None
    return error_line


JSON = 'application/json'


def _make_response(error_msg, error_line, valid):
    response_data = dict(error_msg=error_msg,
                         error_line=error_line,
                         valid=valid)
    return HttpResponse(
        content=json.dumps(response_data), content_type=JSON)


def _do_validate_nrml(xml_text):
    data = dict(xml_text=xml_text)
    ret = requests.post('%sv1/valid/' % WEBUIURL, data)

    if ret.status_code != 200:
        raise HTTPError({'message': "URL '%s' unreachable", 'lineno': -1})

    ret_dict = json.loads(decode(ret.content))

    if not ret_dict['valid']:
        raise ValueError({'message': ret_dict.get('error_msg', ''),
                          'lineno': ret_dict.get('error_line', -1)})


def validate_nrml(request):
    """
    Leverage oq-risklib to check if a given XML text is a valid NRML

    :param request:
        a `django.http.HttpRequest` object containing the mandatory
        parameter 'xml_text': the text of the XML to be validated as NRML

    :returns: a JSON object, containing:
        * 'valid': a boolean indicating if the provided text is a valid NRML
        * 'error_msg': the error message, if any error was found
                       (None otherwise)
        * 'error_line': line of the given XML where the error was found
                        (None if no error was found or if it was not a
                        validation error)
    """
    xml_text = request.POST.get('xml_text')
    if not xml_text:
        return HttpResponseBadRequest(
            'Please provide the "xml_text" parameter')
    try:
        xml_text = xml_text.replace('\r\n', '\n').replace('\r', '\n')
        _do_validate_nrml(xml_text)
    except (HTTPError, ValueError) as e:
        exc = e.args[0]
        return _make_response(error_msg=exc['message'],
                              error_line=exc['lineno'],
                              valid=False)
    except Exception as exc:
        # get the exception message
        exc_msg = exc.args[0]
        if isinstance(exc_msg, bytes):
            exc_msg = decode(exc_msg)   # make it a unicode object
        elif isinstance(exc_msg, unicode):
            pass
        else:
            # if it is another kind of object, it is not obvious a priori how
            # to extract the error line from it
            # but we can attempt anyway to extract it
            error_line = _get_error_line(unicode(exc_msg))
            return _make_response(
                error_msg=unicode(exc_msg), error_line=error_line,
                valid=False)
        error_msg = exc_msg
        error_line = _get_error_line(exc_msg)
        return _make_response(
            error_msg=error_msg, error_line=error_line, valid=False)
    else:
        return _make_response(error_msg=None, error_line=None, valid=True)


def sendback_nrml(request):
    """
    Leverage oq-risklib to check if a given XML text is a valid NRML. If it is,
    save it as a XML file.

    :param request:
        a `django.http.HttpRequest` object containing the mandatory
        parameter 'xml_text': the text of the XML to be validated as NRML
        and the optional parameter 'func_type': the function type (known types
        are ['exposure', 'fragility', 'vulnerability', 'site'])

    :returns: an XML file, containing the given NRML text
    """
    file_list = []
    xml_text = request.POST.get('xml_text')
    func_type = request.POST.get('func_type')
    if not xml_text:
        return HttpResponseBadRequest(
            'Please provide the "xml_text" parameter')
    known_func_types = [
        'exposure', 'fragility', 'consequence', 'vulnerability', 'site',
        'earthquake_rupture']
    try:
        xml_text = xml_text.replace('\r\n', '\n').replace('\r', '\n')
        _do_validate_nrml(xml_text)
        if func_type == u'exposure':
            ns = {'oq': 'http://openquake.org/xmlns/nrml/0.4'}

            root = etree.fromstring(xml_text)
            assets = root.findall('.//oq:assets/oq:asset', ns)

            if not assets:
                assets = root.findall('.//oq:assets', ns)
                file_list = assets[0].text.strip().split()
                file_list = [os.path.join('exposure_csv', f) for f
                             in file_list]
    except:
        return HttpResponseBadRequest(
            'Invalid NRML')

    if file_list:
        if getattr(settings, 'STANDALONE', False):
            userid = ''
        else:
            userid = str(request.user.id)
        namespace = request.resolver_match.namespace

        ext = 'zip'
        (fd, fname) = tempfile.mkstemp(
            suffix='.zip', prefix='ipt_', dir=tempfile.gettempdir())
        fzip = os.fdopen(fd, 'wb')
        file_collect = None
        z = zipfile.ZipFile(fzip, 'w', zipfile.ZIP_DEFLATED,
                            allowZip64=True)
        for csv_fname in file_list:
            print(csv_fname)
            zwrite_or_collect(z, userid, namespace,
                              csv_fname, file_collect)

        zwrite_or_collect_str(z, 'exposure_model.xml', xml_text, file_collect)
        z.close()
        with open(fname, 'rb') as content_file:
            content = content_file.read()
    else:
        content = xml_text
        ext = 'xml'

    if func_type in known_func_types:
        filename = func_type + '_model.%s' % ext
    else:
        filename = 'unknown_model.%s' % ext

    resp = HttpResponse(content=content,
                        content_type='application/%s' % ext)
    resp['Content-Description'] = 'File Transfer'
    resp['Content-Length'] = len(content)
    resp['Content-Disposition'] = (
        'attachment; filename="' + filename + '"')
    return resp


def sendback_er_rupture_surface(request):
    mag = request.POST.get('mag')
    hypo_lat = request.POST.get('hypo_lat')
    hypo_lon = request.POST.get('hypo_lon')
    hypo_depth = request.POST.get('hypo_depth')
    strike = request.POST.get('strike')
    dip = request.POST.get('dip')
    rake = request.POST.get('rake')

    if (mag is None or hypo_lat is None or hypo_lon is None or
            hypo_depth is None or strike is None or dip is None
            or rake is None):
        ret = {'ret': 1, 'ret_s': 'incomplete arguments'}
    else:
        try:
            mag = float(mag)
            hypo_lat = float(hypo_lat)
            hypo_lon = float(hypo_lon)
            hypo_depth = float(hypo_depth)
            strike = float(strike)
            dip = float(dip)
            rake = float(rake)

            ret = get_rupture_surface_round(mag, {"lon": hypo_lon,
                                                  "lat": hypo_lat,
                                                  "depth": hypo_depth},
                                            strike, dip, rake)
            ret['ret'] = 0
            ret['ret_s'] = 'success'
        except Exception as exc:
            ret = {'ret': 2, 'ret_s': 'exception raised: %s' % exc}

    return HttpResponse(json.dumps(ret), content_type="application/json")


class ButtonWidget(forms.widgets.TextInput):
    template_name = 'widgets/button_widget.html'

    def __init__(self, is_bridged=False, name=None, *args, **kwargs):
        print("ButtonWidget init")
        super(ButtonWidget, self).__init__(*args, **kwargs)
        self.gem_is_bridged = is_bridged
        self.gem_name = name

    if StrictVersion(django_version) > StrictVersion('2.0'):
        def get_context(self, name, value, attrs):
            print("ButtonWidget get_context")
            context = super().get_context(name, value, attrs)
            context['widget']['gem_name'] = self.gem_name
            context['widget']['gem_is_bridged'] = self.gem_is_bridged
            return context

    else:
        def render(self, name, value, attrs=None):
            t = get_template(self.template_name)
            if StrictVersion(django_version) >= StrictVersion('1.8'):
                html = t.render(
                    {'widget': {'gem_name': self.gem_name,
                                'gem_is_bridged': self.gem_is_bridged}})
            else:
                html = t.render(Context(
                    {'widget': {
                        'gem_name': self.gem_name,
                        'gem_is_bridged': self.gem_is_bridged}}))
            return html


class ButtonField(forms.Field):
    def __init__(self, is_bridged=False, name=None, *args, **kwargs):
        super(ButtonField, self).__init__(*args, **kwargs)
        self.widget = ButtonWidget(is_bridged, name)


class FileUpload(forms.Form):
    file_upload = forms.FileField(
        allow_empty_file=True, widget=forms.ClearableFileInput(
            attrs={'class': 'hide_file_upload'}))


class FilePathFieldByUser(forms.ChoiceField):
    def __init__(self, is_bridged, userid, subdir, namespace, match=None,
                 recursive=False, allow_files=True,
                 allow_folders=False, required=True, widget=None, label=None,
                 initial=None, help_text=None, *args, **kwargs):
        self.is_bridged = is_bridged
        self.match = match
        self.recursive = recursive
        self.subdir = subdir
        self.userid = str(userid)
        self.namespace = namespace
        self.allow_files, self.allow_folders = allow_files, allow_folders
        super(FilePathFieldByUser, self).__init__(
            choices=(), required=required, widget=widget, label=label,
            initial=initial, help_text=help_text, *args, **kwargs)

        if self.required:
            self.choices = []
        else:
            self.choices = [("", "---------")]

        if self.is_bridged is True:
            self.widget.choices = self.choices
            self.widget.attrs['data-gem-subdir'] = self.subdir
            return

        if self.match is not None:
            self.match_re = re.compile(self.match)

        normalized_path = get_full_path(self.userid, self.namespace,
                                        self.subdir)
        user_allowed_path = get_full_path(self.userid, self.namespace)
        if not normalized_path.startswith(user_allowed_path):
            raise LookupError('Unauthorized path: "%s"' % normalized_path)

        if recursive:
            for root, dirs, files in sorted(os.walk(normalized_path)):
                if self.allow_files:
                    for f in files:
                        if self.match is None or self.match_re.search(f):
                            filename = os.path.basename(f)
                            subdir_and_name = os.path.join(subdir, filename)
                            self.choices.append((subdir_and_name, filename))
                if self.allow_folders:
                    for f in dirs:
                        if f == '__pycache__':
                            continue
                        if self.match is None or self.match_re.search(f):
                            f = os.path.join(root, f)
                            filename = os.path.basename(f)
                            subdir_and_name = os.path.join(subdir, filename)
                            self.choices.append((subdir_and_name, filename))
        else:
            try:
                for f in sorted(os.listdir(normalized_path)):
                    if f == '__pycache__':
                        continue
                    full_file = os.path.normpath(
                        os.path.join(normalized_path, f))
                    if (((self.allow_files and os.path.isfile(full_file)) or
                            (self.allow_folders and os.path.isdir(
                                full_file))) and (self.match is None or
                                                  self.match_re.search(f))):
                        self.choices.append((f, f))
            except OSError:
                pass

        self.widget.choices = self.choices


def filehtml_create(is_bridged, suffix, userid, namespace, dirnam=None,
                    is_multiple=False, name=None):
    if dirnam is None:
        dirnam = suffix
    if (dirnam not in ALLOWED_DIR):
        raise KeyError("dirnam (%s) not in allowed list" % dirnam)

    if name is None:
        name = suffix
    name = name.replace('_', '-')

    if not is_bridged:
        normalized_path = get_full_path(userid, namespace, dirnam)
        user_allowed_path = get_full_path(userid, namespace)
        if not normalized_path.startswith(user_allowed_path):
            raise LookupError('Unauthorized path: "%s"' % normalized_path)
        if not os.path.isdir(normalized_path):
            try:
                os.makedirs(normalized_path)
            except OSError:
                fullpa = normalized_path
                print("makedirs failed, full path: [%s]" % fullpa)
                while fullpa != "/":
                    print("  in while: [%s]" % fullpa)
                    os.system("ls -ld '%s' 1>&2" % fullpa)
                    fullpa = os.path.dirname(fullpa)
                raise

    match = "|".join(
        [".*\\.%s$" % ext for ext in ALLOWED_DIR[dirnam]])

    class FileHtml(forms.Form):
        file_html = FilePathFieldByUser(
            is_bridged=is_bridged,
            userid=userid,
            subdir=dirnam,
            namespace=namespace,
            match=match,
            recursive=True,
            required=is_multiple,
            widget=(forms.fields.SelectMultiple if is_multiple else None))
        new_btn = ButtonField(is_bridged=is_bridged, name=name)
    fh = FileHtml()

    return fh


def _get_available_gsims():

    ret = requests.get('%sv1/available_gsims' % WEBUIURL)

    if ret.status_code != 200:
        raise HTTPError({'message': "URL '%s' unreachable" % WEBUIURL})

    ret_list = json.loads(decode(ret.content))

    return [gsim for gsim in ret_list]


def view(request, **kwargs):
    is_qgis_browser = oq_is_qgis_browser(request)

    if getattr(settings, 'STANDALONE', False):
        userid = ''
    else:
        userid = str(request.user.id)
    namespace = request.resolver_match.namespace
    gmpe = _get_available_gsims()

    rupture_file_html = filehtml_create(
        is_qgis_browser, 'rupture_file', userid, namespace)
    rupture_file_upload = FileUpload()

    list_of_sites_html = filehtml_create(
        is_qgis_browser, 'list_of_sites', userid, namespace)
    list_of_sites_upload = FileUpload()

    gmf_file_html = filehtml_create(
        is_qgis_browser, 'gmf_file', userid, namespace)
    gmf_file_upload = FileUpload()

    exposure_model_html = filehtml_create(
        is_qgis_browser, 'exposure_model', userid, namespace)
    exposure_model_upload = FileUpload()

    exposure_csv_html = filehtml_create(
        is_qgis_browser, 'exposure_csv', userid, namespace,
        is_multiple=True)
    exposure_csv_upload = FileUpload()

    fm_structural_html = filehtml_create(
        is_qgis_browser, 'fm_structural', userid, namespace,
        dirnam='fragility_model')
    fm_structural_upload = FileUpload()
    fm_nonstructural_html = filehtml_create(
        is_qgis_browser, 'fm_nonstructural', userid, namespace,
        dirnam='fragility_model')
    fm_nonstructural_upload = FileUpload()
    fm_contents_html = filehtml_create(
        is_qgis_browser, 'fm_contents', userid, namespace,
        dirnam='fragility_model')
    fm_contents_upload = FileUpload()
    fm_businter_html = filehtml_create(
        is_qgis_browser, 'fm_businter', userid, namespace,
        dirnam='fragility_model')
    fm_businter_upload = FileUpload()

    fm_structural_cons_html = filehtml_create(
        is_qgis_browser, 'fragility_cons', userid, namespace,
        name='fm_structural_cons')
    fm_structural_cons_upload = FileUpload()
    fm_nonstructural_cons_html = filehtml_create(
        is_qgis_browser, 'fragility_cons', userid, namespace,
        name='fm_nonstructural_cons')
    fm_nonstructural_cons_upload = FileUpload()
    fm_contents_cons_html = filehtml_create(
        is_qgis_browser, 'fragility_cons', userid, namespace,
        name='fm_contents_cons')
    fm_contents_cons_upload = FileUpload()
    fm_businter_cons_html = filehtml_create(
        is_qgis_browser, 'fragility_cons', userid, namespace,
        name='fm_businter_cons')
    fm_businter_cons_upload = FileUpload()

    vm_structural_html = filehtml_create(
        is_qgis_browser, 'vm_structural', userid, namespace,
        dirnam='vulnerability_model')
    vm_structural_upload = FileUpload()
    vm_nonstructural_html = filehtml_create(
        is_qgis_browser, 'vm_nonstructural', userid, namespace,
        dirnam='vulnerability_model')
    vm_nonstructural_upload = FileUpload()
    vm_contents_html = filehtml_create(
        is_qgis_browser, 'vm_contents', userid, namespace,
        dirnam='vulnerability_model')
    vm_contents_upload = FileUpload()
    vm_businter_html = filehtml_create(
        is_qgis_browser, 'vm_businter', userid, namespace,
        dirnam='vulnerability_model')
    vm_businter_upload = FileUpload()
    vm_occupants_html = filehtml_create(
        is_qgis_browser, 'vm_occupants', userid, namespace,
        dirnam='vulnerability_model')
    vm_occupants_upload = FileUpload()

    site_conditions_html = filehtml_create(
        is_qgis_browser, 'site_conditions', userid, namespace)
    site_conditions_upload = FileUpload()

    gsim_logic_tree_file_html = filehtml_create(
        is_qgis_browser, 'gsim_logic_tree_file', userid, namespace)
    gsim_logic_tree_file_upload = FileUpload()

    source_model_logic_tree_file_html = filehtml_create(
        is_qgis_browser, 'source_model_logic_tree_file', userid, namespace)
    source_model_logic_tree_file_upload = FileUpload()

    source_model_file_html = filehtml_create(
        is_qgis_browser, 'source_model_file', userid, namespace,
        is_multiple=True)
    source_model_file_upload = FileUpload()

    ashfall_file_html = filehtml_create(
        is_qgis_browser, 'ashfall_file', userid, namespace)
    ashfall_file_upload = FileUpload()

    lavaflow_file_html = filehtml_create(
        is_qgis_browser, 'lavaflow_file', userid, namespace)
    lavaflow_file_upload = FileUpload()

    lahar_file_html = filehtml_create(
        is_qgis_browser, 'lahar_file', userid, namespace)
    lahar_file_upload = FileUpload()

    pyroclasticflow_file_html = filehtml_create(
        is_qgis_browser, 'pyroclasticflow_file', userid, namespace)
    pyroclasticflow_file_upload = FileUpload()

    ashfall_frag_file_html = filehtml_create(
        is_qgis_browser, 'ashfall_frag_file', userid, namespace)
    ashfall_frag_file_upload = FileUpload()

    ashfall_cons_file_html = filehtml_create(
        is_qgis_browser, 'fragility_cons', userid, namespace,
        name='ashfall_cons_file')
    ashfall_cons_file_upload = FileUpload()

    render_dict = dict(
        oqp_version_maj=oqp_version.split('.')[0],
        g_gmpe=json.dumps(gmpe),
        rupture_file_html=rupture_file_html,
        rupture_file_upload=rupture_file_upload,
        list_of_sites_html=list_of_sites_html,
        list_of_sites_upload=list_of_sites_upload,
        gmf_file_html=gmf_file_html,
        gmf_file_upload=gmf_file_upload,
        exposure_model_html=exposure_model_html,
        exposure_model_upload=exposure_model_upload,
        exposure_csv_html=exposure_csv_html,
        exposure_csv_upload=exposure_csv_upload,
        fm_structural_html=fm_structural_html,
        fm_structural_upload=fm_structural_upload,
        fm_nonstructural_html=fm_nonstructural_html,
        fm_nonstructural_upload=fm_nonstructural_upload,
        fm_contents_html=fm_contents_html,
        fm_contents_upload=fm_contents_upload,
        fm_businter_html=fm_businter_html,
        fm_businter_upload=fm_businter_upload,

        fm_structural_cons_html=fm_structural_cons_html,
        fm_structural_cons_upload=fm_structural_cons_upload,
        fm_nonstructural_cons_html=fm_nonstructural_cons_html,
        fm_nonstructural_cons_upload=fm_nonstructural_cons_upload,
        fm_contents_cons_html=fm_contents_cons_html,
        fm_contents_cons_upload=fm_contents_cons_upload,
        fm_businter_cons_html=fm_businter_cons_html,
        fm_businter_cons_upload=fm_businter_cons_upload,

        vm_structural_html=vm_structural_html,
        vm_structural_upload=vm_structural_upload,
        vm_nonstructural_html=vm_nonstructural_html,
        vm_nonstructural_upload=vm_nonstructural_upload,
        vm_contents_html=vm_contents_html,
        vm_contents_upload=vm_contents_upload,
        vm_businter_html=vm_businter_html,
        vm_businter_upload=vm_businter_upload,
        vm_occupants_html=vm_occupants_html,
        vm_occupants_upload=vm_occupants_upload,

        site_conditions_html=site_conditions_html,
        site_conditions_upload=site_conditions_upload,
        gsim_logic_tree_file_html=gsim_logic_tree_file_html,
        gsim_logic_tree_file_upload=gsim_logic_tree_file_upload,

        source_model_logic_tree_file_html=(
            source_model_logic_tree_file_html),
        source_model_logic_tree_file_upload=(
            source_model_logic_tree_file_upload),

        source_model_file_html=source_model_file_html,
        source_model_file_upload=source_model_file_upload,

        ashfall_file_html=ashfall_file_html,
        ashfall_file_upload=ashfall_file_upload,

        lavaflow_file_html=lavaflow_file_html,
        lavaflow_file_upload=lavaflow_file_upload,

        lahar_file_html=lahar_file_html,
        lahar_file_upload=lahar_file_upload,

        pyroclasticflow_file_html=pyroclasticflow_file_html,
        pyroclasticflow_file_upload=pyroclasticflow_file_upload,

        ashfall_frag_file_html=ashfall_frag_file_html,
        ashfall_frag_file_upload=ashfall_frag_file_upload,

        ashfall_cons_file_html=ashfall_cons_file_html,
        ashfall_cons_file_upload=ashfall_cons_file_upload,
    )

    if is_qgis_browser:
        render_dict.update({'allowed_dir': ALLOWED_DIR.keys()})

    return render(request, "ipt/ipt.html", render_dict)


def upload(request, **kwargs):
    ret = {}

    if 'target' not in kwargs:
        ret['ret'] = 3
        ret['ret_msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    target = kwargs['target']
    if target not in ALLOWED_DIR:
        ret['ret'] = 4
        ret['ret_msg'] = 'Unknown target "' + target + '".'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if request.is_ajax():
        if request.method == 'POST':
            class FileUpload(forms.Form):
                file_upload = forms.FileField(allow_empty_file=True)
            form = FileUpload(request.POST, request.FILES)

            if form.is_valid():
                if target in NEEDS_EPSG:
                    if 'epsg' not in request.POST:
                        ret['ret'] = 2
                        ret['ret_msg'] = 'EPSG code not provided'
                        return HttpResponse(json.dumps(ret),
                                            content_type="application/json")

                if (not request.FILES['file_upload'].name.endswith(
                        tuple('.%s' % _ext for _ext in ALLOWED_DIR[target]))):
                    ret['ret'] = 1
                    if len(ALLOWED_DIR[target]) == 1:
                        ret['ret_msg'] = ('File uploaded isn\'t an .%s file.' %
                                          ALLOWED_DIR[target][0].upper())
                    else:
                        ls = ', '.join(['.%s' % ext.upper()
                                        for ext in ALLOWED_DIR[target]])
                        ret['ret_msg'] = ('Type of uploaded file not in the '
                                          'recognized list [%s].' % ls)

                    # Redirect to the document list after POST
                    return HttpResponse(json.dumps(ret),
                                        content_type="application/json")

                if getattr(settings, 'STANDALONE', False):
                    userid = ''
                else:
                    userid = str(request.user.id)
                namespace = request.resolver_match.namespace
                user_dir = get_full_path(userid, namespace)
                bname = os.path.join(user_dir, target)
                # check if the directory exists (or create it)
                if not os.path.exists(bname):
                    os.makedirs(bname)
                full_path = os.path.join(
                    bname, request.FILES['file_upload'].name)
                overwrite_existing_files = request.POST.get(
                    'overwrite_existing_files', True)
                if not overwrite_existing_files:
                    modified_path = full_path
                    n = 0
                    while os.path.isfile(modified_path):
                        n += 1
                        f_name, f_ext = os.path.splitext(full_path)
                        modified_path = '%s_%s%s' % (f_name, n, f_ext)
                    full_path = modified_path
                if not os.path.normpath(full_path).startswith(user_dir):
                    ret['ret'] = 5
                    ret['ret_msg'] = 'Not authorized to write the file.'
                    return HttpResponse(json.dumps(ret),
                                        content_type="application/json")
                with open(full_path, "wb") as f:
                    f.write(encode(request.FILES['file_upload'].read()))

                suffix = target
                match = "|".join(
                    [".*\\.%s$" % ext for ext in ALLOWED_DIR[target]])

                class FileHtml(forms.Form):
                    file_html = FilePathFieldByUser(
                        is_bridged=False,
                        userid=userid,
                        subdir=suffix,
                        namespace=namespace,
                        match=match,
                        recursive=True)

                fileslist = FileHtml()

                ret['ret'] = 0
                ret['items'] = fileslist.fields['file_html'].choices
                orig_file_name = str(request.FILES['file_upload'])
                new_file_name = os.path.basename(full_path)
                ret['selected'] = os.path.join(target, new_file_name)
                changed_msg = ''
                if orig_file_name != new_file_name:
                    changed_msg = ' (Renamed into %s)' % new_file_name
                ret['ret_msg'] = ('File %s uploaded successfully.%s' %
                                  (orig_file_name, changed_msg))

                # Redirect to the document list after POST
                return HttpResponse(json.dumps(ret),
                                    content_type="application/json")
            else:
                if getattr(settings, 'STANDALONE', False):
                    userid = ''
                else:
                    userid = str(request.user.id)
                namespace = request.resolver_match.namespace

                suffix = target
                match = "|".join(
                    [".*\\.%s$" % ext for ext in ALLOWED_DIR[target]])

                class FileHtml(forms.Form):
                    file_html = FilePathFieldByUser(
                        is_bridged=False,
                        userid=userid,
                        subdir=suffix,
                        namespace=namespace,
                        match=match,
                        recursive=True)

                fileslist = FileHtml()

                ret['ret'] = 0
                ret['items'] = fileslist.fields['file_html'].choices
                ret['ret_msg'] = 'List updated'

                # Redirect to the document list after POST
                return HttpResponse(json.dumps(ret),
                                    content_type="application/json")
    ret['ret'] = 2
    ret['ret_msg'] = 'Please provide the file.'

    return HttpResponse(json.dumps(ret), content_type="application/json")


def get_full_path(userid, namespace, subdir_and_filename=""):
    return os.path.normpath(os.path.join(settings.FILE_PATH_FIELD_DIRECTORY,
                            userid,
                            namespace,
                            subdir_and_filename))


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


def exposure_model_prep_sect(data, z, is_regcons, userid, namespace,
                             file_collect, save_files=True):
    jobini = "\n[Exposure model]\n"
    #           ################

    jobini += "exposure_file = %s\n" % basename(data['exposure_model'])
    if save_files is True:
        zwrite_or_collect(z, userid, namespace, data['exposure_model'],
                          file_collect)
    if is_regcons:
        if data['exposure_model_regcons_choice'] is True:
            is_first = True
            jobini += "region_constraint = "
            for el in data['exposure_model_regcons_coords_data']:
                if is_first:
                    is_first = False
                else:
                    jobini += ", "
                jobini += "%s %s" % (el[0], el[1])
            jobini += "\n"

        if data['asset_hazard_distance_choice'] is True:
            jobini += ("asset_hazard_distance = %s\n" %
                       data['asset_hazard_distance'])

    return jobini


def vulnerability_model_prep_sect(data, z, userid, namespace, file_collect,
                                  save_files=True, with_ensloss=True):
    jobini = "\n[Vulnerability model]\n"
    #            #####################
    descr = {'structural': 'structural', 'nonstructural': 'nonstructural',
             'contents': 'contents', 'businter': 'business_interruption',
             'occupants': 'occupants'}
    for losslist in ['structural', 'nonstructural', 'contents', 'businter',
                     'occupants']:
        if data['vm_loss_%s_choice' % losslist] is True:
            jobini += "%s_vulnerability_file = %s\n" % (
                descr[losslist], basename(data['vm_loss_' + losslist]))
            if save_files is True:
                zwrite_or_collect(z, userid, namespace,
                                  data['vm_loss_%s' % losslist],
                                  file_collect)

    if with_ensloss is True:
        jobini += "insured_losses = %s\n" % (
            "True" if data['insured_losses'] else "False")

        if data['asset_correlation_choice']:
            jobini += "asset_correlation = %s" % data['asset_correlation']

    return jobini


def site_conditions_prep_sect(data, z, userid, namespace, file_collect):
    jobini = "\n[Site conditions]\n"
    #           #################

    if data['site_conditions_choice'] == 'from-file':
        jobini += ("site_model_file = %s\n" %
                   basename(data['site_model_file']))
        zwrite_or_collect(z, userid, namespace, data['site_model_file'],
                          file_collect)
    elif data['site_conditions_choice'] == 'uniform-param':
        jobini += "reference_vs30_value = %s\n" % data['reference_vs30_value']
        jobini += "reference_vs30_type = %s\n" % data['reference_vs30_type']
        jobini += ("reference_depth_to_2pt5km_per_sec = %s\n" %
                   data['reference_depth_to_2pt5km_per_sec'])
        jobini += ("reference_depth_to_1pt0km_per_sec = %s\n" %
                   data['reference_depth_to_1pt0km_per_sec'])
    return jobini


def scenario_prepare(request, **kwargs):
    ret = {}

    if request.POST.get('data', '') == '':
        ret['ret'] = 1
        ret['msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if getattr(settings, 'STANDALONE', False):
        userid = ''
    else:
        userid = str(request.user.id)

    is_qgis_browser = oq_is_qgis_browser(request)

    namespace = request.resolver_match.namespace

    data = json.loads(request.POST.get('data'))

    if not is_qgis_browser:
        (fd, fname) = tempfile.mkstemp(
            suffix='.zip', prefix='ipt_', dir=tempfile.gettempdir())
        fzip = os.fdopen(fd, 'wb')
        z = zipfile.ZipFile(fzip, 'w', zipfile.ZIP_DEFLATED, allowZip64=True)
        file_collect = None
    else:
        z = None
        file_collect = []
        fname = 'ipt_' + ''.join(random.choice(
            string.ascii_lowercase + string.digits) for _ in range(8)) + '.zip'

    jobini = "# Generated automatically with IPT at %s\n" % (
        "TESTING TIME" if TIME_INVARIANT_OUTPUTS else formatdate())
    jobini += "[general]\n"
    jobini += "description = %s\n" % data['description']

    if data['risk'] == 'damage':
        jobini += "calculation_mode = scenario_damage\n"
    elif data['risk'] == 'losses':
        jobini += "calculation_mode = scenario_risk\n"
    elif data['hazard'] == 'hazard':
        jobini += "calculation_mode = scenario\n"
    else:
        ret['ret'] = 2
        ret['msg'] = 'Neither hazard nor risk selected.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    jobini += "random_seed = 113\n"

    if (data['hazard'] is None and data['risk'] is not None and
            data['gmf_file'] is not None):
        jobini += "\n[hazard]\n"
        jobini += ("gmfs_file = %s\n" % basename(data['gmf_file']))
        zwrite_or_collect(z, userid, namespace, data['gmf_file'], file_collect)

    if data['hazard'] == 'hazard':
        jobini += "\n[Rupture information]\n"
        #            #####################

        jobini += ("rupture_model_file = %s\n" %
                   basename(data['rupture_model_file']))
        zwrite_or_collect(z, userid, namespace, data['rupture_model_file'],
                          file_collect)

        jobini += "rupture_mesh_spacing = %s\n" % data['rupture_mesh_spacing']

    if data['hazard'] == 'hazard':
        jobini += "\n[Hazard sites]\n"
        #            ##############

        if data['hazard_sites_choice'] == 'region-grid':
            jobini += "region_grid_spacing = %s\n" % data['grid_spacing']
            if data['region_grid_choice'] == 'region-coordinates':
                is_first = True
                jobini += "region = "
                for el in data['reggrid_coords_data']:
                    if is_first:
                        is_first = False
                    else:
                        jobini += ", "
                    jobini += "%s %s" % (el[0], el[1])
                jobini += "\n"
        elif data['hazard_sites_choice'] == 'list-of-sites':
            jobini += "sites_csv = %s\n" % basename(data['list_of_sites'])
            zwrite_or_collect(z, userid, namespace, data['list_of_sites'],
                              file_collect)

        elif data['hazard_sites_choice'] == 'exposure-model':
            pass
        elif data['hazard_sites_choice'] == 'site-cond-model':
            if data['site_conditions_choice'] != 'from-file':
                ret['ret'] = 4
                ret['msg'] = ('Input hazard sites choices mismatch method to '
                              'specify site conditions.')
                return HttpResponse(json.dumps(ret),
                                    content_type="application/json")
        else:
            ret['ret'] = 4
            ret['msg'] = 'Unknown hazard_sites_choice.'
            return HttpResponse(json.dumps(ret),
                                content_type="application/json")

    if ((data['hazard'] == 'hazard' and
         data['hazard_sites_choice'] == 'exposure-model') or
            data['risk'] is not None):
        jobini += exposure_model_prep_sect(data, z, (data['risk'] is not None),
                                           userid, namespace, file_collect)

    if data['risk'] == 'damage':
        jobini += "\n[Fragility model]\n"
        #            #################
        descr = {'structural': 'structural', 'nonstructural': 'nonstructural',
                 'contents': 'contents', 'businter': 'business_interruption'}
        with_cons = data['fm_loss_show_cons_choice']
        for losslist in ['structural', 'nonstructural',
                         'contents', 'businter']:
            if data['fm_loss_%s_choice' % losslist] is True:
                jobini += "%s_fragility_file = %s\n" % (
                    descr[losslist],
                    basename(data['fm_loss_' + losslist]))
                zwrite_or_collect(z, userid, namespace,
                                  data['fm_loss_' + losslist], file_collect)
                if with_cons is True:
                    jobini += "%s_consequence_file = %s\n" % (
                        descr[losslist],
                        basename(data['fm_loss_%s_cons' % losslist]))
                    zwrite_or_collect(z, userid, namespace,
                                      data['fm_loss_%s_cons' % losslist],
                                      file_collect)
    elif data['risk'] == 'losses':
        jobini += vulnerability_model_prep_sect(data, z, userid, namespace,
                                                file_collect, save_files=True)

    if data['hazard'] == 'hazard':
        jobini += site_conditions_prep_sect(data, z, userid, namespace,
                                            file_collect)

    if data['hazard'] == 'hazard':
        jobini += "\n[Calculation parameters]\n"
        #            ########################

        gsim_n = len(data['gsim'])
        gsim_w = [0] * gsim_n
        for i in range(0, (gsim_n - 1)):
            gsim_w[i] = "%1.3f" % (1.0 / float(gsim_n))

        gsim_w[gsim_n - 1] = "%1.3f" % (1.0 - (float(
            gsim_w[0]) * (gsim_n - 1)))

        jobini += "gsim_logic_tree_file = gmpe.xml\n"

        gmpe = "<?xml version='1.0' encoding='utf-8'?>\n\
<nrml xmlns:gml='http://www.opengis.net/gml'\n\
      xmlns='http://openquake.org/xmlns/nrml/0.5'>\n\
\n\
<logicTree logicTreeID='lt1'>\n\
  <logicTreeBranchingLevel branchingLevelID='bl1'>\n\
    <logicTreeBranchSet uncertaintyType='gmpeModel'\n\
                        branchSetID='bs1' \n\
                        applyToTectonicRegionType='Active Shallow Crust'>\n"

        for i in range(0, gsim_n):
            gmpe += "      <logicTreeBranch branchID='b%d'>\n\
        <uncertaintyModel>%s</uncertaintyModel>\n\
        <uncertaintyWeight>%s</uncertaintyWeight>\n\
      </logicTreeBranch>\n" % (i, data['gsim'][i], gsim_w[i])

        gmpe += "    </logicTreeBranchSet>\n\
  </logicTreeBranchingLevel>\n\
</logicTree>\n\
</nrml>\n"

        zwrite_or_collect_str(z, 'gmpe.xml', gmpe, file_collect)

        if data['risk'] is None:
            jobini += "intensity_measure_types = "
            is_first = True
            for imt in data['intensity_measure_types']:
                if is_first:
                    is_first = False
                else:
                    jobini += ", "
                jobini += imt
            if data['custom_imt'] != '':
                if not is_first:
                    jobini += ", "
                jobini += data['custom_imt']
            jobini += "\n"

        jobini += ("ground_motion_correlation_model = %s\n" %
                   data['ground_motion_correlation_model'])
        if data['ground_motion_correlation_model'] == 'JB2009':
            jobini += ("ground_motion_correlation_params = "
                       "{\"vs30_clustering\": False}\n")

        jobini += "truncation_level = %s\n" % data['truncation_level']
        jobini += "maximum_distance = %s\n" % data['maximum_distance']
        jobini += ("number_of_ground_motion_fields = %s\n" %
                   data['number_of_ground_motion_fields'])

    print(encode(jobini))

    zwrite_or_collect_str(z, 'job.ini', jobini, file_collect)

    if is_qgis_browser:
        ret['ret'] = 0
        ret['msg'] = 'Success, scenario prepared correctly.'
        ret['content'] = file_collect
    else:
        z.close()
        ret['ret'] = 0
        ret['msg'] = 'Success, download it.'

    ret['zipname'] = os.path.basename(fname)

    return HttpResponse(json.dumps(ret),
                        content_type="application/json")


def event_based_prepare(request, **kwargs):
    ret = {}
    vuln_file_saved = False
    expo_file_saved = False

    if request.POST.get('data', '') == '':
        ret['ret'] = 1
        ret['msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if getattr(settings, 'STANDALONE', False):
        userid = ''
    else:
        userid = str(request.user.id)

    is_qgis_browser = oq_is_qgis_browser(request)

    namespace = request.resolver_match.namespace

    data = json.loads(request.POST.get('data'))

    if not is_qgis_browser:
        (fd, fname) = tempfile.mkstemp(
            suffix='.zip', prefix='ipt_', dir=tempfile.gettempdir())
        fzip = os.fdopen(fd, 'wb')
        z = zipfile.ZipFile(fzip, 'w', zipfile.ZIP_DEFLATED, allowZip64=True)
        file_collect = None
    else:
        z = None
        fname = 'ipt_' + ''.join(random.choice(
            string.ascii_lowercase + string.digits) for _ in range(8)) + '.zip'
        file_collect = []

    jobhaz = ""
    jobris = ""

    if data['hazard'] == 'hazard':
        jobhaz += "# Generated automatically with IPT at %s\n" % (
            "TESTING TIME" if TIME_INVARIANT_OUTPUTS else formatdate())
        jobhaz += "[general]\n"
        jobhaz += "description = %s\n" % data['description']

        jobhaz += "calculation_mode = event_based\n"

        jobhaz += "\n[Hazard sites]\n"
        #            ##############

        if data['hazard_sites_choice'] == 'region-grid':
            jobhaz += "region_grid_spacing = %s\n" % data['grid_spacing']
            if data['region_grid_choice'] == 'region-coordinates':
                is_first = True
                jobhaz += "region = "
                for el in data['reggrid_coords_data']:
                    if is_first:
                        is_first = False
                    else:
                        jobhaz += ", "
                    jobhaz += "%s %s" % (el[0], el[1])
                jobhaz += "\n"
        elif data['hazard_sites_choice'] == 'list-of-sites':
            jobhaz += "sites_csv = %s\n" % basename(data['list_of_sites'])
            zwrite_or_collect(z, userid, namespace, data['list_of_sites'],
                              file_collect)
        elif data['hazard_sites_choice'] == 'exposure-model':
            pass
        else:
            ret['ret'] = 4
            ret['msg'] = 'Unknown hazard_sites_choice.'
            return HttpResponse(json.dumps(ret),
                                content_type="application/json")

        # Site conditions
        jobhaz += site_conditions_prep_sect(data, z, userid, namespace,
                                            file_collect)

        # Hazard model
        jobhaz += "source_model_logic_tree_file = %s\n" % basename(
            data['source_model_logic_tree_file'])
        zwrite_or_collect(z, userid, namespace,
                          data['source_model_logic_tree_file'],
                          file_collect)

        for source_model_name in data['source_model_file']:
            zwrite_or_collect(z, userid, namespace, source_model_name,
                              file_collect)

        jobhaz += "gsim_logic_tree_file = %s\n" % basename(
            data['gsim_logic_tree_file'])
        zwrite_or_collect(z, userid, namespace, data['gsim_logic_tree_file'],
                          file_collect)

        jobhaz += "\n[Hazard model]\n"
        #            ##############
        jobhaz += "width_of_mfd_bin = %s\n" % data['width_of_mfd_bin']

        if data['rupture_mesh_spacing_choice'] is True:
            jobhaz += ("rupture_mesh_spacing = %s\n" %
                       data['rupture_mesh_spacing'])
        if data['area_source_discretization_choice'] is True:
            jobhaz += ("area_source_discretization = %s\n" %
                       data['area_source_discretization'])
        if data['complex_fault_mesh_choice'] is True:
            jobhaz += ("complex_fault_mesh_spacing = %s\n" %
                       data['complex_fault_mesh'])

        if (data['risk'] is None and data['use_imt_from_vulnerability']
                is True) or data['risk'] == 'risk':
            jobhaz += vulnerability_model_prep_sect(
                data, z, userid, namespace, file_collect,
                save_files=(not vuln_file_saved), with_ensloss=False)
            vuln_file_saved = True

        jobhaz += "\n[Hazard calculation]\n"
        #            ####################

        if data['risk'] is None:
            jobhaz += "intensity_measure_types = "
            is_first = True
            for imt in data['intensity_measure_types']:
                if is_first:
                    is_first = False
                else:
                    jobhaz += ", "
                jobhaz += imt
            if data['custom_imt'] != '':
                if not is_first:
                    jobhaz += ", "
                jobhaz += data['custom_imt']
            jobhaz += "\n"

        jobhaz += ("ground_motion_correlation_model = %s\n" %
                   data['ground_motion_correlation_model'])
        if data['ground_motion_correlation_model'] == 'JB2009':
            jobhaz += ("ground_motion_correlation_params = "
                       "{\"vs30_clustering\": True}")
        jobhaz += "maximum_distance = %s\n" % data['maximum_distance']
        jobhaz += "truncation_level = %s\n" % data['truncation_level']
        jobhaz += "investigation_time = %s\n" % data['investigation_time']
        jobhaz += ("ses_per_logic_tree_path = %s\n" %
                   data['ses_per_logic_tree_path'])
        jobhaz += ("number_of_logic_tree_samples = %s\n" %
                   data['number_of_logic_tree_samples'])

        jobhaz += "\n[Hazard outputs]\n"
        #             ################
        jobhaz += "save_ruptures = %s\n" % data['save_ruptures']
        jobhaz += ("ground_motion_fields = %s\n" %
                   data['ground_motion_fields'])
        jobhaz += ("hazard_curves_from_gmfs = %s\n" %
                   data['hazard_curves_from_gmfs'])
        if data['hazard_curves_from_gmfs']:
            jobhaz += "mean_hazard_curves = %s\n" % False
            if data['quantile_hazard_curves_choice']:
                jobhaz += ("quantile_hazard_curves = %s\n" %
                           data['quantile_hazard_curves'])
        jobhaz += "hazard_maps = %s\n" % data['hazard_maps']
        if data['hazard_maps']:
            jobhaz += "poes = %s\n" % data['poes']
        jobhaz += ("uniform_hazard_spectra = %s\n" %
                   data['uniform_hazard_spectra'])

    # Exposure model
    if data['risk'] == 'risk':
        jobris += exposure_model_prep_sect(
            data, z, (data['risk'] is not None), userid, namespace,
            file_collect, save_files=(not expo_file_saved))
        expo_file_saved = True

    if (data['hazard'] == 'hazard' and
        (data['hazard_sites_choice'] == 'exposure-model' or
         data['region_grid_choice'] == 'infer-from-exposure')):
        jobhaz += exposure_model_prep_sect(
            data, z, False, userid, namespace, file_collect,
            save_files=(not expo_file_saved))
        expo_file_saved = True

    if data['risk'] == 'risk':
        # Vulnerability model
        jobris += vulnerability_model_prep_sect(
            data, z, userid, namespace, file_collect,
            save_files=(not vuln_file_saved))
        vuln_file_saved = True

        jobris += "\n[Risk calculation]\n"
        #            ##################
        jobris += ("risk_investigation_time = %s\n" %
                   data['risk_investigation_time'])
        if data['ret_periods_for_aggr'] is not None:
            jobris += ("return_periods = [%s]\n" %
                       data['ret_periods_for_aggr'])

        jobris += "\n[Risk outputs]\n"
        #            ##############
        if data['quantile_loss_curves_choice']:
            jobris += ("quantile_loss_curves = %s\n" %
                       data['quantile_loss_curves'])
        if data['conditional_loss_poes_choice']:
            jobris += ("conditional_loss_poes = %s\n" %
                       data['conditional_loss_poes'])

    if data['hazard'] == 'hazard':
        zwrite_or_collect_str(z, 'job_hazard.ini', jobhaz, file_collect)

    if jobris != "":
        jobris_head = "# Generated automatically with IPT at %s\n" % (
            "TESTING TIME" if TIME_INVARIANT_OUTPUTS else formatdate())
        jobris_head += "[general]\n"
        jobris_head += "description = %s\n" % data['description']

        jobris_head += "calculation_mode = event_based_risk\n"

        jobris = jobris_head + jobris
        zwrite_or_collect_str(z, 'job_risk.ini', jobris, file_collect)

    if is_qgis_browser:
        ret['ret'] = 0
        ret['msg'] = 'Success, event based prepared correctly.'
        ret['content'] = file_collect
    else:
        z.close()
        ret['ret'] = 0
        ret['msg'] = 'Success, download it.'

    ret['zipname'] = os.path.basename(fname)

    return HttpResponse(json.dumps(ret), content_type="application/json")


def volcano_prepare(request, **kwargs):
    ret = {}

    if request.POST.get('data', '') == '':
        ret['ret'] = 1
        ret['msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if getattr(settings, 'STANDALONE', False):
        userid = ''
    else:
        userid = str(request.user.id)

    is_qgis_browser = oq_is_qgis_browser(request)

    namespace = request.resolver_match.namespace

    data = json.loads(request.POST.get('data'))

    if not is_qgis_browser:
        (fd, fname) = tempfile.mkstemp(
            suffix='.zip', prefix='ipt_', dir=tempfile.gettempdir())
        fzip = os.fdopen(fd, 'wb')
        z = zipfile.ZipFile(fzip, 'w', zipfile.ZIP_DEFLATED, allowZip64=True)
        file_collect = None
    else:
        z = None
        fname = 'ipt_' + ''.join(random.choice(
            string.ascii_lowercase + string.digits) for _ in range(8)) + '.zip'
        file_collect = []

    jobris = ""

    jobris += "# Generated automatically with IPT at %s\n" % (
        "TESTING TIME" if TIME_INVARIANT_OUTPUTS else formatdate())
    jobris += "[general]\n"
    jobris += "description = %s\n" % data['description']

    jobris += "calculation_mode = scenario_damage\n"

    jobris += "\n[Volcano information]\n"

    phenoms = {
        'ASH': data['ashfall_file'] if data['ashfall_choice'] else None,
        'LAVA': data['lavaflow_file'] if data['lavaflow_choice'] else None,
        'LAHAR': data['lahar_file'] if data['lahar_choice'] else None,
        'PYRO': (data['pyroclasticflow_file'] if data['pyroclasticflow_choice']
                 else None)
    }

    try:
        phenom_arr = []
        for key in phenoms.keys():
            if phenoms[key] is None:
                continue

            # FIXME: here all conversions based on types
            zwrite_or_collect(z, userid, namespace, phenoms[key],
                              file_collect)

            phenom_arr.append("'%s': '%s'" % (key, basename(phenoms[key])))

        jobris += 'multi_peril_csv = {' + ', '.join(phenom_arr) + '}\n'

        if data['ashfall_choice']:
            jobris += 'humidity_amplification_factor = %f\n' % float(
                data['ashfall_hum_ampl'])

        jobris += exposure_model_prep_sect(
            data, z, True, userid, namespace, file_collect)

        if data['ashfall_choice']:
            jobris += "\n[Fragility model]\n"

            zwrite_or_collect(z, userid, namespace, data['ashfall_frag_file'],
                              file_collect)
            jobris += ("structural_fragility_file = '%s'\n" %
                       basename(data['ashfall_frag_file']))

            if data['ashfall_cons_models_choice']:
                zwrite_or_collect(z, userid, namespace,
                                  data['ashfall_cons_models_file'], file_collect)
                jobris += ("structural_consequence_file = '%s'\n" %
                           basename(data['ashfall_cons_models_file']))

        zwrite_or_collect_str(z, 'job_risk.ini', jobris, file_collect)
    except ValueError as err:
        ret['ret'] = 2
        ret['msg'] = err.message
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if is_qgis_browser:
        ret['ret'] = 0
        ret['msg'] = 'Success, event based prepared correctly.'
        ret['content'] = file_collect
    else:
        z.close()
        ret['ret'] = 0
        ret['msg'] = 'Success, download it.'

    ret['zipname'] = os.path.basename(fname)

    return HttpResponse(json.dumps(ret), content_type="application/json")


def download(request):
    if request.method == 'POST':
        zipname = request.POST.get('zipname', '')
        dest_name = request.POST.get('dest_name', 'Unknown')
        if zipname == '':
            return HttpResponseBadRequest('No zipname provided.')
        absfile = os.path.join(tempfile.gettempdir(), zipname)
        if not os.path.isfile(absfile):
            return HttpResponseBadRequest('Zipfile not found.')
        with open(absfile, 'rb') as content_file:
            content = content_file.read()

        resp = HttpResponse(content=content,
                            content_type='application/zip')
        resp['Content-Description'] = 'File Transfer'
        resp['Content-Disposition'] = (
            'attachment; filename="' + dest_name + '.zip"')
        resp['Content-Length'] = len(content)
        return resp


def clean_all(request):
    if request.method == 'POST':
        if getattr(settings, 'STANDALONE', False):
            userid = ''
        else:
            userid = str(request.user.id)
        namespace = request.resolver_match.namespace
        user_allowed_path = get_full_path(userid, namespace)
        for ipt_dir in ALLOWED_DIR:
            normalized_path = get_full_path(userid, namespace, ipt_dir)
            if not normalized_path.startswith(user_allowed_path):
                raise LookupError('Unauthorized path: "%s"' % normalized_path)
            if not os.path.isdir(normalized_path):
                continue
            shutil.rmtree(normalized_path)
            os.makedirs(normalized_path)

        ret = {}
        ret['ret'] = 0
        ret['msg'] = 'Success, reload it.'
        return HttpResponse(json.dumps(ret), content_type="application/json")
