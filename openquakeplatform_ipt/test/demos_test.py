#!/usr/bin/env python
import unittest
import os
import time
import shutil
import configparser
from openquake.moon import platform_get
from selenium.webdriver.support.ui import Select
from zipfile import ZipFile


def dilist_deserialize(s):
    ret = []
    for row in s.split(','):
        row_out = []
        for col in row.strip().split(' '):
            row_out.append(col)
        ret.append(row_out)
    return ret


def gemui_radio_set(pla, subtab, name, value):
    radio_tag = pla.xpath_finduniq(
        "descendant::input[@type='radio'][@name='%s'][@value='%s']" % (
            name, value), el=subtab)
    pla.driver.execute_script(
        ("$(arguments[0]).prop('checked', true).triggerHandler('click')"),
        radio_tag)


def upload_file(pla, subtab, name, filepath):
    rup_file = pla.xpath_finduniq(
        "descendant::div[@name='%s-html']//button[@name='%s"
        "-new']" % (name, name), el=subtab)
    rup_file.click()

    upload_file_tag = pla.xpath_finduniq(
        "descendant::div[@name='%s-new']//form[@id='file-upload"
        "-form' and @name='%s']//input[@name='file_upload']" % (
            name, name), el=subtab)

    pla.driver.execute_script(
        "$(arguments[0]).attr('style','visibility:visible;')", upload_file_tag)
    time.sleep(1)
    upload_file_tag.send_keys(filepath)


def description_set(conf, pla, subtab):
    desc = pla.xpath_finduniq("descendant::textarea[@name='description']",
                              el=subtab)
    desc.clear()
    desc.send_keys(conf['description'])


def scenario_populate(conf, pla, subtab, demo_dir):
    if 'description' in conf:
        description_set(conf, pla, subtab)

    if 'rupture_mesh_spacing' in conf:
        rms = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='rupture_mesh_spacing']",
            el=subtab)
        rms.clear()
        rms.send_keys(conf['rupture_mesh_spacing'])

    if 'region_grid_spacing' in conf:
        grid_spa = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='grid_spacing']",
            el=subtab)
        grid_spa.clear()
        grid_spa.send_keys(conf['region_grid_spacing'])

    if 'region' in conf:
        reg_grid = pla.xpath_finduniq(
            "descendant::div[@name='region-coordinates-table']//"
            "div[@name='table']", el=subtab)
        dilist = dilist_deserialize(conf['region'])
        pla.driver.execute_script(
            "$(arguments[0]).handsontable('getInstance').loadData("
            "arguments[1]);", reg_grid, dilist)

    if 'reference_vs30_value' in conf:
        vsval = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='reference_vs30_value']",
            el=subtab)
        vsval.clear()
        vsval.send_keys(conf['reference_vs30_value'])

    if 'reference_vs30_type' in conf:
        gemui_radio_set(pla, subtab, 'hazard_sitecond_type',
                        conf['reference_vs30_type'])
        # vstyp = pla.xpath_finduniq(
        #     ("descendant::input[@type='radio'][@value='%s']" %
        #      conf['reference_vs30_type']), el=subtab)
        # pla.driver.execute_script(
        #     ("$(arguments[0]).prop('checked', true).triggerHandler('click')"),
        #     vstyp)
        
    # reference_vs30_type = measured

    if 'reference_depth_to_1pt0km_per_sec' in conf:
        ref1pt0 = pla.xpath_finduniq(
            "descendant::input[@type='text']"
            "[@name='reference_depth_to_1pt0km_per_sec']", el=subtab)
        ref1pt0.clear()
        ref1pt0.send_keys(conf['reference_depth_to_1pt0km_per_sec'])

    if 'reference_depth_to_2pt5km_per_sec' in conf:
        ref2pt5 = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='reference_depth_to_2pt5km"
            "_per_sec']", el=subtab)
        ref2pt5.clear()
        ref2pt5.send_keys(conf['reference_depth_to_2pt5km_per_sec'])

    if 'rupture_model_file' in conf:
        upload_file(pla, subtab, 'rupture-file',
                    os.path.join(demo_dir, conf['rupture_model_file']))



        # xxxxx
        # rup_file = pla.xpath_finduniq(
        #     "descendant::div[@name='rupture-file-html']//button[@name='rupture"
        #     "-file-new']", el=subtab)
        # rup_file.click()

        # upload_file = pla.xpath_finduniq(
        #     "descendant::div[@name='rupture-file-new']//form[@id='file-upload"
        #     "-form' and @name='rupture-file']//input[@name='file_upload']")

        # pla.driver.execute_script(
        #     "$(arguments[0]).attr('style','visibility:visible;')", upload_file)
        # time.sleep(1)
        # upload_file.send_keys(os.path.join(
        #     demo_dir, conf['rupture_model_file']))

        
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
            cust_tag = pla.xpath_finduniq(
                "descendant::input[@type='text']"
                "[@name='custom_imt']", el=subtab)
            cust_tag.clear()
            cust_tag.send_keys(', '.join(cust_imt))

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

    if 'ground_motion_correlation_model' in conf:
        # 'ground_motion_correlation_params' is set automatically
        gmcm_tag = pla.xpath_finduniq(
            "descendant::select[@name='ground-motion"
            "-correlation']", el=subtab)
        gmcm = Select(gmcm_tag)
        gmcm.select_by_value(conf['ground_motion_correlation_model'])

    if 'truncation_level' in conf:
        trunc_tag = pla.xpath_finduniq(
            "descendant::input[@type='text']"
            "[@name='truncation_level']", el=subtab)
        trunc_tag.clear()
        trunc_tag.send_keys(conf['truncation_level'])

    if 'number_of_ground_motion_fields' in conf:
        ngmf_tag = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='number_of_ground_motion"
            "_fields']", el=subtab)
        ngmf_tag.clear()
        ngmf_tag.send_keys(conf['number_of_ground_motion_fields'])

    if 'maximum_distance' in conf:
        maxdist_tag = pla.xpath_finduniq(
            "descendant::input[@type='text'][@name='maximum_distance']",
            el=subtab)
        maxdist_tag.clear()
        maxdist_tag.send_keys(conf['maximum_distance'])

    ngmf_tag = pla.xpath_finduniq(
        "descendant::input[@type='text'][@name='number_of_ground_motion"
        "_fields']", el=subtab)


