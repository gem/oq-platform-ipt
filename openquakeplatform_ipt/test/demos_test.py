#!/usr/bin/env python
import unittest
import os
import sys
import time
import shutil
import configparser
import re
import json
from openquake.moon import platform_get
from selenium.webdriver.support.ui import Select
from zipfile import ZipFile
from xml.etree import ElementTree
from ast import literal_eval
import requests


# _SUPPORTED_MODES = ['scenario_damage', 'scenario_risk', 'scenario',
#                     'event_based_risk', 'event_based', 'event_based_risk',
#                     'multi_risk']

_SUPPORTED_MODES = ['scenario', 'event_based']


def enc_open(*args, **kwargs):
    if sys.version_info[0] < 3:
        try:
            codecs
        except NameError:
            import codecs

        return codecs.open(*args, **kwargs)
    else:
        return open(*args, **kwargs)


_ini_defaults = {}
ini_defs_req = requests.get('http://127.0.0.1:8800/v1/ini_defaults')
if ini_defs_req.status_code != 200:
    raise ValueError
_ini_defaults = json.loads(ini_defs_req.text)


def conf_read(s):
    conf = {}

    conf_par = configparser.ConfigParser()
    conf_par.read_string(s)
    for sect in conf_par.sections():
        # print("Sect: %s" % sect)
        for opt in conf_par.options(sect):
            #print("%s: %s (%s)" % (opt, conf_par.get(sect, opt),
            #                       type(conf_par.get(sect, opt))))
            conf[opt] = conf_par.get(sect, opt).strip()
            if conf[opt] == '' and opt in _ini_defaults:
                    conf[opt] = _ini_defaults[opt]

    return conf


def dilist_deserialize(s):
    ret = []
    for row in s.split(','):
        row_out = []
        for col in row.strip().split(' '):
            row_out.append(col)
        ret.append(row_out)
    return ret


def gemui_cbox_set(pla, subtab, name, value):
    cbox_tag = pla.xpath_finduniq(
        "descendant::input[@type='checkbox'][@name='%s']" % (
            name), el=subtab)
    pla.driver.execute_script(
        ("$(arguments[0]).prop('checked', %s).triggerHandler('click')" % (
            'true' if value else 'false')), cbox_tag)


def gemui_radio_set(pla, subtab, name, value):
    radio_tag = pla.xpath_finduniq(
        "descendant::input[@type='radio'][@name='%s'][@value='%s']" % (
            name, value), el=subtab)
    pla.driver.execute_script(
        ("$(arguments[0]).prop('checked', true).triggerHandler('click')"),
        radio_tag)


def gemui_upload_file(pla, subtab, name, filepath, select=False):
    upload_file_btn = pla.xpath_finduniq(
        "descendant::div[@name='%s-html']//button[@name='%s"
        "-new']" % (name, name), el=subtab)
    upload_file_btn.click()

    upload_file_tag = pla.xpath_finduniq(
        "descendant::div[@name='%s-new']//form[@id='file-upload"
        "-form' and @name='%s']//input[@name='file_upload']" % (
            name, name), el=subtab)

    pla.driver.execute_script(
        "$(arguments[0]).attr('style','visibility:visible;')", upload_file_tag)
    time.sleep(0.5)
    upload_file_tag.send_keys(filepath)

    if select:
        time.sleep(1)
        upload_file_sel = Select(pla.xpath_finduniq(
            ("descendant::div[@name='%s-html']//select" % name), el=subtab))
        upload_file_sel.select_by_visible_text(
            os.path.basename(filepath))


def gemui_textarea_set(pla, subtab, name, value):
    textarea = pla.xpath_finduniq("descendant::textarea[@name='%s']" % name,
                                  el=subtab)
    textarea.clear()
    textarea.send_keys(value)


def gemui_inputtext_set(pla, subtab, name, value):
    inputtext = pla.xpath_finduniq(
        "descendant::input[@type='text' and @name='%s']" % name, el=subtab)
    inputtext.clear()
    inputtext.send_keys(value)


