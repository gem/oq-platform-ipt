# Copyright (c) 2012-2015, GEM Foundation.
#
# This program is free software: you can redistribute it and/or modify
# under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

import os
import re
import time
import json
import zipfile
import tempfile
from email.Utils import formatdate

from lxml import etree
from django.shortcuts import render_to_response
from django.http import (HttpResponse,
                         HttpResponseBadRequest,
                         HttpResponseRedirect
)
from django.template import RequestContext
from openquakeplatform_server import settings
from openquake.hazardlib import gsim
from django import forms
from models import ServerSide

def _get_error_line(exc_msg):
    # check if the exc_msg contains a line number indication
    search_match = re.search(r'line \d+', exc_msg)
    if search_match:
        error_line = int(search_match.group(0).split()[1])
    else:
        error_line = None
    return error_line


def _make_response(error_msg, error_line, valid):
    response_data = dict(error_msg=error_msg,
                         error_line=error_line,
                         valid=valid)
    return HttpResponse(
        content=json.dumps(response_data), content_type=JSON)

JSON = 'application/json'


def _do_validate_nrml(xml_text):
    from openquake.baselib.general import writetmp
    from openquake.commonlib import nrml
    xml_file = writetmp(xml_text, suffix='.xml')
    nrml.parse(xml_file)


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
        _do_validate_nrml(xml_text)
    except etree.ParseError as exc:
        return _make_response(error_msg=exc.message.message,
                              error_line=exc.message.lineno,
                              valid=False)
    except Exception as exc:
        # get the exception message
        exc_msg = exc.args[0]
        if isinstance(exc_msg, bytes):
            exc_msg = exc_msg.decode('utf-8')   # make it a unicode object
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
    xml_text = request.POST.get('xml_text')
    func_type = request.POST.get('func_type')
    if not xml_text:
        return HttpResponseBadRequest(
            'Please provide the "xml_text" parameter')
    known_func_types = [
        'exposure', 'fragility', 'vulnerability', 'site']
    try:
        _do_validate_nrml(xml_text)
    except:
        return HttpResponseBadRequest(
            'Invalid NRML')
    else:
        if func_type in known_func_types:
            filename = func_type + '_model.xml'
        else:
            filename = 'unknown_model.xml'
        resp = HttpResponse(content=xml_text,
                            content_type='application/xml')
        resp['Content-Disposition'] = (
            'attachment; filename="' + filename + '"')
        return resp


class FileUpload(forms.Form):
    file_upload = forms.FileField()


class FilePathFieldByUser(forms.ChoiceField):
    def __init__(self, basepath, userid, subdir, app_name, match=None, recursive=False, allow_files=True,
                 allow_folders=False, required=True, widget=None, label=None,
                 initial=None, help_text=None, *args, **kwargs):
        self.basepath, self.match, self.recursive = basepath, match, recursive
        self.subdir = subdir
        self.userid = str(userid)
        self.app_name = app_name
        self.allow_files, self.allow_folders = allow_files, allow_folders
        super(FilePathFieldByUser, self).__init__(choices=(), required=required,
            widget=widget, label=label, initial=initial, help_text=help_text,
            *args, **kwargs)

        if self.required:
            self.choices = []
        else:
            self.choices = [("", "---------")]

        if self.match is not None:
            self.match_re = re.compile(self.match)

        normalized_path = os.path.normpath(
            os.path.join(self.basepath, self.userid, self.app_name, self.subdir))
        allowed_path = os.path.join(self.basepath, self.userid, self.app_name)
        if not normalized_path.startswith(allowed_path):
            raise LookupError('Unauthorized path: "%s"' % normalized_path)

        if recursive:
            for root, dirs, files in sorted(os.walk(normalized_path)):
                if self.allow_files:
                    for f in files:
                        if self.match is None or self.match_re.search(f):
                            filename = os.path.basename(f)
                            self.choices.append((filename, filename))
                            # f = os.path.join(root, f)
                            # self.choices.append((f, f.replace(os.path.join(self.basepath, self.userid, path), "", 1)))
                if self.allow_folders:
                    for f in dirs:
                        if f == '__pycache__':
                            continue
                        if self.match is None or self.match_re.search(f):
                            f = os.path.join(root, f)
                            filename = os.path.basename(f)
                            self.choices.append((filename, filename))
                            # self.choices.append((f, f.replace(os.path.join(self.basepath, self.userid, path), "", 1)))
        else:
            try:
                for f in sorted(os.listdir(normalized_path)):
                    if f == '__pycache__':
                        continue
                    full_file = os.path.normpath(os.path.join(normalized_path, f))
                    if (((self.allow_files and os.path.isfile(full_file)) or
                        (self.allow_folders and os.path.isdir(full_file))) and
                        (self.match is None or self.match_re.search(f))):
                        self.choices.append((f, f))
                        # self.choices.append((full_file, f))
            except OSError:
                pass

        self.widget.choices = self.choices

