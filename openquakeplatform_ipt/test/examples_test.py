#!/usr/bin/env python
import unittest
import os
import sys
import time
import codecs
import shutil
import errno
import difflib
import zipfile
from selenium.webdriver.support.select import Select
try:
    from openquakeplatform.settings import STANDALONE
except:
    STANDALONE = False

from openquakeplatform.settings import FILE_PATH_FIELD_DIRECTORY

from openquake.moon import platform_get

#
# TO RUN A SINGLE TEST:
#
# python -m openquake.moon.nose_runner --failurecatcher dev -v -s \
#   --with-xunit --xunit-file=xunit-platform-dev.xml  \

_DATA_SUBFOLDERS = [
    'exposure_model', 'fm_businter', 'fm_contents', 'fm_nonstructural',
    'fm_structural', 'fragility_cons', 'gmf_file', 'gsim_logic_tree_file',
    'imt', 'list_of_sites', 'rupture_file', 'site_conditions', 'site_model',
    'source_model_file', 'source_model_logic_tree_file', 'vm_businter',
    'vm_contents', 'vm_nonstructural', 'vm_occupants', 'vm_structural']

imt_examples = {
    'Exposure': {
        'tab_id': 1,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaex']"],
             'sfx': 'xml'},
            {'exa_id': 98, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg']"],
             'sfx': 'txt'},
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaex']"],
             'sfx': 'xml'}
        ]
    },
    'Fragility': {
        'tab_id': 2,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-2']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaff']"],
             'sfx': 'xml'},
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-2']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaff']"],
             'sfx': 'xml'}
        ]
    },
    'Vulnerability': {
        'tab_id': 4,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-3']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareavf']"],
             'sfx': 'xml'},
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-3']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareavf']"],
             'sfx': 'xml'}
        ]
    },
    'SiteConditions': {
        'tab_id': 6,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareasc']"],
             'sfx': 'xml'},
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareasc']"],
             'sfx': 'xml'}
        ]
    },
    'ConfigurationFile': {
        'tab_id': 7,
        'exams': [
            {'exa_id': 99, 'subtab_id': 1,
             'zipfile': 'ScenarioHazard.zip',
             'sfx': 'zip'}
        ]
    }
}


_fpath_field_directory_old = None
_fpath_field_directory = None


def replicatetree(fm, to):
    if not os.path.isdir(fm):
        raise OSError("'%s' is not a directory" % fm)
    if os.path.exists(to):
        if not os.path.isdir(to):
            os.system("ls -l %s >&2" % to)
            raise OSError("'%s' is not a directory" % to)
    else:
        os.mkdir(to)

    for item in os.listdir(fm):
        fm_item = os.path.join(fm, item)
        to_item = os.path.join(to, item)
        if os.path.isdir(fm_item):
            if os.path.exists(to_item):
                if os.path.isdir(to_item):
                    continue
                else:
                    raise OSError("'%s' is not a directory" % to_item)
            else:
                os.mkdir(to_item)
                replicatetree(fm_item, to_item)
        else:
            if os.path.exists(to_item):
                if os.path.isdir(to_item):
                    raise OSError("'%s' is a directory" % to_item)
            shutil.copyfile(fm_item, to_item)


def zip_diff(filename1, filename2):
    differs = False

    z1 = zipfile.ZipFile(open(filename1, "rb"))
    z2 = zipfile.ZipFile(open(filename2, "rb"))
    if len(z1.infolist()) != len(z2.infolist()):
        print("zip_diff: number of archive elements differ: "
              "{} in {} vs {} in {}".format(
                  len(z1.infolist()), z1.filename,
                  len(z2.infolist()), z2.filename))
        return 1
    for zipentry in z1.infolist():
        if zipentry.filename not in z2.namelist():
            diff = difflib.ndiff(z1.open(zipentry.filename),
                                 z2.open(zipentry.filename))
            delta = ''.join(x[2:] for x in diff
                            if x.startswith('- ') or x.startswith('+ '))
            if delta:
                print("zip_diff: differ here: %s" % zipentry.filename)
                differs = True
                break
    if not differs:
        return 0
    return 1


def setup_module(module):
    global _fpath_field_directory_old, _fpath_field_directory

    homedir = os.environ.get('GEM_OQ_PLA_IPT_SERVER_HOMEDIR')
    if homedir is not None:
        file_path = os.path.join(
            homedir, os.path.basename(FILE_PATH_FIELD_DIRECTORY), 'ipt')
    else:
        file_path = os.path.join(
            FILE_PATH_FIELD_DIRECTORY,
            ('' if STANDALONE is True else '1'), 'ipt')
        print("\n\nFILE_PATH: [%s]" % file_path)
    file_path_old = os.path.join(
        os.path.dirname(file_path), 'ipt.pretest')

    if os.path.isdir(file_path):
        os.rename(file_path,
                  file_path_old)
        _fpath_field_directory_old = file_path_old
    _fpath_field_directory = file_path


def teardown_module(module):
    if _fpath_field_directory_old is not None:
        shutil.rmtree(_fpath_field_directory)
        os.rename(_fpath_field_directory_old,
                  _fpath_field_directory)


def _copy_anything(src, dst):
    try:
        shutil.copytree(src, dst)
    except OSError as exc:  # python >2.5
        if exc.errno == errno.ENOTDIR:
            shutil.copy(src, dst)
        else:
            raise


