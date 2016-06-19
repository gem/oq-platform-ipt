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


def filehtml_create(suffix, dirnam=None, match=".*\.xml"):
    if dirnam == None:
        dirnam = suffix
    class FileHtml(forms.Form):
        file_html = forms.FilePathField(path=(settings.FILE_PATH_FIELD_DIRECTORY + dirnam + '/'), match=match, recursive=True)
    fh = FileHtml()
    fh.fields['file_html'].choices.insert(0, ('', u'- - - - -'))
    fh.fields['file_html'].widget.choices.insert(0, ('', u'- - - - -'))
    return fh

def view(request, **kwargs):
    gmpe = list(gsim.get_available_gsims())

    rupture_file_html = filehtml_create('rupture_file')
    rupture_file_upload = FileUpload()

    list_of_sites_html = filehtml_create('list_of_sites', match=".*\.csv")
    list_of_sites_upload = FileUpload()

    exposure_model_html = filehtml_create('exposure_model')
    exposure_model_upload = FileUpload()

    site_model_html = filehtml_create('site_model')
    site_model_upload = FileUpload()

    fm_structural_html = filehtml_create('fm_structural', 'fragility_model')
    fm_structural_upload = FileUpload()
    fm_nonstructural_html = filehtml_create('fm_nonstructural', 'fragility_model')
    fm_nonstructural_upload = FileUpload()
    fm_contents_html = filehtml_create('fm_contents', 'fragility_model')
    fm_contents_upload = FileUpload()
    fm_businter_html = filehtml_create('fm_businter', 'fragility_model')
    fm_businter_upload = FileUpload()

    fm_structural_cons_html = filehtml_create('fragility_cons')
    fm_structural_cons_upload = FileUpload()
    fm_nonstructural_cons_html = filehtml_create('fragility_cons')
    fm_nonstructural_cons_upload = FileUpload()
    fm_contents_cons_html = filehtml_create('fragility_cons')
    fm_contents_cons_upload = FileUpload()
    fm_businter_cons_html = filehtml_create('fragility_cons')
    fm_businter_cons_upload = FileUpload()

    vm_structural_html = filehtml_create('vm_structural', 'vulnerability_model')
    vm_structural_upload = FileUpload()
    vm_nonstructural_html = filehtml_create('vm_nonstructural', 'vulnerability_model')
    vm_nonstructural_upload = FileUpload()
    vm_contents_html = filehtml_create('vm_contents', 'vulnerability_model')
    vm_contents_upload = FileUpload()
    vm_businter_html = filehtml_create('vm_businter', 'vulnerability_model')
    vm_businter_upload = FileUpload()
    vm_occupants_html = filehtml_create('vm_occupants', 'vulnerability_model')
    vm_occupants_upload = FileUpload()

    site_conditions_html = filehtml_create('site_conditions')
    site_conditions_upload = FileUpload()

    imt_html = filehtml_create('imt')
    imt_upload = FileUpload()

    gsim_logic_tree_file_html = filehtml_create('gsim_logic_tree_file')
    gsim_logic_tree_file_upload = FileUpload()

    source_model_logic_tree_file_html = filehtml_create('source_model_logic_tree_file')
    source_model_logic_tree_file_upload = FileUpload()

    return render_to_response(
        "ipt/ipt.html",
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
            gsim_logic_tree_file_html=gsim_logic_tree_file_html,
            gsim_logic_tree_file_upload=gsim_logic_tree_file_upload,

            source_model_logic_tree_file_html=source_model_logic_tree_file_html,
            source_model_logic_tree_file_upload=source_model_logic_tree_file_upload
        ),
        context_instance=RequestContext(request))


