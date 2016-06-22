/*
   Copyright (c) 2015-2016, GEM Foundation.

      This program is free software: you can redistribute it and/or modify
      it under the terms of the GNU Affero General Public License as
      published by the Free Software Foundation, either version 3 of the
      License, or (at your option) any later version.

      This program is distributed in the hope that it will be useful,
      but WITHOUT ANY WARRANTY; without even the implied warranty of
      MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
      GNU Affero General Public License for more details.

      You should have received a copy of the GNU Affero General Public License
      along with this program.  If not, see <https://www.gnu.org/licenses/agpl.html>.
*/

var cf_obj = {
    shpfx: '.cf_gid div[name="eq-scenario"]',
    scen_haz_regGrid_coords: null,
    scen_haz_expModel_coords: null

}

$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    function scenario_sect_manager() {
        console.log('scenario_sect_manager');
        var hazard = null; // null or hazard
        var risk = null;   // null, damage or loss
        var hazard_sites_choice = null; // null, region-grid, list-of-sites, exposure-model, site-cond-model

        if ($(cf_obj.shpfx + ' input[type="checkbox"][name="hazard"]').is(':checked')) {
            hazard = 'hazard';
        }
        if ($(cf_obj.shpfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            risk = $(cf_obj.shpfx + ' input[type="radio"][name="risk-type"]:checked').val();
        }

        // Rupture information (ui)
        $target = $(cf_obj.shpfx + ' div[name="rupture-information"]');
        if (hazard != null)
            $target.css('display', '');
        else
            $target.css('display', 'none');

        $target = $(cf_obj.shpfx + ' div[name="hazard-sites"]');
        // Hazard sites (ui)
        if (hazard != null) {
            hazard_sites_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                    + '[name="hazard_sites"]:checked').val();
            $target.css('display', '');
        }
        else {
            $target.css('display', 'none');
        }

        // Region grid
        $target = $(cf_obj.shpfx + ' div[name="region-grid"]');
        if (hazard != null && hazard_sites_choice == 'region-grid')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // List of sites
        $target = $(cf_obj.shpfx + ' div[name="list-of-sites"]');
        if (hazard != null && hazard_sites_choice == 'list-of-sites')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // Exposure model (ui)
        $target = $(cf_obj.shpfx + ' div[name="exposure-model"]');
        if ((hazard != null && hazard_sites_choice == 'exposure-model') || risk != null) {
            $target.css('display', '');
            $subtarget = $(cf_obj.shpfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]');
            if (risk != null) {
                $subtarget.css('display', '');
                $subsubt = $(cf_obj.shpfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                             + ' div[name="region-constraint"]');
                if ($(cf_obj.shpfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                      + ' input[name="include"]').is(':checked'))
                    $subsubt.css('display', '');
                else
                    $subsubt.css('display', 'none');
            }
            else {
                $subtarget.css('display', 'none');
            }
        }
        else
            $target.css('display', 'none');

        // Fragility and vulnerability model (ui)
        var $frag_model = $(cf_obj.shpfx + ' div[name="fragility-model"]');
        var $vuln_model = $(cf_obj.shpfx + ' div[name="vulnerability-model"]');
        $frag_model.css('display', 'none');
        $vuln_model.css('display', 'none');
        if (risk == 'damage') {
            // Fragility model (ui)
            $frag_model.css('display', '');
            var show_cons = $(cf_obj.shpfx + ' div[name="fragility-model"] input[type="checkbox"]'
                          + '[name="fm-loss-include-cons"]').is(':checked');
            var losslist = ['structural', 'nonstructural', 'contents', 'businter' ];
            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(cf_obj.shpfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '"]');
                $target2 = $(cf_obj.shpfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '-cons"]');

                if($(cf_obj.shpfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]'
                     + '[value="' + losstype + '"]').is(':checked')) {
                    $target.css('display', '');
                    if (show_cons)
                        $target2.css('display', '');
                    else
                        $target2.css('display', 'none');
                }
                else {
                    $target.css('display', 'none');
                    $target2.css('display', 'none');
                }

            }
        }
        else if(risk == 'losses') {
            // Vulnerability model (ui)
            $vuln_model.css('display', '');
            var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(cf_obj.shpfx + ' div[name="vulnerability-model"] div[name="vm-loss-'
                            + losstype + '"]');

                if($(cf_obj.shpfx + ' div[name="vulnerability-model"] input[type="checkbox"][name="losstype"]'
                     + '[value="' + losstype + '"]').is(':checked')) {
                    $target.css('display', '');
                }
                else {
                    $target.css('display', 'none');
                }
            }
        }

        // Site cond model (force site conditions to file) (ui)
        $target = $(cf_obj.shpfx + ' div[name="site-conditions"]');
        if (hazard != null) {
            $target.css('display', '');

            if (hazard_sites_choice == 'site-cond-model') {
                $(cf_obj.shpfx + ' input[name="hazard_sitecond"]').prop('disabled', true);
                $(cf_obj.shpfx + ' input[name="hazard_sitecond"][value="from-file"]').prop('checked', true);
                $(cf_obj.shpfx + ' span[name="hazard_sitecond"]').addClass('inlible_disabled');
            }
            else {
                $(cf_obj.shpfx + ' input[name="hazard_sitecond"]').prop('disabled', false);
                $(cf_obj.shpfx + ' span[name="hazard_sitecond"]').removeClass('inlible_disabled');
            }
        }
        else {
            $target.css('display', 'none');
        }

        var sitecond_choice = $(cf_obj.shpfx + ' input[name="hazard_sitecond"]:checked').val();
        $(cf_obj.shpfx + ' div[name^="hazard-sitecond_"]').css('display', 'none');
        $(cf_obj.shpfx + ' div[name="hazard-sitecond_' + sitecond_choice + '"]').css('display', '');



        // Calculation parameters (ui)
        $target = $(cf_obj.shpfx + ' div[name="calculation-parameters"]');
        if (hazard != null) {
            $target.css('display', '');

            if (risk == null) {
                // if risk disabled imts fields must be shown
                $(cf_obj.shpfx + ' div[name="hazard-imt_specify-imt"]').css('display', '');
            }
            else {
                $(cf_obj.shpfx + ' div[name="hazard-imt_specify-imt"]').css('display', 'none');
            }
            // GMPE sub choice
            var gmpe_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                + '[name="hazard_gmpe"]:checked').val();

            $(cf_obj.shpfx + ' div[name^="hazard-gmpe_"]').css('display', 'none');
            $(cf_obj.shpfx + ' div[name="hazard-gmpe_' + gmpe_choice + '"]').css('display', '');

        }
        else
            $target.css('display', 'none');
    }

    /* hazard components callbacks */
    function eqScenario_hazard_onclick_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[name="hazard"]').click(eqScenario_hazard_onclick_cb);
    eqScenario_hazard_onclick_cb({ target: $(cf_obj.shpfx + ' input[name="hazard"]')[0]});

    /* risk components callbacks */
    function eqScenario_risk_onclick_cb(e) {
        $(cf_obj.shpfx + ' span[name="risk-menu"]').css('display', $(e.target).is(':checked') ? '' : 'none');
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[name="risk"]').click(eqScenario_risk_onclick_cb);
    eqScenario_risk_onclick_cb({ target: $(cf_obj.shpfx + ' input[name="risk"]')[0] });

    /* risk type components callbacks */
    function eqScenario_risktype_onclick_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[type="radio"][name="risk-type"]').click(eqScenario_risktype_onclick_cb);
    eqScenario_risktype_onclick_cb({ target: $(cf_obj.shpfx + ' input[name="risk-type"]')[0] });

    /* risk-only region constraint checkbox */
    function eqScenario_region_constraint_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
      + ' input[name="include"]').click(eqScenario_region_constraint_cb);
    eqScenario_region_constraint_cb(
        {target: $(cf_obj.shpfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                   + ' input[name="include"]')[0]});

    /* generic callback to show upload div */
    function eqScenario_fileNew_cb(e) {
        $(cf_obj.shpfx + ' div[name="' + e.target.name + '"]').slideToggle();
    }

    /* form widgets and previous remote list select element must follow precise
       naming schema with '<name>-html' and '<name>-new', see config_files.html */
    function eqScenario_fileNew_upload(event)
    {
        event.preventDefault();
        var name = $(this).attr('name');
        var data = new FormData($(this).get(0));

        $.ajax({
            url: $(this).attr('action'),
            type: $(this).attr('method'),
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                var $sel;
                var gem_group = null;
                var old_sel = [];
                if (data.ret == 0) {
                    if ($(cf_obj.shpfx + ' div[name="' + name + '-html"]')[0].hasAttribute('data_gem_group')) {
                        gem_group = $(cf_obj.shpfx + ' div[name="' + name + '-html"]').attr('data_gem_group');
                        $sel = $(cf_obj.shpfx + ' div[data_gem_group="' + gem_group + '"] select[name="file_html"]');
                        for (var i = 0 ; i < $sel.length ; i++) {
                            old_sel[i] = $($(cf_obj.shpfx + ' div[data_gem_group="' + gem_group + '"] select[name="file_html"]')[i]).val();
                        }
                    }
                    else {
                        $sel = $(cf_obj.shpfx + ' div[name="' + name + '-html"] select[name="file_html"]');
                    }

                    $sel.empty();
                    for (var i = 0 ; i < data.items.length ; i++) {
                        $("<option />", {value: data.items[i][0], text: data.items[i][1]}).appendTo($sel);
                    }
                    for (var i = 0 ; i < old_sel.length ; i++) {
                        $($sel[i]).val(old_sel[i]);
                    }
                    // get file name from full path
                    var selected = data.selected.replace(/^.*[\\\/]/, '');
                    $(cf_obj.shpfx + ' div[name="' + name + '-html"] select[name="file_html"]').val(selected);
                }
                $(cf_obj.shpfx + ' div[name="' + name + '-new"] div[name="msg"]').html(data.ret_msg);
                $(cf_obj.shpfx + ' div[name="' + name + '-new"]').delay(3000).slideUp();
            }
        });
        return false;
    }

    /* rupture file */
    $(cf_obj.shpfx + ' button[name="rupture-file-new"]').click(eqScenario_fileNew_cb);

    $(cf_obj.shpfx + ' div[name="rupture-file-new"]' +
      ' form[name="rupture-file"]').submit(eqScenario_fileNew_upload);

    /* hazard list of sites */
    $(cf_obj.shpfx + ' button[name="list-of-sites-new"]').click(eqScenario_fileNew_cb);

    $(cf_obj.shpfx + ' div[name="list-of-sites-new"]' +
      ' form[name="list-of-sites"]').submit(eqScenario_fileNew_upload);

    /* exposure model */
    $(cf_obj.shpfx + ' button[name="exposure-model-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="exposure-model-new"]' +
      ' form[name="exposure-model"]').submit(eqScenario_fileNew_upload);

    /* fragility model */
    $(cf_obj.shpfx + ' div[name="fragility-model"] input[type="checkbox"]').click(
        scenario_sect_manager);

    /* vulnerability model */
    $(cf_obj.shpfx + ' div[name="vulnerability-model"] input[type="checkbox"]').click(
        scenario_sect_manager);

    /*  +- structural */
    $(cf_obj.shpfx + ' button[name="fm-structural-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-structural-new"]' +
      ' form[name="fm-structural"]').submit(eqScenario_fileNew_upload);

    $(cf_obj.shpfx + ' button[name="fm-structural-cons-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-structural-cons-new"]' +
      ' form[name="fm-structural-cons"]').submit(eqScenario_fileNew_upload);

    /*  +- nonstructural */
    $(cf_obj.shpfx + ' button[name="fm-nonstructural-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-nonstructural-new"]' +
      ' form[name="fm-nonstructural"]').submit(eqScenario_fileNew_upload);

    $(cf_obj.shpfx + ' button[name="fm-nonstructural-cons-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-nonstructural-cons-new"]' +
      ' form[name="fm-nonstructural-cons"]').submit(eqScenario_fileNew_upload);

    /*  +- contents */
    $(cf_obj.shpfx + ' button[name="fm-contents-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-contents-new"]' +
      ' form[name="fm-contents"]').submit(eqScenario_fileNew_upload);

    $(cf_obj.shpfx + ' button[name="fm-contents-cons-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-contents-cons-new"]' +
      ' form[name="fm-contents-cons"]').submit(eqScenario_fileNew_upload);

    /*  +- businter */
    $(cf_obj.shpfx + ' button[name="fm-businter-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-businter-new"]' +
      ' form[name="fm-businter"]').submit(eqScenario_fileNew_upload);

    $(cf_obj.shpfx + ' button[name="fm-businter-cons-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fm-businter-cons-new"]' +
      ' form[name="fm-businter-cons"]').submit(eqScenario_fileNew_upload);

    /* vulnerability model */
        /*  +- structural */
    $(cf_obj.shpfx + ' button[name="vm-structural-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="vm-structural-new"]' +
      ' form[name="vm-structural"]').submit(eqScenario_fileNew_upload);

    /*  +- nonstructural */
    $(cf_obj.shpfx + ' button[name="vm-nonstructural-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="vm-nonstructural-new"]' +
      ' form[name="vm-nonstructural"]').submit(eqScenario_fileNew_upload);

    /*  +- contents */
    $(cf_obj.shpfx + ' button[name="vm-contents-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="vm-contents-new"]' +
      ' form[name="vm-contents"]').submit(eqScenario_fileNew_upload);

    /*  +- businter */
    $(cf_obj.shpfx + ' button[name="vm-businter-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="vm-businter-new"]' +
      ' form[name="vm-businter"]').submit(eqScenario_fileNew_upload);

    /*  +- occupants */
    $(cf_obj.shpfx + ' button[name="vm-occupants-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="vm-occupants-new"]' +
      ' form[name="vm-occupants"]').submit(eqScenario_fileNew_upload);

    /* site conditions */
    $(cf_obj.shpfx + ' button[name="site-conditions-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="site-conditions-new"]' +
      ' form[name="site-conditions"]').submit(eqScenario_fileNew_upload);

    /* imt */
    $(cf_obj.shpfx + ' button[name="gmpe-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="gmpe-new"]' +
      ' form[name="gmpe"]').submit(eqScenario_fileNew_upload);

    /* fravul_model */
    $(cf_obj.shpfx + ' button[name="fravul-model-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="fravul-model-new"]' +
      ' form[name="fravul-model"]').submit(eqScenario_fileNew_upload);

    /* hazard sites callbacks */
    function eqScenario_hazard_hazardSites_onclick_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[name="hazard_sites"]').click(
        eqScenario_hazard_hazardSites_onclick_cb);
    eqScenario_hazard_hazardSites_onclick_cb({ target: $(
        cf_obj.shpfx + ' input[name="hazard_sites"][value="region-grid"]')[0] });

    /* hazard site conditions callbacks */
    function eqScenario_hazard_siteCond_onclick_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[name="hazard_sitecond"]').click(
        eqScenario_hazard_siteCond_onclick_cb);
    eqScenario_hazard_siteCond_onclick_cb({
        target: $(cf_obj.shpfx
                  + ' input[name="hazard_sitecond"][value="uniform-param"]')[0]
    });

    /* hazard gmpe callbacks */
    function eqScenario_hazard_gmpe_onclick_cb(e) {
        scenario_sect_manager();
    }
    $(cf_obj.shpfx + ' input[name="hazard_gmpe"]').click(
        eqScenario_hazard_gmpe_onclick_cb);
    eqScenario_hazard_gmpe_onclick_cb({
        target: $(cf_obj.shpfx + ' input[name="hazard_gmpe"][value="specify-gmpe"]')[0]
    });

    /* handsontables creations */
    /* hazard content table handsontable */
    $(cf_obj.shpfx + ' div[name="table"]').handsontable({
        colHeaders: ['Longitude', 'Latitude'],
        allowInsertColumn: false,
        allowRemoveColumn: false,
        rowHeaders: false,
        contextMenu: true,
        startRows: 3,
        startCols: 2,
        maxCols: 2,
        viewportRowRenderingOffset: 100,
        className: "htLeft",
        stretchH: "all"
    });

    /* hazard content region-constr table handsontable */
    $(cf_obj.shpfx + ' div[name="exposure-model-risk"] div[name="region-constr"]').handsontable({
        colHeaders: ['Longitude', 'Latitude'],
        allowInsertColumn: false,
        allowRemoveColumn: false,
        rowHeaders: false,
        contextMenu: true,
        startRows: 3,
        startCols: 2,
        maxCols: 2,
        viewportRowRenderingOffset: 100,
        className: "htLeft",
        stretchH: "all"
    });

    cf_obj.scen_haz_regGrid_coords = $(cf_obj.shpfx + ' div[name="table"]').handsontable('getInstance');
    cf_obj.scen_haz_expModel_coords = $(
        cf_obj.shpfx + ' div[name="exposure-model-risk"] div[name="region-constr"]'
    ).handsontable('getInstance');

    {
        var tbl = cf_obj.scen_haz_regGrid_coords;
        var $box = $(cf_obj.shpfx + ' div[name="table"]')

        setTimeout(function() {
            return gem_tableHeightUpdate(tbl, $box);
        }, 0);

        cf_obj.scen_haz_regGrid_coords.addHook('afterCreateRow', function() {
            return gem_tableHeightUpdate(tbl, $box);
        });

        cf_obj.scen_haz_regGrid_coords.addHook('afterRemoveRow', function() {
            return gem_tableHeightUpdate(tbl, $box);
        });
    }

    $(cf_obj.shpfx + ' button[name="new_row_add"]').click(function () {
            cf_obj.scen_haz_regGrid_coords.alter('insert_row');
        });

    $(cf_obj.shpfx + ' select[name="gmpe"]').searchableOptionList(
        {data: g_gmpe_options,
         showSelectionBelowList: true,
         maxHeight: '300px'});

    $(cf_obj.shpfx + ' select[name="imt"]').searchableOptionList(
        {showSelectionBelowList: true,
         maxHeight: '300px'});


    function isInt(n){
        return !isNaN(n) && n % 1 === 0;
    }

    function isFloat(n) {
        return  !/^\s*$/.test(n) && !isNaN(n);
    }

    function eqScenario_getData()
    {
        var files_list = [];

        var ret = {
            ret: -1,
            str: '',
            obj: null
        };
        var obj = {
            hazard: null,
            risk: null,
            description: null,

            hazard_sites_choice: null,

            // hazard sites
            grid_spacing: null,
            reggrid_coords_data: null,
            list_of_sites: null,

            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            // rupture information
            rupture_model_file: null,
            rupture_mesh_spacing: null,

            // site conditions
            site_conditions_choice: null,
            reference_vs30_value: null,
            reference_vs30_type: null,
            reference_depth_to_2pt5km_per_sec: null,
            reference_depth_to_1pt0km_per_sec: null,

            // fragility model
            fm_loss_show_cons_choice: false,

            fm_loss_structural_choice: false,
            fm_loss_structural: null,
            fm_loss_nonstructural_choice: false,
            fm_loss_nonstructural: null,
            fm_loss_contents_choice: false,
            fm_loss_contents: null,
            fm_loss_businter_choice: false,
            fm_loss_businter: null,

            fm_loss_structural_cons: null,
            fm_loss_nonstructural_cons: null,
            fm_loss_contents_cons: null,
            fm_loss_businter_cons: null,


            // vulnerability model
            vm_loss_structural_choice: false,
            vm_loss_structural: null,
            vm_loss_nonstructural_choice: false,
            vm_loss_nonstructural: null,
            vm_loss_contents_choice: false,
            vm_loss_contents: null,
            vm_loss_businter_choice: false,
            vm_loss_businter: null,
            vm_loss_occupants_choice: false,
            vm_loss_occupants: null,

            site_model_file: null,

            // calculation parameters
            gmpe_choice: null,
            intensity_measure_types: null,
            fravul_model_file: null,

            ground_motion_correlation_model: null,
            truncation_level: null,
            maximum_distance: null,
            number_of_ground_motion_fields: null
        };

        if ($(cf_obj.shpfx + ' input[type="checkbox"][name="hazard"]').is(':checked'))
            obj.hazard = 'hazard';
        if ($(cf_obj.shpfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            obj.risk = $(cf_obj.shpfx + ' input[type="radio"][name="risk-type"]:checked').val();
        }

        obj.description = $(cf_obj.shpfx + ' textarea[name="description"]').val();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        // Rupture information (get)
        if (obj.hazard == 'hazard') {
            obj.rupture_model_file = $(cf_obj.shpfx + ' div[name="rupture-file-html"] select[name="file_html"]').val();
            if (obj.rupture_model_file == '') {
                ret.str += "'Rupture file' field is empty.\n";
            }
            obj.rupture_mesh_spacing = $(cf_obj.shpfx + ' input[name="rupture_mesh_spacing"]').val();
            if (!isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) <= 0.0) {
                ret.str += "'Rupture Mesh Spacing' field isn't greater than 0 float number (" + obj.rupture_mesh_spacing + ").\n";
            }
            uniqueness_add(files_list, 'rupture model file', obj.rupture_model_file);
        }

        // Hazard sites (get)
        if (obj.hazard == 'hazard') {
            obj.hazard_sites_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                        + '[name="hazard_sites"]:checked').val();

            if (obj.hazard_sites_choice == 'region-grid') {
                // Hazard sites -> Region-grid (get)
                obj.grid_spacing = $(cf_obj.shpfx + ' input[name="grid_spacing"]').val();
                if (!isFloat(obj.grid_spacing) || parseFloat(obj.grid_spacing) <= 0.0) {
                    ret.str += "'Grid spacing' field isn't greater than 0 float number (" + obj.grid_spacing + ").\n";
                }

                obj.reggrid_coords_data = cf_obj.scen_haz_regGrid_coords.getData();
                // Check for invalid value (get)
                for (var i = 0; i < obj.reggrid_coords_data.length; i++) {
                    var lon = obj.reggrid_coords_data[i][0], lat = obj.reggrid_coords_data[i][1];
                    if (lon === null || lat === null || !isFloat(lon) || !isFloat(lat) ||
                        parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                        parseFloat(lat) < -90.0  || parseFloat(lat) > 180.0) {
                        ret.str += "Entry #" + (i+1) + " of region grid 'Coordinates'"
                            + " field is invalid (" + lon + ", " + lat + ").\n";
                    }
                }
            }
            else if (obj.hazard_sites_choice == 'list-of-sites') {
                // Hazard sites -> List-of-sites (get)
                obj.list_of_sites = $(cf_obj.shpfx + ' div[name="list-of-sites-html"] select[name="file_html"]').val();
                if (obj.list_of_sites == '') {
                    ret.str += "'List of sites' field is empty.\n";
                }
                uniqueness_add(files_list, 'list of sites', obj.list_of_sites);
                ret.str += uniqueness_check(files_list);
            }
            else if (obj.hazard_sites_choice == 'exposure-model') {
                // Hazard sites -> Exposure-model (get)
                // checked below because risk related too
            }
            else if (obj.hazard_sites_choice == 'site-cond-model') {
                // Hazard sites -> Site-cond-model (get)
                // check below the Site conditions session
            }
            else {
                ret.str += "Unknown 'Hazard sites' choice (' + obj.hazard_sites_choice + ').\n";
            }
        }

        // Exposure model (get)
        if ((obj.hazard == 'hazard' && obj.hazard_sites_choice == 'exposure-model')
            || obj.risk != null) {
            // hazard sites -> exposure-model
            obj.exposure_model = $(cf_obj.shpfx + ' div[name="exposure-model-html"] select[name="file_html"]').val();
            if (obj.exposure_model == '') {
                ret.str += "'Exposure model' field is empty.\n";
            }

            uniqueness_add(files_list, 'exposure model', obj.exposure_model);
            ret.str += uniqueness_check(files_list);
            if (obj.risk != null) {
                obj.exposure_model_regcons_choice = $(
                    cf_obj.shpfx + ' div[name="exposure-model"] input[type="checkbox"][name="include"]'
                ).is(':checked');
                if (obj.exposure_model_regcons_choice) {
                    obj.exposure_model_regcons_coords_data = cf_obj.scen_haz_expModel_coords.getData();

                    // Check for invalid value
                    for (var i = 0; i < obj.exposure_model_regcons_coords_data.length; i++) {
                        var lon = obj.exposure_model_regcons_coords_data[i][0];
                        var lat = obj.exposure_model_regcons_coords_data[i][1];
                        if (lon === null || lat === null || !isFloat(lon) || !isFloat(lat) ||
                            parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                            parseFloat(lat) < -90.0  || parseFloat(lat) > 180.0) {
                            ret.str += "Entry #" + (i+1) + " of exposure model 'Region constraint'"
                                + " field is invalid (" + lon + ", " + lat + ").\n";
                        }
                    }
                }
            }
        }

        // Fragility and vulnerability model (get)
        var $frag_model = $(cf_obj.shpfx + ' div[name="fragility-model"]');
        var $vuln_model = $(cf_obj.shpfx + ' div[name="vulnerability-model"]');
        if (obj.risk == 'damage') {
            // Fragility model (get)
            var show_cons = $(cf_obj.shpfx + ' div[name="fragility-model"] input[type="checkbox"]'
                              + '[name="fm-loss-include-cons"]').is(':checked');
            obj.fm_loss_show_cons_choice = show_cons;
            var losslist = ['structural', 'nonstructural', 'contents', 'businter' ];
            var descr = { structural: 'structural', nonstructural: 'nonstructural',
                          contents: 'contents', businter: 'business interruption' };

            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(cf_obj.shpfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '"]');
                $target2 = $(cf_obj.shpfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '-cons"]');

                obj['fm_loss_' + losstype + '_choice'] = $(
                    cf_obj.shpfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]'
                        + '[value="' + losstype + '"]').is(':checked')
                if(obj['fm_loss_' + losstype + '_choice']) {
                    obj['fm_loss_' + losstype] = $target.find('select[name="file_html"]').val();
                    uniqueness_add(files_list, 'fragility model: ' + descr[losstype], obj['fm_loss_' + losstype]);
                    ret.str += uniqueness_check(files_list);

                    if (show_cons) {
                        obj['fm_loss_' + losstype + '_cons'] = $target2.find('select[name="file_html"]').val();
                        uniqueness_add(files_list, 'fragility model: ' + descr[losstype] + ' consequencies', obj['fm_loss_' + losstype + '_cons']);
                        ret.str += uniqueness_check(files_list);
                    }

                }
            }
        }
        else if(obj.risk == 'losses') {
            // Vulnerability model (get)
            var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(cf_obj.shpfx + ' div[name="vulnerability-model"] div[name="vm-loss-'
                            + losstype + '"]');

                obj['vm_loss_' + losstype + '_choice'] = $(
                    cf_obj.shpfx + ' div[name="vulnerability-model"] input[type="checkbox"][name="losstype"]'
                        + '[value="' + losstype + '"]').is(':checked')
                if(obj['vm_loss_' + losstype + '_choice']) {
                    var descr = { structural: 'structural', nonstructural: 'nonstructural',
                                  contents: 'contents', businter: 'business interruption' };

                    obj['vm_loss_' + losstype] = $target.find('select[name="file_html"]').val();
                    uniqueness_add(files_list, 'vulnerability model: ' + descr[losstype], obj['vm_loss_' + losstype]);
                    ret.str += uniqueness_check(files_list);
                }
            }
        }

        // Site conditions (get)
        if (obj.hazard == 'hazard') {
            obj.site_conditions_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                           + '[name="hazard_sitecond"]:checked').val();

            if (obj.site_conditions_choice == 'uniform-param') {
                // site conditions -> uniform-param (get)
                obj.reference_vs30_value = $(cf_obj.shpfx + ' div[name="hazard-sitecond_uniform-param"]'
                                             + ' input[type="text"][name="reference_vs30_value"]').val();
                if (!isFloat(obj.reference_vs30_value) || parseFloat(obj.reference_vs30_value) < 0.0) {
                    ret.str += "'Reference vs30 value' field isn't positive float number (" + obj.reference_vs30_value + ").\n";
                }
                obj.reference_vs30_type = $(cf_obj.shpfx + ' input[type="radio"]'
                                            + '[name="hazard_sitecond_type"]:checked').val();
                if (obj.reference_vs30_type != 'inferred' && obj.reference_vs30_type != 'measured') {
                    ret.str += "Reference vs30 type choice (" + obj.reference_vs30_type + ") unknown";
                }

                obj.reference_depth_to_2pt5km_per_sec = $(cf_obj.shpfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                          + ' input[type="text"][name="reference_depth_to_2pt5km_per_sec"]').val();
                if (!isFloat(obj.reference_depth_to_2pt5km_per_sec) || parseFloat(obj.reference_depth_to_2pt5km_per_sec) < 0.0) {
                    ret.str += "'Minimum depth at which vs30 >= 2.5' field isn't positive float number (" + obj.reference_depth_to_2pt5km_per_sec + ").\n";
                }
                obj.reference_depth_to_1pt0km_per_sec = $(cf_obj.shpfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                          + ' input[type="text"][name="reference_depth_to_1pt0km_per_sec"]').val();
                if (!isFloat(obj.reference_depth_to_1pt0km_per_sec) || parseFloat(obj.reference_depth_to_1pt0km_per_sec) < 0.0) {
                    ret.str += "'Minimum depth at which vs30 >= 1.0' field isn't positive float number (" + obj.reference_depth_to_1pt0km_per_sec + ").\n";
                }
            }
            else if (obj.site_conditions_choice == 'from-file') {
                // site conditions -> from-file (get)
                obj.site_model_file = $(cf_obj.shpfx + ' div[name="site-conditions-html"] select[name="file_html"]').val();
                if (obj.site_model_file == '') {
                    ret.str += "'Site conditions file' field is empty.\n";
                }
                uniqueness_add(files_list, 'site conditions', obj.site_model_file);
                ret.str += uniqueness_check(files_list);

            }
            else {
                ret.str += "Unknown 'Site conditions' choice (' + obj.site_conditions_choice + ').\n";
            }
        }


        // Calculation parameters (get)
        if (obj.hazard == 'hazard') {
            obj.gmpe_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                + '[name="hazard_gmpe"]:checked').val();

            if (obj.gmpe_choice == 'specify-gmpe') {
                obj.gsim = $(cf_obj.shpfx + ' input[type="radio"][name="gmpe"]:checked').map(function(_, el) {
                    return $(el).val();
                }).get();

                if (obj.gsim.length < 1) {
                    ret.str += "Unique GMPE not selected.\n";
                }
            }
            else if (obj.gmpe_choice == 'from-file') {
                // calculation parameters -> from file (get)
                obj.fravul_model_file = $(cf_obj.shpfx + ' div[name="hazard-gmpe_from-file"]'
                                          + ' div[name="fravul-model-html"] select[name="file_html"]').val();
                if (obj.fravul_model_file == '') {
                    ret.str += "'GMPE logic tree file' field is empty.\n";
                }
                uniqueness_add(files_list, 'GMPE logic tree', obj.fravul_model_file);
                ret.str += uniqueness_check(files_list);
            }
            else {
                ret.str += "Unknown 'GMPE' choice (" + obj.gmpe_choice + ").\n";
            }

            if (obj.risk == null) {
                // if risk disabled imts fields must be shown
                // calculation parameters -> specify-imt (get)
                obj.intensity_measure_types = $(
                    cf_obj.shpfx + ' div[name="hazard-imt_specify-imt"]'
                        + ' input[type="checkbox"][name="imt"]:checked').map(function(_, el) {
                            return $(el).val();
                        }).get();

                obj.custom_imt = $(cf_obj.shpfx + ' input[name="custom_imt"]').val();

                if (obj.intensity_measure_types.length < 1 && obj.custom_imt == "") {
                    ret.str += "IMT's not selected.\n";
                }
            }

            obj.ground_motion_correlation_model = $(
                cf_obj.shpfx + ' select[name="ground-motion-correlation"]').val();

            if (["", "JB2009"].indexOf(obj.ground_motion_correlation_model) == -1) {
                ret.str += "'Ground Motion Correlation' field unknown.\n";
            }

            obj.truncation_level = $(cf_obj.shpfx + ' input[name="truncation_level"]').val();
            if (!isFloat(obj.truncation_level) || parseFloat(obj.truncation_level) < 0.0) {
                ret.str += "'Level of truncation' field isn't positive float number (" + obj.truncation_level + ").\n";
            }

            obj.maximum_distance = $(cf_obj.shpfx + ' input[name="maximum_distance"]').val();
            if (!isFloat(obj.maximum_distance) || parseFloat(obj.maximum_distance) < 0.0) {
                ret.str += "'Maximum source-to-site distance' field isn't positive float number (" + obj.maximum_distance + ").\n";
            }

            obj.number_of_ground_motion_fields = $(cf_obj.shpfx + ' input[name="number_of_ground_motion_fields"]').val();
            if (!isInt(obj.number_of_ground_motion_fields) || parseInt(obj.number_of_ground_motion_fields) <= 0) {
                ret.str += "'Number of ground motion fields' field isn't greater than 0 integer number (" + obj.number_of_ground_motion_fields + ").\n";
            }
        }

        if (ret.str == '') {
            ret.ret = 0;
            ret.obj = obj;
        }
        return ret;
    }

    function eqScenario_download_cb(e)
    {
        e.preventDefault();

        var ret = eqScenario_getData();

        if (ret.ret != 0) {
            $( "#dialog-message" ).html(ret.str.replace(/\n/g, "<br/>"));
            $( "#dialog-message" ).dialog({
                modal: true,
                width: '600px',
                buttons: {
                    Ok: function() {
                        $(this).dialog( "close" );
                    }
                }
            });

            return;
        }

        var data = new FormData();
        data.append('data', JSON.stringify(ret.obj));
        $.ajax({
            url: 'prepare',
            type: 'POST',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.ret == 0) {
                    var $form = $('.cf_gid #downloadForm');
                    $form.empty();
                    $form.append(csrf_token);
                    $form.attr({'action': 'download'});
                    $new_input = $('<input/>');
                    $new_input.attr('type', 'hidden').attr({'name': 'zipname', 'value': data.zipname });
                    $form.append($new_input);
                    console.log($form);
                    $form.submit();
                }
            }
        });
        return false;
    }

    $(cf_obj.shpfx + ' button[name="download"]').click(eqScenario_download_cb);

    scenario_sect_manager();

});

