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


import re
import json
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


def filehtml_create(suffix):
    class FileHtml(forms.Form):
        file_html = forms.FilePathField(path=(settings.FILE_PATH_FIELD_DIRECTORY + suffix + '/'), match=".*\.xml", recursive=True)
    return FileHtml()

def ipt_view(request, **kwargs):
    gmpe = list(gsim.get_available_gsims())

    rupture_file_html = filehtml_create('rupture_file')
    rupture_file_upload = FileUpload()

    list_of_sites_html = filehtml_create('list_of_sites')
    list_of_sites_upload = FileUpload()

    exposure_model_html = filehtml_create('exposure_model')
    exposure_model_upload = FileUpload()

    site_model_html = filehtml_create('site_model')
    site_model_upload = FileUpload()

    site_conditions_html = filehtml_create('site_conditions')
    site_conditions_upload = FileUpload()

    imt_html = filehtml_create('imt')
    imt_upload = FileUpload()

    fravul_model_html = filehtml_create('fravul_model')
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
                                  site_conditions_html=site_conditions_html,
                                  site_conditions_upload=site_conditions_upload,
                                  imt_html=imt_html,
                                  imt_upload=imt_upload,
                                  fravul_model_html=fravul_model_html,
                                  fravul_model_upload=fravul_model_upload,
                              ),
                              context_instance=RequestContext(request))


def ipt_upload(request, **kwargs):
    ret = {};

    print "UPLOAD"
    if 'target' not in kwargs:
        ret['ret'] = 3;
        ret['ret_msg'] = 'Malformed request.'
        return HttpResponse(json.dumps(ret), content_type="application/json");

    target = kwargs['target']
    if target not in ['rupture_file', 'list_of_sites', 'exposure_model',
                      'site_model', 'site_conditions', 'imt', 'fravul_model']:
        ret['ret'] = 4;
        ret['ret_msg'] = 'Unknown target "' + target + '".'
        return HttpResponse(json.dumps(ret), content_type="application/json");
    
    if request.is_ajax():
        if request.method == 'POST':
            class FileUpload(forms.Form):
                file_upload = forms.FileField()
            form =  FileUpload(request.POST, request.FILES)
            if form.is_valid():
                if request.FILES['file_upload'].name.endswith('.xml'):
                    bname = settings.FILE_PATH_FIELD_DIRECTORY + target + '/'
                    f = file(bname + request.FILES['file_upload'].name, "w")
                    f.write(request.FILES['file_upload'].read())
                    f.close()

                    suffix = target + "/"
                    class FileHtml(forms.Form):
                        file_html = forms.FilePathField(path=(settings.FILE_PATH_FIELD_DIRECTORY + suffix), match=".*\.xml", recursive=True)

                    fileslist = FileHtml()

                    # import pdb ; pdb.set_trace()
                    ret['ret'] = 0;
                    ret['selected'] = bname + request.FILES['file_upload'].name
                    ret['items'] = fileslist.fields['file_html'].choices
                    ret['ret_msg'] = 'File ' + str(request.FILES['file_upload']) + ' uploaded successfully.';
                else:
                    ret['ret'] = 1;
                    ret['ret_msg'] = 'File uploaded isn\'t an XML file.';

                # Redirect to the document list after POST
                return HttpResponse(json.dumps(ret), content_type="application/json");

    ret['ret'] = 2;
    ret['ret_msg'] = 'Please provide the xml file.'

    return HttpResponse(json.dumps(ret), content_type="application/json");