def upload(request, **kwargs):
    ret = {};

    print "UPLOAD"
    if 'target' not in kwargs:
        ret['ret'] = 3;
        ret['ret_msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json");

    target = kwargs['target']
    if target not in ['rupture_file', 'list_of_sites', 'exposure_model',
                      'site_model', 'site_conditions', 'imt', 'fravul_model',
                      'fragility_model', 'fragility_cons',
                      'vulnerability_model', 'gsim_logic_tree_file',
                      'source_model_logic_tree_file']:
        ret['ret'] = 4;
        ret['ret_msg'] = 'Unknown target "' + target + '".'
        return HttpResponse(json.dumps(ret), content_type="application/json");

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
                    bname = settings.FILE_PATH_FIELD_DIRECTORY + target + '/'
                    f = file(bname + request.FILES['file_upload'].name, "w")
                    f.write(request.FILES['file_upload'].read())
                    f.close()

                    suffix = target + "/"
                    match = ".*\." + exten
                    class FileHtml(forms.Form):
                        file_html = forms.FilePathField(path=(settings.FILE_PATH_FIELD_DIRECTORY + suffix), match=match, recursive=True)

                    fileslist = FileHtml()
                    fileslist.fields['file_html'].choices.insert(0, ('', u'- - - - -'))
                    fileslist.fields['file_html'].widget.choices.insert(0, ('', u'- - - - -'))

                    # import pdb ; pdb.set_trace()
                    ret['ret'] = 0;
                    ret['selected'] = bname + request.FILES['file_upload'].name
                    ret['items'] = fileslist.fields['file_html'].choices
                    ret['ret_msg'] = 'File ' + str(request.FILES['file_upload']) + ' uploaded successfully.';
                else:
                    ret['ret'] = 1;
                    ret['ret_msg'] = 'File uploaded isn\'t an ' + exten.upper() + ' file.';

                # Redirect to the document list after POST
                return HttpResponse(json.dumps(ret), content_type="application/json");

    ret['ret'] = 2;
    ret['ret_msg'] = 'Please provide the xml file.'

    return HttpResponse(json.dumps(ret), content_type="application/json");


def exposure_model_prep_sect(data, z, is_regcons):
    jobini = "\n[Exposure model]\n"
    #           ################

    jobini += "exposure_file = %s\n" % os.path.basename(data['exposure_model'])
    z.write(data['exposure_model'], os.path.basename(data['exposure_model']))
    if is_regcons:
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
    return jobini


def vulnerability_model_prep_sect(data, z):
    jobini = "\n[Vulnerability model]\n"
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

    jobini += "insured_losses = %s\n" % (
        "True" if data['insured_losses'] else "False")

    if data['asset_correlation_choice']:
        jobini += "asset_correlation = %s" % data['asset_correlation']

    return jobini


def site_conditions_prep_sect(data, z):
    jobini = "\n[Site conditions]\n"
    #           #################

    if data['site_conditions_choice'] == 'from-file':
        jobini += "site_model_file = %s\n" % os.path.basename(data['site_model_file'])
        z.write(data['site_model_file'], os.path.basename(data['site_model_file']))
    elif data['site_conditions_choice'] == 'uniform-param':
        jobini += "reference_vs30_value = %s\n" % data['reference_vs30_value']
        jobini += "reference_vs30_type = %s\n" % data['reference_vs30_type']
        jobini += "reference_depth_to_2pt5km_per_sec = %s\n" % data['reference_depth_to_2pt5km_per_sec']
        jobini += "reference_depth_to_1pt0km_per_sec = %s\n" % data['reference_depth_to_1pt0km_per_sec']
    return jobini


def scenario_prepare(request, **kwargs):
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
        jobini += exposure_model_prep_sect(data, z, (data['risk'] != None))

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
        jobini += vulnerability_model_prep_sect(data, z)

    if data['hazard'] == 'hazard':
        jobini += site_conditions_prep_sect(data, z)

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
            jobini += "ground_motion_correlation_params = {\"vs30_clustering\": False}\n"

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


def event_based_prepare(request, **kwargs):
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
    jobini += "[general]\n"
    jobini += "description = %s\n" % data['description']

    jobini += "calculation_mode = event_based_risk\n"

    jobini += "random_seed = 113\n"

    # Exposure model
    jobini += exposure_model_prep_sect(data, z, True)

    # Vulnerability model
    jobini += vulnerability_model_prep_sect(data, z)

    # Hazard model
    jobini += "source_model_logic_tree_file = %s\n" % os.path.basename(
        data['source_model_logic_tree_file'])
    z.write(data['source_model_logic_tree_file'],
            os.path.basename(data['source_model_logic_tree_file']))

    jobini += "gsim_logic_tree_file = %s\n" % os.path.basename(
        data['gsim_logic_tree_file'])
    z.write(data['gsim_logic_tree_file'],
            os.path.basename(data['gsim_logic_tree_file']))

    jobini += "\n[Hazard model]\n"
    #            ##############
    jobini += "width_of_mfd_bin = %s\n" % data['width_of_mfd_bin']

    if data['rupture_mesh_spacing_choice'] == True:
        jobini += "rupture_mesh_spacing = %s\n" % data['rupture_mesh_spacing']
    if data['area_source_discretization_choice'] == True:
        jobini += ("area_source_discretization = %s\n" %
                   data['area_source_discretization'])

    # Site conditions
    jobini += site_conditions_prep_sect(data, z)

    jobini += "\n[Hazard calculation]\n"
    #            ####################
    jobini += "truncation_level = %s\n" % data['truncation_level']
    jobini += "maximum_distance = %s\n" % data['maximum_distance']
    jobini += "investigation_time = %s\n" % data['investigation_time']
    jobini += "ses_per_logic_tree_path = %s\n" % data['ses_per_logic_tree_path']
    jobini += "number_of_logic_tree_samples = %s\n" % data['number_of_logic_tree_samples']
    jobini += "ground_motion_correlation_model = %s\n" % data['ground_motion_correlation_model']
    if data['ground_motion_correlation_model'] == 'JB2009':
        jobini += "ground_motion_correlation_params = {\"vs30_clustering\": True}"

    jobini += "\n[Risk calculation]\n"
    #            ##################
    jobini += "risk_investigation_time = %s\n" % data['risk_investigation_time']
    if data['loss_choice'] == "loss-curve-resolution":
        jobini += "loss_curve_resolution = %s\n" % data['loss_curve_resolution']
    elif data['loss_choice'] == "loss-ratios":
        jobini += "loss_ratios = { "
        descr = {'structural': 'structural', 'nonstructural': 'nonstructural',
                 'contents': 'contents', 'businter': 'business_interruption',
                 'occupants': 'occupants'}
        is_first = True
        for losslist in ['structural', 'nonstructural', 'contents', 'businter',
                         'occupants']:
            if data['vm_loss_'+ losslist + '_choice'] == True:
                jobini += "%s\"%s\": [ %s ]" % (
                    ("" if is_first else ", "),
                    descr[losslist], data['loss_ratios_' + losslist])
                is_first = False
        jobini += "}\n"

    jobini += "\n[Hazard outputs]\n"
    #            ################
    jobini += "ground_motion_fields = %s\n" % data['ground_motion_fields']
    jobini += "hazard_curves_from_gmfs = %s\n" % data['hazard_curves_from_gmfs']
    if data['hazard_curves_from_gmfs']:
        jobini += "mean_hazard_curves = %s\n" % data['mean_hazard_curves']
        if data['quantile_hazard_curves_choice']:
            jobini += "quantile_hazard_curves = %s\n" % data['quantile_hazard_curves']
    jobini += "hazard_maps = %s\n" % data['hazard_maps']
    if data['hazard_maps']:
        jobini += "poes = %s\n" % data['poes']
    jobini += "uniform_hazard_spectra = %s\n" % data['uniform_hazard_spectra']

    jobini += "\n[Risk outputs]\n"
    #            ##############
    jobini += "avg_losses = %s\n" % data['avg_losses']
    jobini += "asset_loss_table = %s\n" % data['asset_loss_table']
    if data['quantile_loss_curves_choice']:
        jobini += "quantile_loss_curves = %s\n" % data['quantile_loss_curves']
    if data['conditional_loss_poes_choice']:
        jobini += "conditional_loss_poes = %s\n" % data['conditional_loss_poes']

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
        dest_name = request.POST.get('dest_name', 'Unknown')
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
            'attachment; filename="' + dest_name + '.zip"')
        return resp