def populate(conf, pla, subtab, demo_dir):
    if 'description' in conf:
        gemui_textarea_set(pla, subtab, 'description', conf['description'])

    if 'rupture_mesh_spacing' in conf:
        gemui_inputtext_set(pla, subtab, 'rupture_mesh_spacing',
                            conf['rupture_mesh_spacing'])

    if 'region_grid_spacing' in conf:
        gemui_inputtext_set(pla, subtab, 'grid_spacing',
                            conf['region_grid_spacing'])

    #
    #  TABLE POPULATION
    #
    if 'region' in conf:
        reg_grid = pla.xpath_finduniq(
            "descendant::div[@name='region-coordinates-table']//"
            "div[@name='table']", el=subtab)
        dilist = dilist_deserialize(conf['region'])
        pla.driver.execute_script(
            "$(arguments[0]).handsontable('getInstance').loadData("
            "arguments[1]);", reg_grid, dilist)

    if 'reference_vs30_value' in conf:
        gemui_inputtext_set(pla, subtab, 'reference_vs30_value',
                            conf['reference_vs30_value'])

    if 'reference_vs30_type' in conf:
        gemui_radio_set(pla, subtab, 'hazard_sitecond_type',
                        conf['reference_vs30_type'])

    if 'reference_depth_to_1pt0km_per_sec' in conf:
        gemui_inputtext_set(pla, subtab, 'reference_depth_to_1pt0km_per_sec',
                            conf['reference_depth_to_1pt0km_per_sec'])

    if 'reference_depth_to_2pt5km_per_sec' in conf:
        gemui_inputtext_set(pla, subtab, 'reference_depth_to_2pt5km_per_sec',
                            conf['reference_depth_to_2pt5km_per_sec'])

    if 'rupture_model_file' in conf:
        gemui_upload_file(pla, subtab, 'rupture-file',
                          os.path.join(demo_dir, conf['rupture_model_file']))

    # "sol" widget management
    if 'intensity_measure_types' in conf:
        cust_imt = []
        for imt in conf['intensity_measure_types'].split(','):
            imt = imt.strip()
            ret = pla.driver.execute_script(
                "{ var imt = $(cf_obj['scen'].pfx + ' div[name=\"hazard-imt_"
                "specify-imt\"] label input[type=\"checkbox\"][value=\"' + "
                "arguments[0] + '\"]'); if (imt.length > 0) { imt.filter('"
                ":not(:checked)').click(); return 1; } return 0; }", imt)

            if ret == 0:
                cust_imt.append(imt)
        if cust_imt:
            gemui_inputtext_set(pla, subtab, 'custom_imt',
                                ', '.join(cust_imt))

    # "sol" widget management
    if 'gsim' in conf:
        for gsim in conf['gsim'].split(','):
            gsim = gsim.strip()
            ret = pla.driver.execute_script(
                "{ var gsim = $(cf_obj['scen'].pfx + ' div[name=\"hazard-gmpe_"
                "specify-gmpe\"] label input[type=\"checkbox\"][value=\"' + "
                "arguments[0] + '\"]'); if (gsim.length > 0) { gsim.filter('"
                ":not(:checked)').click(); return 1; } return 0; }", gsim)

            if ret == 0:
                raise ValueError('gsim: [%s] not found' % gsim)

    # 'ground_motion_correlation_model' has custom set (None mgmt)
    if 'ground_motion_correlation_model' in conf:
        # 'ground_motion_correlation_params' is set automatically
        gmcm_tag = pla.xpath_finduniq(
            "descendant::select[@name='ground-motion"
            "-correlation']", el=subtab)
        gmcm = Select(gmcm_tag)
        gmcm_val = conf['ground_motion_correlation_model']
        gmcm.select_by_value('' if gmcm_val is None else gmcm_val)

    if 'truncation_level' in conf:
        gemui_inputtext_set(pla, subtab, 'truncation_level',
                            conf['truncation_level'])

    if 'number_of_ground_motion_fields' in conf:
        gemui_inputtext_set(pla, subtab, 'number_of_ground_motion_fields',
                            conf['number_of_ground_motion_fields'])

    if 'maximum_distance' in conf:
        gemui_inputtext_set(pla, subtab, 'maximum_distance',
                            conf['maximum_distance'])

    if 'sites' in conf:
        gemui_radio_set(pla, subtab, 'hazard_sites', 'list-of-sites')

        sites = []
        sites_rows = conf['sites'].split(',')
        for sites_row in sites_rows:
            sites.append(sites_row.split(' '))
        site_content = ""
        for site in sites:
            site_content += ("%s\n" % ",".join(site))
        gen_filepath = os.path.join(pla.download_dir,
                                    "generated_sites.csv")
        with enc_open(gen_filepath, "w", encoding="utf-8") as fout:
            fout.write(site_content)
        gemui_upload_file(pla, subtab, 'list-of-sites', gen_filepath)

    if 'number_of_logic_tree_samples' in conf:
        gemui_inputtext_set(pla, subtab, 'number_of_logic_tree_samples',
                            conf['number_of_logic_tree_samples'])

    if 'width_of_mfd_bin' in conf:
        gemui_inputtext_set(pla, subtab, 'width_of_mfd_bin',
                            conf['width_of_mfd_bin'])

    if 'area_source_discretization' in conf:
        gemui_inputtext_set(pla, subtab, 'area_source_discretization',
                            conf['area_source_discretization'])

    if 'source_model_logic_tree_file' in conf:
        logic_tree_filepath = os.path.join(
            demo_dir, conf['source_model_logic_tree_file'])
        gemui_upload_file(
            pla, subtab, 'source-model-logic-tree-file',
            logic_tree_filepath)

        logic_tree_xml = ElementTree.parse(logic_tree_filepath)

        ns = re.match(r'\{.*\}', logic_tree_xml.getroot().tag)
        ns = ns.group(0) if ns else ''

        for item in logic_tree_xml.findall('.//%suncertaintyModel' % ns):
            for row in item.text.split('\n'):
                if row.endswith('.xml'):
                    gemui_upload_file(
                        pla, subtab, 'source-model-file',
                        os.path.join(demo_dir, row), select=True)

    if 'gsim_logic_tree_file' in conf:
        gemui_upload_file(
            pla, subtab, 'gsim-logic-tree-file',
            os.path.join(demo_dir, conf['gsim_logic_tree_file']))

    if 'investigation_time' in conf:
        gemui_inputtext_set(pla, subtab, 'investigation_time',
                            conf['investigation_time'])

    if 'intensity_measure_types_and_levels' in conf:
        imtls = literal_eval(conf['intensity_measure_types_and_levels'])

        for imtl_key in imtls.keys():
            imtl = imtls[imtl_key]
            imt_levs = pla.xpath_finduniq(
                ("descendant::table[@name='imt-and-levels-tab']"
                 "//tr[@name='%s']//input[@name='imts_row']"
                 ) % imtl_key, el=subtab)
            imt_levs.clear()
            imt_levs.send_keys(', '.join([str(x) for x in imtl]))

    if 'ses_per_logic_tree_path' in conf:
        gemui_inputtext_set(pla, subtab, 'ses_per_logic_tree_path',
                            conf['ses_per_logic_tree_path'])

    if 'ground_motion_fields' in conf:
        gemui_cbox_set(pla, subtab, 'ground_motion_fields',
                       conf['ground_motion_fields'])

    if 'hazard_curves_from_gmfs' in conf:
        gemui_cbox_set(pla, subtab, 'hazard_curves_from_gmfs',
                       conf['hazard_curves_from_gmfs'])

    if 'hazard_maps' in conf:
        time.sleep(0.5)
        gemui_cbox_set(pla, subtab, 'hazard_maps',
                       conf['hazard_maps'])

    if 'poes' in conf:
        time.sleep(0.5)
        gemui_inputtext_set(pla, subtab, 'poes',
                            conf['poes'])