class IptUploadTest(unittest.TestCase):
    def upload_test(self):
        # clean all files in upload folder
        pla = platform_get()
        pla.get('/ipt/?tab_id=7&subtab_id=1')

        # hide footer
        try:
            footer = pla.xpath_finduniq(
                "//footer[@id='footer' and @class='footer']")
            # hide
            pla.driver.execute_script(
                "$(arguments[0]).attr('style','display:none;')", footer)
        except:
            common = (
                "//div[starts-with(@id, 'tabs-')"
                " and @name='configuration_file']"
                "//div[starts-with(@id, 'cf_subtabs-') and @name='scenario']")

            clean_all = pla.xpath_finduniq(
                common + "//button[@type='submit' and @name='clean_all']")
            clean_all.click()

            confirm = pla.xpath_finduniq(
                "//div[@class='ui-dialog-buttonset']//button["
                "@type='button' and normalize-space(text())='Yes']")
            confirm.click()

            hazard_cbx = pla.xpath_finduniq(
                common + "//input[@type='checkbox' and @name='hazard']")
            hazard_cbx.click()

            # show div with upload file
            up_file = os.path.join(os.path.dirname(__file__), 'data',
                                   'rupture_file', 'rupture_model.xml')

            hide_div = pla.xpath_finduniq(
                common + "//div[@name='rupture-file-new']")

            pla.driver.execute_script(
                "$(arguments[0]).attr('style','display:block;')", hide_div)

            upload_file = pla.xpath_finduniq(
                common + "//div[@name='rupture-file-new']"
                "//form[@id='file-upload-form' and @name='rupture-file']"
                "//input[@name='file_upload']")

            upload_file.send_keys(up_file)

            pla.driver.execute_script(
                "$(arguments[0]).trigger('submit');", upload_file)

            # wait for js upload callback to setup dropdown item properly
            time.sleep(5)

            list_files = Select(pla.xpath_finduniq(
                common + "//div[@name='rupture-file-html']"
                "//select[@name='file_html']"))

            assert list_files.first_selected_option.text == "rupture_model.xml"


class IptExamplesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        #
        # remove all uploaded files
        pla = platform_get()
        pla.get('/ipt/?tab_id=7&subtab_id=1')

        # hide footer
        try:
            footer = pla.xpath_finduniq(
                "//footer[@id='footer' and @class='footer']")
            # hide
            pla.driver.execute_script(
                "$(arguments[0]).attr('style','display:none;')", footer)
        except:

            common = (
                "//div[starts-with(@id, 'tabs-') and"
                " @name='configuration_file']"
                "//div[starts-with(@id, 'cf_subtabs-') and @name='scenario']")

            clean_all = pla.xpath_finduniq(
                common + "//button[@type='submit' and @name='clean_all']")
            clean_all.click()

            confirm = pla.xpath_finduniq(
                "//div[@class='ui-dialog-buttonset']//button["
                "@type='button' and normalize-space(text())='Yes']")
            confirm.click()

            #
            # populate uploaded file with template
            if _fpath_field_directory:
                if os.path.isdir(_fpath_field_directory):
                    shutil.rmtree(_fpath_field_directory)
            replicatetree(os.path.join(
                os.path.dirname(__file__), 'data'), _fpath_field_directory)


def gen_timeout_poller(secs, delta):
    start_time = time.time()
    while True:
        now = time.time()
        if start_time + secs < now:
            break
        yield (now - start_time)
        time.sleep(delta)


def make_function(func_name, exp_path, tab_id, subtab_id, example):
    def generated(self):
        pla = platform_get()
        homedir = os.path.expanduser('~')

        exp_filename = os.path.join(
            exp_path, "example_%d.%s" % (
                tab_id * 1000 + example['exa_id'] * 10 + subtab_id,
                example['sfx']))

        zipfile = ""
        if 'zipfile' in example:
            zipfile = os.path.join(homedir, 'Downloads', example['zipfile'])
            if os.path.exists(zipfile):
                os.remove(zipfile)

        pla.get('/ipt/?tab_id=%d&subtab_id=%d&example_id=%d' % (
            tab_id, example['subtab_id'], example['exa_id']))

        pla.waituntil_js(10, ("try { return (window.gem_example_completed"
                              " == true); } catch (exc) { return false; }"))

        if 'xpath' in example:
            for xpath in example['xpath']:
                ret_tag = pla.xpath_finduniq(xpath, times=20)

            with codecs.open(exp_filename, 'r', 'utf-8') as exp_file:
                expected = exp_file.read()

            ret = ret_tag.get_attribute("value")
            if ret is None:
                ret = ret_tag.get_attribute('innerHTML')
            self.assertEqual(ret, expected)
        elif 'zipfile' in example:
            for t in gen_timeout_poller(5, 0.2):
                if os.path.exists(zipfile):
                    if (os.path.getsize(zipfile) >=
                            os.path.getsize(exp_filename)):
                        break

            self.assertNotEqual(zipfile, "")
            self.assertTrue(zip_diff(exp_filename, zipfile) == 0)

    generated.__name__ = func_name
    return generated


def generator():
    exp_path = os.path.join(os.path.dirname(
        sys.modules[IptExamplesTest.__module__].__file__), 'expected')
    for name, examples in imt_examples.items():
        for example in examples['exams']:
            func_name = "%s_%d_%d_test" % (name, example['exa_id'],
                                           example['subtab_id'])
            test_func = make_function(
                func_name, exp_path, examples['tab_id'],
                example['subtab_id'], example)

            setattr(IptExamplesTest, func_name, test_func)


generator()