def event_based_populate(conf, pla, subtab, demo_dir):
    if 'description' in conf:
        description_set(conf, pla, subtab)
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
        with open(gen_filepath, "w") as fout:
            fout.write(site_content)

        upload_file(pla, subtab, 'list-of-sites', gen_filepath)



# sites: 0.5 -0.5 (<type 'unicode'>)
# Sect: logic_tree
# number_of_logic_tree_samples: 0 (<type 'unicode'>)
# rupture_mesh_spacing: 2 (<type 'unicode'>)
# width_of_mfd_bin: 0.1 (<type 'unicode'>)
# area_source_discretization: 5.0 (<type 'unicode'>)
# reference_vs30_type: measured (<type 'unicode'>)
# reference_vs30_value: 600.0 (<type 'unicode'>)
# reference_depth_to_2pt5km_per_sec: 5.0 (<type 'unicode'>)
# reference_depth_to_1pt0km_per_sec: 100.0 (<type 'unicode'>)
# source_model_logic_tree_file: source_model_logic_tree.xml (<type 'unicode'>)
# gsim_logic_tree_file: gmpe_logic_tree.xml (<type 'unicode'>)
# investigation_time: 50.0 (<type 'unicode'>)
# intensity_measure_types_and_levels: {"PGA": [0.005, 0.007, 0.0098, 0.0137, 0.0192, 0.0269, 0.0376, 0.0527, 0.0738, 0.103, 0.145, 0.203, 0.284, 0.397, 0.556, 0.778, 1.09, 1.52, 2.13]} (<type 'unicode'>)
# truncation_level: 3 (<type 'unicode'>)
# maximum_distance: 200.0 (<type 'unicode'>)
# ses_per_logic_tree_path: 100 (<type 'unicode'>)
# ground_motion_correlation_model:  (<type 'unicode'>)
# ground_motion_correlation_params:  (<type 'unicode'>)
# export_dir: /tmp (<type 'unicode'>)
# ground_motion_fields: true (<type 'unicode'>)
# hazard_curves_from_gmfs: true (<type 'unicode'>)
# hazard_maps: true (<type 'unicode'>)
# poes: 0.1 (<type 'unicode'>)


def conf_read(fp):
    conf = {}

    conf_par = configparser.ConfigParser()
    conf_par.read_file(fp)
    for sect in conf_par.sections():
        print("Sect: %s" % sect)
        for opt in conf_par.options(sect):
            print("%s: %s (%s)" % (opt, conf_par.get(sect, opt),
                                   type(conf_par.get(sect, opt))))
            conf[opt] = conf_par.get(sect, opt)
    return conf


class DemosTest(unittest.TestCase):
    def demo_test(self):
        pla = platform_get()

        demo_dirs = [
            '/home/ubuntu/oq-engine/demos/hazard/ScenarioCase1',
#            '/home/ubuntu/oq-engine/demos/hazard/ScenarioCase2',
#            '/home/ubuntu/oq-engine/demos/hazard/EventBasedPSHA'
        ]

        for demo_dir in demo_dirs:
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
            for ini_fname in os.listdir(demo_dir):
                if ini_fname.endswith('.ini'):
                    conf_part = conf_read(
                        open(os.path.join(demo_dir, ini_fname)))
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
                scenario_populate(conf, pla, subtab, demo_dir)

            elif conf['calculation_mode'] == 'event_based':
                subtab_btn = pla.xpath_finduniq(
                    "descendant::a[@href='#cf_subtabs-3']", el=tab)
                subtab_btn.click()

                time.sleep(0.5)
                subtab = pla.xpath_finduniq(
                    "descendant::div[@name='event-based']", el=tab)
                event_based_populate(conf, pla, subtab, demo_dir)

            time.sleep(20)
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
                                    conf_part = conf_read(zip_file)
                                    conf_out.update(conf_part)

            gsim_group = {'gsim_logic_tree_file': 'gsim',
                          'gsim': 'gsim_logic_tree_file'}

            for key in set(conf.keys() + conf_out.keys()):
                if key in ['gsim_logic_tree_file', 'gsim']:
                    if key in conf and (
                            key in conf_out or gsim_group[key] in conf_out):
                        print("%s found1, skip" % key)
                        continue
                    elif key in conf_out and (
                            key in conf or gsim_group[key] in conf):
                        print("%s found2, skip" % key)
                        continue
                elif key in ['export_dir', 'random_seed', 'ses_seed']:
                    print("%s found, skip" % key)
                    continue

                if key in conf and key in conf_out:
                    if conf[key] == conf_out[key]:
                        continue
                    else:
                        raise ValueError(
                            'Values for param "%s" differs (%s) != (%s)' % (
                                key, conf[key], conf_out[key]))
                elif key in conf:
                    raise ValueError(
                        'Param "%s" not found in produced ini file(s)' % (
                            key))
                else:
                    raise ValueError(
                        'Param "%s" not found in original ini file' % (
                            key))

