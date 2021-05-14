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
except Exception:
    STANDALONE = False

try:
    from openquakeplatform.settings import GEM_IPT_CLEAN_ALL
except Exception:
    GEM_IPT_CLEAN_ALL = True


from openquakeplatform.settings import FILE_PATH_FIELD_DIRECTORY

from openquake.moon import platform_get, TimeoutError

PLA_ADMIN_ID = os.environ.get('GEM_PLA_ADMIN_ID', '1')
#
# TO RUN A SINGLE TEST:
#
# python -m openquake.moon.nose_runner --failurecatcher dev -v -s \
#   --with-xunit --xunit-file=xunit-platform-dev.xml  \

imt_examples = {
    'Exposure': {
        'tab_id': 1,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaex']"],
             'sfx': 'xml'},

            {'exa_id': 94, 'subtab_id': 0,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'xml'},
            {'exa_id': 95, 'subtab_id': 0,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'xml'},
            {'exa_id': 96, 'subtab_id': 0,
             'zipfile': 'exposure_model.zip', 'sfx': 'zip'},
            {'exa_id': 97, 'subtab_id': 0,
             'zipfile': 'exposure_model.zip', 'sfx': 'zip'},


            {'exa_id': 98, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg']"],
             'sfx': 'txt'},
            {'exa_id': 99, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-1']//div[@id='validationErrorMsg']",
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
    'EarthquakeRupture': {
        'tab_id': 5,
        'exams': [
            {'exa_id': 1, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaer']"],
             'sfx': 'xml'},
            {'exa_id': 2, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaer']"],
             'sfx': 'xml'},
            {'exa_id': 3, 'subtab_id': 0,
             'xpath': ["//div[@id='tabs-5']//div[@id='"
                       "validationErrorMsg'][@style='display: none;']",
                       "//textarea[@id='textareaer']"],
             'sfx': 'xml'},
        ]
    },
    'ConfigurationFile': {
        'tab_id': 6,
        'exams': [
            {'exa_id': 99, 'subtab_id': 1,
             'zipfile': 'ScenarioHazard.zip',
             'sfx': 'zip'},
            {'exa_id': 98, 'subtab_id': 1,
             'zipfile': 'ScenarioHazard.zip',
             'sfx': 'zip'},
            {'exa_id': 97, 'subtab_id': 1,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'txt'},
            {'exa_id': 96, 'subtab_id': 1,
             'zipfile': 'ScenarioHazardDamage.zip',
             'sfx': 'zip'},
            {'exa_id': 99, 'subtab_id': 3,
             'zipfile': 'EventBasedHazard.zip',
             'sfx': 'zip'},
            {'exa_id': 98, 'subtab_id': 3,
             'zipfile': 'EventBasedHazard.zip',
             'sfx': 'zip'},
            {'exa_id': 97, 'subtab_id': 3,
             'zipfile': 'EventBasedHazardRisk.zip',
             'sfx': 'zip'},
            {'exa_id': 96, 'subtab_id': 3,
             'zipfile': 'EventBasedHazardRisk.zip',
             'sfx': 'zip'},
            {'exa_id': 90, 'subtab_id': 3,
             'zipfile': 'EventBasedHazardRisk.zip',
             'sfx': 'zip'},
            {'exa_id': 99, 'subtab_id': 4,
             'zipfile': 'Volcano.zip',
             'sfx': 'zip'},
            {'exa_id': 98, 'subtab_id': 4,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'txt'},
            {'exa_id': 97, 'subtab_id': 4,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'txt'},
            {'exa_id': 96, 'subtab_id': 4,
             'xpath': ["//div[@id='error-message']"],
             'sfx': 'txt'},
            {'exa_id': 95, 'subtab_id': 4,
             'zipfile': 'Volcano.zip',
             'sfx': 'zip'},
            {'exa_id': 94, 'subtab_id': 4,
             'zipfile': 'Volcano.zip',
             'sfx': 'zip'},
            {'exa_id': 93, 'subtab_id': 4,
             'zipfile': 'Volcano.zip',
             'sfx': 'zip'},
            {'exa_id': 92, 'subtab_id': 4,
             'zipfile': 'Volcano.zip',
             'sfx': 'zip'},
        ]
    }
}

_fpath_field_directory_old = None
_fpath_field_directory = None


def hide_footer(pla):
    footer = pla.xpath_finduniq("//footer")
    # hide
    pla.driver.execute_script(
        "$(arguments[0]).attr('style','display:none;')", footer)


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
                    replicatetree(fm_item, to_item)
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


def zip_diff(filename1, filename2, quiet):
    differs = True

    z1 = zipfile.ZipFile(open(filename1, "rb"))
    z2 = zipfile.ZipFile(open(filename2, "rb"))
    if len(z1.infolist()) != len(z2.infolist()):
        if not quiet:
            print("zip_diff: number of archive elements differ: "
                  "{} in {} vs {} in {}".format(
                      len(z1.infolist()), z1.filename,
                      len(z2.infolist()), z2.filename))
        return 1
    for zipentry in z1.infolist():
        if zipentry.filename not in z2.namelist():
            break
        cont1 = z1.open(zipentry.filename).read()
        cont2 = z2.open(zipentry.filename).read()

        _, ext = os.path.splitext(zipentry.filename)
        if ext.upper() == '.ZIP' or ext.upper() == '.HDF5':
            if cont1 != cont2:
                if not quiet:
                    print("\nzip_diff: the files %s "
                          "are binarily different\n" % (
                             zipentry.filename,))
                break
        else:
            delta = ''
            diff = difflib.ndiff(
                [x.decode('utf-8') for x in list(z1.open(zipentry.filename))],
                [x.decode('utf-8') for x in list(z2.open(zipentry.filename))])
            delta = ''.join(x for x in diff
                            if x.startswith('- ') or x.startswith('+ '))

            if delta:
                if not quiet:
                    print("\nzip_diff: the files %s are different:\n%s\n" % (
                        zipentry.filename, delta))
                break
    else:
        differs = False

    return (1 if differs else 0)


def setup_module(module):
    global _fpath_field_directory_old, _fpath_field_directory

    homedir = os.environ.get('GEM_OQ_PLA_IPT_SERVER_HOMEDIR')
    if homedir is not None:
        file_path = os.path.join(
            homedir, os.path.basename(FILE_PATH_FIELD_DIRECTORY), 'ipt')
    else:
        file_path = os.path.join(
            FILE_PATH_FIELD_DIRECTORY,
            ('' if STANDALONE is True else PLA_ADMIN_ID), 'ipt')
        print("\n\nFILE_PATH: [%s]" % file_path)
    file_path_old = os.path.join(
        os.path.dirname(file_path), 'ipt.pretest')

    if os.path.isdir(file_path):
        os.rename(file_path,
                  file_path_old)
        _fpath_field_directory_old = file_path_old
    _fpath_field_directory = file_path


def teardown_module(module):
    if (GEM_IPT_CLEAN_ALL and _fpath_field_directory_old is not None):
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


def class_match(cls):
    return ("contains(concat(' ', @class, ' '), ' %s ')" % cls)


class IptUploadTest(unittest.TestCase):

    def upload_test(self):
        # clean all files in upload folder
        pla = platform_get()
        pla.get('/ipt/?tab_id=6&subtab_id=1')

        pla.driver.execute_script(
            "window.gem_not_interactive = true;")

        hide_footer(pla)

        common = (
            "//div[starts-with(@id, 'tabs-')"
            " and @name='configuration_file']"
            "//div[starts-with(@id, 'cf_subtabs-') and @name='scenario']")

        if GEM_IPT_CLEAN_ALL:
            clean_all = pla.xpath_finduniq(
                common + "//button[@type='submit' and @name='clean_all']")
            clean_all.click()

            confirm = pla.xpath_finduniq(
                "//div[@class='ui-dialog-buttonset']//button["
                "@type='button' and normalize-space(text())='Yes']")
            confirm.click()

        # show div with upload file
        up_file = os.path.join(os.path.dirname(__file__), 'data',
                               'rupture_file', 'earthquake_rupture_model.xml')

        butt_upload_file = pla.xpath_finduniq(
            "//button[@name='rupture-file-new'"
            " and normalize-space(text())='Upload']")

        time.sleep(8)
        butt_upload_file.click()

        upload_file = pla.xpath_finduniq(
            common + "//div[@name='rupture-file-new']"
            "//form[@id='file-upload-form' and @name='rupture-file']"
            "//input[@name='file_upload']")

        pla.driver.execute_script(
            "$(arguments[0]).attr('style','visibility:visible;')", upload_file)

        time.sleep(1)

        upload_file.send_keys(up_file)

        # wait for js upload callback to setup dropdown item properly
        time.sleep(8)

        list_files = Select(pla.xpath_finduniq(
            common + "//div[@name='rupture-file-html']"
            "//select[@name='file_html']"))

        assert (list_files.first_selected_option.text ==
                "earthquake_rupture_model.xml")


class IptExamplesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        #
        # remove all uploaded files
        pla = platform_get()
        pla.get('/ipt/?tab_id=6&subtab_id=1')

        hide_footer(pla)

        common = (
            "//div[starts-with(@id, 'tabs-') and"
            " @name='configuration_file']"
            "//div[starts-with(@id, 'cf_subtabs-') and @name='scenario']")

        if GEM_IPT_CLEAN_ALL:
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
        attempt_sfxs = ["", "__2", "__3", "__4"]
        pla = platform_get()
        zipfile = ""
        if 'zipfile' in example:
            zipfile = os.path.join(pla.download_dir, example['zipfile'])
            if os.path.exists(zipfile):
                os.remove(zipfile)

        time.sleep(5)
        pla.get('/ipt/?tab_id=%d&subtab_id=%d&example_id=%d' % (
            tab_id, example['subtab_id'], example['exa_id']))

        pla.waituntil_js(50, ("try { return (window.gem_example_completed"
                              " == true); } catch (exc) { return false; }"))

        if 'xpath' in example:
            exp_filename = os.path.join(
                exp_path, "example_%d.%s" % (
                    tab_id * 1000 + example['exa_id'] * 10 + subtab_id,
                    example['sfx']))

            for xpath in example['xpath']:
                ret_tag = pla.xpath_finduniq(xpath, times=500)

            with codecs.open(exp_filename, 'r', 'utf-8') as exp_file:
                expected = exp_file.read()

            ret = ret_tag.get_attribute("value")
            if ret is None:
                ret = ret_tag.get_attribute('innerHTML')
            if ret.strip() != expected.strip():
                # Turn on to save expected vs received with single test run
                if not GEM_IPT_CLEAN_ALL:
                    with open('/tmp/rec.log', 'w') as rec:
                        rec.write(ret.strip())
                    with open('/tmp/exp.log', 'w') as exp:
                        exp.write(expected.strip())

                ret_filename = os.path.join(
                    "retrived_%d.%s" % (
                        tab_id * 1000 + example['exa_id'] * 10 + subtab_id,
                        example['sfx']))
                with codecs.open(ret_filename, 'w', 'utf-8') as ret_file:
                    ret_file.write(ret)
            self.assertEqual(ret.strip(), expected.strip())
        elif 'zipfile' in example:
            exp_filename = 'not_available'
            for attempt in attempt_sfxs:
                exp_filename_att = os.path.join(
                    exp_path, "example_%d%s.%s" % (
                        tab_id * 1000 + example['exa_id'] * 10 + subtab_id,
                        attempt, example['sfx']))
                if not os.path.exists(exp_filename_att):
                    print('att %s file does not exist, break' % exp_filename_att)
                    homeuser = os.path.expanduser("~")
                    shutil.copyfile(zipfile, os.path.join(homeuser, "out",
                        "example_%d.zip" % (
                            tab_id * 1000 + example['exa_id'] * 10 + subtab_id)))
                    break
                exp_filename = exp_filename_att

                for t in gen_timeout_poller(20, 0.2):
                    if os.path.exists(zipfile):
                        if (os.path.getsize(zipfile) >=
                                os.path.getsize(exp_filename)):
                            break
                self.assertNotEqual(zipfile, "")
                res = zip_diff(exp_filename, zipfile, True)

                if res == 0:
                    return
            self.assertTrue(zip_diff(exp_filename, zipfile, False) == 0)

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