def filehtml_create(suffix, userid, dirnam=None, match=".*\.xml"):
    if dirnam == None:
        dirnam = suffix
    class FileHtml(forms.Form):
        file_html = FilePathFieldByUser(
            basepath=settings.FILE_PATH_FIELD_DIRECTORY,
            userid=userid,
            subdir=dirnam,
            app_name='ipt',  # FIXME: where should I get the app_name?
            match=match, recursive=True)
    fh = FileHtml()
    fh.fields['file_html'].choices.insert(0, ('', u'- - - - -'))
    fh.fields['file_html'].widget.choices.insert(0, ('', u'- - - - -'))
    return fh

def view(request, **kwargs):
    try:
        userid = str(request.user.id)
    except:
        userid = ''
    gmpe = list(gsim.get_available_gsims())

    rupture_file_html = filehtml_create('rupture_file', userid=userid)
    rupture_file_upload = FileUpload()

    list_of_sites_html = filehtml_create(
        'list_of_sites', userid=userid, match=".*\.csv")
    list_of_sites_upload = FileUpload()

    exposure_model_html = filehtml_create('exposure_model', userid=userid)
    exposure_model_upload = FileUpload()

    site_model_html = filehtml_create('site_model', userid=userid)
    site_model_upload = FileUpload()

    fm_structural_html = filehtml_create(
        'fm_structural', dirnam='fragility_model', userid=userid)
    fm_structural_upload = FileUpload()
    fm_nonstructural_html = filehtml_create(
        'fm_nonstructural', dirnam='fragility_model', userid=userid)
    fm_nonstructural_upload = FileUpload()
    fm_contents_html = filehtml_create(
        'fm_contents', dirnam='fragility_model', userid=userid)
    fm_contents_upload = FileUpload()
    fm_businter_html = filehtml_create(
        'fm_businter', dirnam='fragility_model', userid=userid)
    fm_businter_upload = FileUpload()

    fm_structural_cons_html = filehtml_create(
        'fragility_cons', userid=userid)
    fm_structural_cons_upload = FileUpload()
    fm_nonstructural_cons_html = filehtml_create(
        'fragility_cons', userid=userid)
    fm_nonstructural_cons_upload = FileUpload()
    fm_contents_cons_html = filehtml_create(
        'fragility_cons', userid=userid)
    fm_contents_cons_upload = FileUpload()
    fm_businter_cons_html = filehtml_create(
        'fragility_cons', userid=userid)
    fm_businter_cons_upload = FileUpload()

    vm_structural_html = filehtml_create(
        'vm_structural', dirnam='vulnerability_model', userid=userid)
    vm_structural_upload = FileUpload()
    vm_nonstructural_html = filehtml_create(
        'vm_nonstructural', dirnam='vulnerability_model', userid=userid)
    vm_nonstructural_upload = FileUpload()
    vm_contents_html = filehtml_create(
        'vm_contents', dirnam='vulnerability_model', userid=userid)
    vm_contents_upload = FileUpload()
    vm_businter_html = filehtml_create(
        'vm_businter', dirnam='vulnerability_model', userid=userid)
    vm_businter_upload = FileUpload()
    vm_occupants_html = filehtml_create(
        'vm_occupants', dirnam='vulnerability_model', userid=userid)
    vm_occupants_upload = FileUpload()

    site_conditions_html = filehtml_create(
        'site_conditions', userid=userid)
    site_conditions_upload = FileUpload()

    imt_html = filehtml_create('imt', userid=userid)
    imt_upload = FileUpload()

    fravul_model_html = filehtml_create('fravul_model', userid=userid)
    fravul_model_upload = FileUpload()

    return render_to_response("ipt/ipt.html",
                              dict(
                                  g_gmpe=gmpe,
                                  rupture_file_html=rupture_file_html,
                                  rupture_file_upload=rupture_file_upload,
                                  list_of_sites_html=list_of_sites_html,
                                  list_of_sites_upload=list_of_sites_upload,
                                  exposure_model_html=exposure_model_html,
                                  exposure_model_upload=exposure_model_upload,
                                  site_model_html=site_model_html,
                                  site_model_upload=site_model_upload,

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
                                  imt_html=imt_html,
                                  imt_upload=imt_upload,
                                  fravul_model_html=fravul_model_html,
                                  fravul_model_upload=fravul_model_upload,
                              ),
                              context_instance=RequestContext(request))