class DemosTest(unittest.TestCase):
    ini_defaults = {}

    @classmethod
    def setUpClass(cls):
        cls.ini_defaults = _ini_defaults

    def _generic_trial(self, demo_dir):
        pla = platform_get()

        pla.get('/ipt/')
        pla.driver.execute_script(
            "window.gem_not_interactive = true;")

        try:
            footer = pla.xpath_finduniq("//footer")

            # hide footer
            pla.driver.execute_script(
                "$(arguments[0]).attr('style','display:none;')", footer)
        except TimeoutError:
            pass

        for dload in os.listdir(pla.download_dir):
            fpath = os.path.join(pla.download_dir, dload)
            if os.path.isdir(fpath):
                shutil.rmtree(fpath)
            else:
                os.unlink(fpath)

        conf = {}
        for ini_fname in sorted(os.listdir(demo_dir)):
            if ini_fname.endswith('.ini'):
                fp = enc_open(
                        os.path.join(demo_dir, ini_fname),
                        encoding="utf-8")
                conf_part = conf_read(fp.read())
                conf.update(conf_part)

        tab_btn = pla.xpath_finduniq("//a[@href='#tabs-6']")
        tab_btn.click()
        time.sleep(0.5)

        tab = pla.xpath_finduniq("//div[@name='configuration_file']")

        if 'calculation_mode' not in conf:
            raise(ValueError, '"calculation_mode" is missing')

        if conf['calculation_mode'] == 'scenario':
            subtab_btn = pla.xpath_finduniq(
                "descendant::a[@href='#cf_subtabs-1']", el=tab)
            subtab_btn.click()

            time.sleep(0.5)
            subtab = pla.xpath_finduniq(
                "descendant::div[@name='scenario']", el=tab)
        elif conf['calculation_mode'] == 'event_based':
            subtab_btn = pla.xpath_finduniq(
                "descendant::a[@href='#cf_subtabs-3']", el=tab)
            subtab_btn.click()

            time.sleep(0.5)
            subtab = pla.xpath_finduniq(
                "descendant::div[@name='event-based']", el=tab)

        # scenario_populate(conf, pla, subtab, demo_dir)

        # event_based_populate(conf, pla, subtab, demo_dir)
        populate(conf, pla, subtab, demo_dir)

        dload_btn = pla.xpath_finduniq(
            "descendant::button[@name='download']", el=subtab)
        dload_btn.click()

        conf_out = {}
        for fname in os.listdir(pla.download_dir):
            if fname.endswith('.zip'):
                with ZipFile(os.path.join(pla.download_dir, fname)
                             ) as arch:
                    for zip_fname in arch.namelist():
                        if zip_fname.endswith('.ini'):
                            with arch.open(zip_fname) as zip_file:
                                s = zip_file.read()
                                if sys.version_info[0] == 3:
                                    if type(s) is bytes:
                                        s = s.decode(encoding='UTF-8')
                                conf_part = conf_read(s)
                                conf_out.update(conf_part)

        gsim_group = {'gsim_logic_tree_file': 'gsim',
                      'gsim': 'gsim_logic_tree_file'}

        for key in set(conf.keys()) | set(conf_out.keys()):
            if key in ['gsim_logic_tree_file', 'gsim']:
                if (key in conf and key not in conf_out and
                        gsim_group[key] in conf_out):
                    continue
                elif (key in conf_out and key not in conf and
                      gsim_group[key] in conf):
                    continue

            elif key in ['export_dir', 'random_seed', 'ses_seed',
                         'sites_csv']:
                # print("%s found, skip" % key)
                continue
            elif key == 'sites':
                # print("To do manage special 'site' case")
                continue

            if (key in conf) ^ (key in conf_out):
                keyd = conf[key] if key in conf else self.ini_defaults[key]
                keyd_out = (conf_out[key] if key in conf_out else
                            self.ini_defaults[key])
                if keyd == keyd_out:
                    continue

                if key in conf:
                    if key in conf_out:
                        raise ValueError(
                            ('Param "%s" not found in produced ini file' %
                             key))
                    else:
                        raise ValueError(
                            ('Param "%s" not found in original ini file' %
                             key))


def make_function(func_name, demo_dir):
    def generated(self):
        self._generic_trial(demo_dir)

    generated.__name__ = func_name
    return generated


def demos_generator():
    demo_base = os.path.join(os.path.expanduser('~'), 'demos')

    for d in os.listdir(demo_base):
        subd_path = os.path.join(demo_base, d)
        for subd in os.listdir(subd_path):
            demo_dir = os.path.join(subd_path, subd)
            conf = {}
            for ini_fname in sorted(os.listdir(demo_dir)):
                if ini_fname.endswith('.ini'):
                    ini_path = os.path.join(demo_dir, ini_fname)
                    fp = enc_open(ini_path, encoding="utf-8")
                    conf_part = conf_read(fp.read())
                    conf.update(conf_part)

            func_name = "%s_%s_test" % (d, subd)
            if (conf['calculation_mode'] in _SUPPORTED_MODES):
                test_func = make_function(func_name, demo_dir)
                setattr(DemosTest, func_name, test_func)
            else:
                test_func = make_function(func_name, demo_dir)
                setattr(DemosTest, func_name, unittest.skip(
                    'not reproducible')(test_func))


demos_generator()