def upload(request, **kwargs):
    ret = {}

    print "UPLOAD"
    if 'target' not in kwargs:
        ret['ret'] = 3
        ret['ret_msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    target = kwargs['target']
    if target not in ['rupture_file', 'list_of_sites', 'exposure_model',
                      'site_model', 'site_conditions', 'imt', 'fravul_model',
                      'fragility_model', 'fragility_cons',
                      'vulnerability_model']:
        ret['ret'] = 4
        ret['ret_msg'] = 'Unknown target "%s".' % target
        return HttpResponse(json.dumps(ret), content_type="application/json")

    if request.is_ajax():
        if request.method == 'POST':
            class FileUpload(forms.Form):
                file_upload = forms.FileField()
            form =  FileUpload(request.POST, request.FILES)
            if target in ['list_of_sites']:
                exten = "csv"
            else:
                exten = "xml"

            if form.is_valid():
                if request.FILES['file_upload'].name.endswith('.' + exten):
                    try:
                        userid = str(request.user.id)
                    except:
                        userid = ''
                    app_name = 'ipt'  # FIXME: where should I get the app_name?
                    user_dir = os.path.join(
                        settings.FILE_PATH_FIELD_DIRECTORY, userid, app_name)
                    bname = os.path.join(user_dir, target)
                    # check if the directory exists (or create it)
                    if not os.path.exists(bname):
                        os.makedirs(bname)
                    full_path = os.path.join(bname, request.FILES['file_upload'].name)
                    overwrite_existing_files = request.POST.get('overwrite_existing_files', True)
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
                        return HttpResponse(json.dumps(ret), content_type="application/json")
                    # f = file(os.path.join(bname, request.FILES['file_upload'].name), "w")
                    f = file(full_path, "w")
                    f.write(request.FILES['file_upload'].read())
                    f.close()

                    suffix = target
                    match = ".*\." + exten
                    class FileHtml(forms.Form):
                        file_html = FilePathFieldByUser(
                            basepath=settings.FILE_PATH_FIELD_DIRECTORY,
                            userid=userid,
                            subdir=suffix,
                            app_name=app_name,
                            match=match,
                            recursive=True)

                    fileslist = FileHtml()
                    fileslist.fields['file_html'].choices.insert(0, ('', u'- - - - -'))
                    fileslist.fields['file_html'].widget.choices.insert(0, ('', u'- - - - -'))

                    ret['ret'] = 0;
                    # ret['selected'] = os.path.join(bname, request.FILES['file_upload'].name)
                    ret['selected'] = full_path
                    ret['items'] = fileslist.fields['file_html'].choices
                    orig_file_name = str(request.FILES['file_upload'])
                    new_file_name = os.path.basename(full_path)
                    changed_msg = ''
                    if orig_file_name != new_file_name:
                        changed_msg = '(Renamed into %s)' % new_file_name
                    ret['ret_msg'] = 'File ' + orig_file_name + ' uploaded successfully.' + changed_msg;
                else:
                    ret['ret'] = 1;
                    ret['ret_msg'] = 'File uploaded isn\'t an ' + exten.upper() + ' file.';

                # Redirect to the document list after POST
                return HttpResponse(json.dumps(ret), content_type="application/json");

    ret['ret'] = 2;
    ret['ret_msg'] = 'Please provide the xml file.'

    return HttpResponse(json.dumps(ret), content_type="application/json");



def prepare(request, **kwargs):
    ret = {};

    if request.POST.get('data', '') == '':
        ret['ret'] = 1
        ret['msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json")

    data = json.loads(request.POST.get('data'))

    (fd, fname) = tempfile.mkstemp(suffix='.zip', prefix='ipt_', dir=tempfile.gettempdir())
    fzip = os.fdopen(fd, 'w')
    z = zipfile.ZipFile(fzip, 'w', zipfile.ZIP_DEFLATED, allowZip64=True)

    jobini =  "# Generated automatically with IPT at %s\n" % formatdate()
    jobini += "description = %s\n" % data['description']

    # FIXME depends on hazard + risk combination
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

    if data['hazard'] == 'hazard':
        jobini += "\n[Rupture information]\n"
        #            #####################

        jobini += "rupture_model_file = %s\n" % os.path.basename(data['rupture_model_file'])
        z.write(data['rupture_model_file'], os.path.basename(data['rupture_model_file']))

        jobini += "rupture_mesh_spacing = %s\n" % data['rupture_mesh_spacing']

    if data['hazard'] == 'hazard':
        jobini += "\n[Hazard sites]\n"
        #            ##############

        if data['hazard_sites_choice'] == 'region-grid':
            jobini += "region_grid_spacing = %s\n" % data['grid_spacing']
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
            jobini += "sites = %s\n" % os.path.basename(data['list_of_sites'])
            z.write(data['list_of_sites'], os.path.basename(data['list_of_sites']))
        elif data['hazard_sites_choice'] == 'exposure-model':
            pass
        elif data['hazard_sites_choice'] == 'site-cond-model':
            if data['site_conditions_choice'] != 'from-file':
                ret['ret'] = 4
                ret['msg'] = 'Input hazard sites choices mismatch method to specify site conditions.'
                return HttpResponse(json.dumps(ret), content_type="application/json")
        else:
            ret['ret'] = 4
            ret['msg'] = 'Unknown hazard_sites_choice.'
            return HttpResponse(json.dumps(ret), content_type="application/json")

    if ((data['hazard'] == 'hazard' and data['hazard_sites_choice'] == 'exposure-model')
        or data['risk'] != None):
        jobini += "\n[Exposure model]\n"
        #            ################

        jobini += "exposure_file = %s\n" % os.path.basename(data['exposure_model'])
        z.write(data['exposure_model'], os.path.basename(data['exposure_model']))
        if data['risk'] != None:
            if data['exposure_model_regcons_choice'] == True:
                is_first = True
                jobini += "region_constraint = "
                for el in data['exposure_model_regcons_coords_data']:
                    if is_first:
                        is_first = False
                    else:
                        jobini += ", "
                    jobini += "%s %s" % (el[0], el[1])
                jobini += "\n"

    if data['risk'] == 'damage':
        jobini += "\n[Fragility model]\n"
        #            #################
        descr = {'structural': 'structural', 'nonstructural': 'nonstructural',
                 'contents': 'contents', 'businter': 'business_interruption'}
        with_cons = data['fm_loss_show_cons_choice']
        for losslist in ['structural', 'nonstructural', 'contents', 'businter']:
            if data['fm_loss_'+ losslist + '_choice'] == True:
                jobini += "%s_fragility_file = %s\n" % (
                    descr[losslist], os.path.basename(data['fm_loss_' + losslist]))
                z.write(data['fm_loss_' + losslist], os.path.basename(data['fm_loss_' + losslist]))
                if with_cons == True:
                    jobini += "%s_consequence_file = %s\n" % (
                        descr[losslist], os.path.basename(data['fm_loss_' + losslist + '_cons']))
                    z.write(data['fm_loss_' + losslist + '_cons'],
                            os.path.basename(data['fm_loss_' + losslist + '_cons']))
    elif data['risk'] == 'losses':
        jobini += "\n[Vulnerability model]\n"
        #            #####################
        descr = {'structural': 'structural', 'nonstructural': 'nonstructural',
                 'contents': 'contents', 'businter': 'business_interruption',
                 'occupants': 'occupants'}
        for losslist in ['structural', 'nonstructural', 'contents', 'businter',
                         'occupants']:
            if data['vm_loss_'+ losslist + '_choice'] == True:
                jobini += "%s_vulnerability_file = %s\n" % (
                    descr[losslist], os.path.basename(data['vm_loss_' + losslist]))
                z.write(data['vm_loss_' + losslist],
                        os.path.basename(data['vm_loss_' + losslist]))

    if data['hazard'] == 'hazard':
        jobini += "\n[Site conditions]\n"
        #            #################

        if data['site_conditions_choice'] == 'from-file':
            jobini += "site_model_file = %s\n" % os.path.basename(data['site_model_file'])
            z.write(data['site_model_file'], os.path.basename(data['site_model_file']))
        elif data['site_conditions_choice'] == 'uniform-param':
            jobini += "reference_vs30_value = %s\n" % data['reference_vs30_value']
            jobini += "reference_vs30_type = %s\n" % data['reference_vs30_type']
            jobini += "reference_depth_to_2pt5km_per_sec = %s\n" % data['reference_depth_to_2pt5km_per_sec']
            jobini += "reference_depth_to_1pt0km_per_sec = %s\n" % data['reference_depth_to_1pt0km_per_sec']

    if data['hazard'] == 'hazard':
        jobini += "\n[Calculation parameters]\n"
        #            ########################

        if data['gmpe_choice'] == 'specify-gmpe':
            jobini += "gsim = %s\n" % data['gsim'][0]
        elif data['gmpe_choice'] == 'from-file':
            jobini += "gsim_logic_tree_file = %s\n" % os.path.basename(data['fravul_model_file'])
            z.write(data['fravul_model_file'], os.path.basename(data['fravul_model_file']))

        if data['risk'] == None:
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

        jobini += "ground_motion_correlation_model = %s\n" % data['ground_motion_correlation_model']
        if data['ground_motion_correlation_model'] == 'JB2009':
            jobini += "ground_motion_correlation_params = {\"vs30_clustering\": True}\n"

        jobini += "truncation_level = %s\n" % data['truncation_level']
        jobini += "maximum_distance = %s\n" % data['maximum_distance']
        jobini += "number_of_ground_motion_fields = %s\n" % data['number_of_ground_motion_fields']

    print jobini

    z.writestr('job.ini', jobini)
    z.close()

    ret['ret'] = 0
    ret['msg'] = 'Success, download it.'
    ret['zipname'] = os.path.basename(fname)
    return HttpResponse(json.dumps(ret), content_type="application/json")


def download(request):

    if request.method == 'POST':
        zipname = request.POST.get('zipname', '')
        if zipname == '':
            return HttpResponseBadRequest('No zipname provided.')
        absfile = os.path.join(tempfile.gettempdir(), zipname)
        if not os.path.isfile(absfile):
            return HttpResponseBadRequest('Zipfile not found.')
        with open(absfile, 'r') as content_file:
            content = content_file.read()

        resp = HttpResponse(content=content,
                            content_type='application/zip')
        resp['Content-Disposition'] = (
            'attachment; filename="oq-input.zip"')
        return resp
