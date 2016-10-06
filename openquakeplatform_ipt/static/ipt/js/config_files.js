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
    scen: {
        pfx: '.cf_gid div[name="scenario"]',
        getData: null,
        regGrid_coords: null,
        expModel_coords: null
    },
    e_b: {
        pfx: '.cf_gid div[name="event-based"]',
        getData: null,
        expModel_coords: null
    }
}

$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    function exposure_model_sect_manager(scope, enabled, with_constraints)
    {
        $target = $(cf_obj[scope].pfx + ' div[name="exposure-model"]');
        if (enabled) {
            $target.css('display', '');
            $subtarget = $(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]');
            if (with_constraints) {
                $subtarget.css('display', '');
                $subsubt = $(cf_obj[scope].pfx
                             + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                             + ' div[name="region-constraint"]');
                if ($(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                      + ' input[name="region_constraint_choice"]').is(':checked'))
                    $subsubt.css('display', '');
                else
                    $subsubt.css('display', 'none');

                $subsubt = $(cf_obj[scope].pfx
                             + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                             + ' div[name="asset-hazard-distance"]');
                if ($(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
                      + ' input[name="asset_hazard_distance_choice"]').is(':checked'))
                    $subsubt.css('display', '');
                else
                    $subsubt.css('display', 'none');
            }
            else {
                $subtarget.css('display', 'none');
            }
        }
        else {
            $target.css('display', 'none');
        }
    }

    function fragility_model_sect_manager(scope, is_active)
    {
        var $frag_model = $(cf_obj[scope].pfx + ' div[name="fragility-model"]');

        if (!is_active) {
            $frag_model.css('display', 'none');
            return;
        }

        // Fragility model (ui)
        $frag_model.css('display', '');
        var show_cons = $(cf_obj[scope].pfx + ' div[name="fragility-model"] input[type="checkbox"]'
                          + '[name="fm-loss-include-cons"]').is(':checked');
        var losslist = ['structural', 'nonstructural', 'contents', 'businter' ];
        for (var lossidx in losslist) {
            var losstype = losslist[lossidx];

            $target = $(cf_obj[scope].pfx + ' div[name="fragility-model"] div[name="fm-loss-'
                        + losstype + '"]');
            $target2 = $(cf_obj[scope].pfx + ' div[name="fragility-model"] div[name="fm-loss-'
                         + losstype + '-cons"]');

            if($(cf_obj[scope].pfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]'
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

    function vulnerability_model_sect_manager(scope, is_enabled)
    {
        var pfx = cf_obj[scope].pfx + ' div[name="vulnerability-model"]';
        var $vuln_model = $(pfx);

        if (! is_enabled) {
            $vuln_model.css('display', 'none');
            return;
        }

        // Vulnerability model (ui)
        $vuln_model.css('display', '');
        var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
        for (var lossidx in losslist) {
            var losstype = losslist[lossidx];

            $target = $(pfx + ' div[name="vm-loss-' + losstype + '"]');

            if($(pfx + ' input[type="checkbox"][name="losstype"][value="' + losstype + '"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }
        }

        if($(pfx + ' input[name="asset-correlation-choice"]').is(':checked'))
            $(pfx + ' div[name="asset-correlation"]').css('display', '');
        else
            $(pfx + ' div[name="asset-correlation"]').css('display', 'none');
    }

    function site_conditions_sect_manager(scope, is_enabled, force_file_choice)
    {
        // Site conditions model (force site conditions to file) (ui)
        $target = $(cf_obj[scope].pfx + ' div[name="site-conditions"]');
        if (is_enabled != false) {
            $target.css('display', '');

            if (force_file_choice) {
                $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"]').prop('disabled', true);
                $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"][value="from-file"]').prop('checked', true);
                $(cf_obj[scope].pfx + ' span[name="hazard_sitecond"]').addClass('inlible_disabled');
            }
            else {
                $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"]').prop('disabled', false);
                $(cf_obj[scope].pfx + ' span[name="hazard_sitecond"]').removeClass('inlible_disabled');
            }
        }
        else {
            $target.css('display', 'none');
        }

        var sitecond_choice = $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"]:checked').val();
        $(cf_obj[scope].pfx + ' div[name^="hazard-sitecond_"]').css('display', 'none');
        $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_' + sitecond_choice + '"]').css('display', '');
    }

    // Exposure model (get)
    // scope == 'scen' or 'e_b'
    function exposure_model_getData(scope, ret, files_list, obj, enabled, with_constraints)
    {
        if (enabled) {
            // hazard sites -> exposure-model
            obj.exposure_model = $(cf_obj[scope].pfx + ' div[name="exposure-model-html"] select[name="file_html"]').val();
            if (obj.exposure_model == '') {
                ret.str += "'Exposure model' field is empty.\n";
            }

            uniqueness_add(files_list, 'exposure model', obj.exposure_model);
            ret.str += uniqueness_check(files_list);
            if (with_constraints) {
                obj.exposure_model_regcons_choice = $(
                    cf_obj[scope].pfx + ' div[name="exposure-model"]'
                    + ' input[type="checkbox"][name="region_constraint_choice"]'
                ).is(':checked');
                if (obj.exposure_model_regcons_choice) {
                    obj.exposure_model_regcons_coords_data = cf_obj[scope].expModel_coords.getData();

                    // Check for invalid value
                    for (var i = 0; i < obj.exposure_model_regcons_coords_data.length; i++) {
                        var lon = obj.exposure_model_regcons_coords_data[i][0];
                        var lat = obj.exposure_model_regcons_coords_data[i][1];
                        if (lon === null || lat === null || !isFloat(lon) || !isFloat(lat) ||
                            parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                            parseFloat(lat) < -90.0  || parseFloat(lat) > 90.0) {
                            ret.str += "Entry #" + (i+1) + " of exposure model 'Region constraint'"
                                + " field is invalid (" + lon + ", " + lat + ").\n";
                        }
                    }
                }

                obj.asset_hazard_distance_choice = $(
                    cf_obj[scope].pfx + ' div[name="exposure-model"]'
                    + ' input[type="checkbox"][name="asset_hazard_distance_choice"]'
                ).is(':checked');
                if (obj.asset_hazard_distance_choice) {
                    obj.asset_hazard_distance = $(
                        cf_obj[scope].pfx + ' div[name="exposure-model"]'
                            + ' input[type="text"][name="asset_hazard_distance"]').val();
                    if (!isFloat(obj.asset_hazard_distance)
                        || parseFloat(obj.asset_hazard_distance) < 0.0) {
                        ret.str += "'Asset hazard distance' field is negative float number ("
                            + obj.asset_hazard_distance + ").\n";
                    }
                }
            }
        }
    }

    // Vulnerability model (get)
    function vulnerability_model_getData(scope, ret, files_list, obj)
    {

        var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
        var descr = { structural: 'structural', nonstructural: 'nonstructural',
                      contents: 'contents', businter: 'business interruption',
                      occupants: 'occupants' };
        var pfx = cf_obj[scope].pfx + ' div[name="vulnerability-model"]';
        for (var lossidx in losslist) {
            var losstype = losslist[lossidx];

            $target = $(pfx + ' div[name="vm-loss-' + losstype + '"]');

            obj['vm_loss_' + losstype + '_choice'] = $(
                pfx + ' input[type="checkbox"][name="losstype"][value="' + losstype + '"]'
            ).is(':checked');
            if(obj['vm_loss_' + losstype + '_choice']) {
                obj['vm_loss_' + losstype] = $target.find('select[name="file_html"]').val();

                if (obj['vm_loss_' + losstype] == '') {
                    ret.str += "'" + descr[losstype] + " vulnerability model' field is empty.\n";
                }
                uniqueness_add(files_list, descr[losstype] + " vulnerability model", obj['vm_loss_' + losstype]);
                ret.str += uniqueness_check(files_list);
            }
        }

        obj['insured_losses'] = $(pfx + ' input[type="checkbox"][name="insured_losses"]').is(':checked');

        obj['asset_correlation_choice'] = $(
            pfx + ' input[type="checkbox"][name="asset-correlation-choice"]').is(':checked');
        if (obj['asset_correlation_choice'] == true) {
            obj['asset_correlation'] = $(pfx + ' input[type="text"][name="asset_correlation"]').val();
            if (obj['asset_correlation'] < 0.0 || obj['asset_correlation'] > 1.0) {
                ret.str += "'asset correlation' out of range 0.0 ≤ x ≤ 1.0";
            }
        }
    }

    function site_conditions_getData(scope, ret, files_list, obj)
    {
        obj.site_conditions_choice = $(cf_obj[scope].pfx + ' input[type="radio"]'
                                       + '[name="hazard_sitecond"]:checked').val();

        if (obj.site_conditions_choice == 'uniform-param') {
            // site conditions -> uniform-param (get)
            obj.reference_vs30_value = $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_uniform-param"]'
                                         + ' input[type="text"][name="reference_vs30_value"]').val();
            if (!isFloat(obj.reference_vs30_value) || parseFloat(obj.reference_vs30_value) < 0.0) {
                ret.str += "'Reference vs30 value' field isn't positive float number (" + obj.reference_vs30_value + ").\n";
            }
            obj.reference_vs30_type = $(cf_obj[scope].pfx + ' input[type="radio"]'
                                        + '[name="hazard_sitecond_type"]:checked').val();
            if (obj.reference_vs30_type != 'inferred' && obj.reference_vs30_type != 'measured') {
                ret.str += "Reference vs30 type choice (" + obj.reference_vs30_type + ") unknown";
            }

            obj.reference_depth_to_2pt5km_per_sec = $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                      + ' input[type="text"][name="reference_depth_to_2pt5km_per_sec"]').val();
            if (!isFloat(obj.reference_depth_to_2pt5km_per_sec) || parseFloat(obj.reference_depth_to_2pt5km_per_sec) < 0.0) {
                ret.str += "'Minimum depth at which vs30 >= 2.5' field isn't positive float number (" + obj.reference_depth_to_2pt5km_per_sec + ").\n";
            }
            obj.reference_depth_to_1pt0km_per_sec = $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                      + ' input[type="text"][name="reference_depth_to_1pt0km_per_sec"]').val();
            if (!isFloat(obj.reference_depth_to_1pt0km_per_sec) || parseFloat(obj.reference_depth_to_1pt0km_per_sec) < 0.0) {
                ret.str += "'Minimum depth at which vs30 >= 1.0' field isn't positive float number (" + obj.reference_depth_to_1pt0km_per_sec + ").\n";
            }
        }
        else if (obj.site_conditions_choice == 'from-file') {
            // site conditions -> from-file (get)
            obj.site_model_file = $(cf_obj[scope].pfx + ' div[name="site-conditions-html"] select[name="file_html"]').val();
            if (obj.site_model_file == '') {
                ret.str += "'Site conditions file' field is empty.\n";
            }
            uniqueness_add(files_list, 'site conditions', obj.site_model_file);
            ret.str += uniqueness_check(files_list);

        }
        else {
            ret.str += "Unknown 'Site conditions' choice (" + obj.site_conditions_choice + ").\n";
        }
        return;
    }


    /* form widgets and previous remote list select element must follow precise
       naming schema with '<name>-html' and '<name>-new', see config_files.html */
    function generic_fileNew_upload(scope, obj, event)
    {
        event.preventDefault();
        var name = $(obj).attr('name');
        var data = new FormData($(obj).get(0));

        $.ajax({
            url: $(obj).attr('action'),
            type: $(obj).attr('method'),
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                var $sel;
                var gem_group = null;
                var old_sel = [];
                if (data.ret == 0) {
                    if ($(cf_obj[scope].pfx + ' div[name="' + name + '-html"]')[0].hasAttribute('data_gem_group')) {
                        gem_group = $(cf_obj[scope].pfx + ' div[name="' + name + '-html"]').attr('data_gem_group');
                        // find elements of groups around all the config_file tab
                        $sel = $('.cf_gid div[data_gem_group="' + gem_group + '"] select[name="file_html"]');
                        for (var i = 0 ; i < $sel.length ; i++) {
                            old_sel[i] = $($sel[i]).val();
                        }
                    }
                    else {
                        $sel = $(cf_obj[scope].pfx + ' div[name="' + name + '-html"] select[name="file_html"]');
                    }

                    $sel.empty();
                    if (! $sel.is("[multiple]")) {
                        $("<option />", {value: '', text: '---------'}).appendTo($sel);
                    }
                    for (var i = 0 ; i < data.items.length ; i++) {
                        $("<option />", {value: data.items[i][0], text: data.items[i][1]}).appendTo($sel);
                    }
                    for (var i = 0 ; i < old_sel.length ; i++) {
                        $($sel[i]).val(old_sel[i]);
                    }
                    $(cf_obj[scope].pfx + ' div[name="' + name + '-html"] select[name="file_html"]').val(data.selected);
                }
                $(cf_obj[scope].pfx + ' div[name="' + name + '-new"] div[name="msg"]').html(data.ret_msg);
                $(cf_obj[scope].pfx + ' div[name="' + name + '-new"]').delay(3000).slideUp();
            }
        });
        return false;
    }

    function exposure_model_init(scope, fileNew_cb, fileNew_upload, manager)
    {
        $(cf_obj[scope].pfx + ' button[name="exposure-model-new"]').click(
            fileNew_cb);
        $(cf_obj[scope].pfx + ' div[name="exposure-model-new"]' +
          ' form[name="exposure-model"]').submit(fileNew_upload);

        // Exposure model: risk-only region constraint checkbox (init)
        $(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
          + ' input[name="region_constraint_choice"]').click(manager);

        $(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
          + ' input[name="asset_hazard_distance_choice"]').click(manager);

        // Exposure model: hazard content region-constr table handsontable (init)
        $(cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]').handsontable({
            colHeaders: ['Longitude', 'Latitude'],
            allowInsertColumn: false,
            allowRemoveColumn: false,
            rowHeaders: false,
            contextMenu: true,
            startRows: 3,
            startCols: 2,
            maxCols: 2,
            width: "300px",
            viewportRowRenderingOffset: 100,
            className: "htLeft",
            stretchH: "all"
        });
        cf_obj[scope].expModel_coords = $(
            cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]').handsontable(
                'getInstance');

        setTimeout(function() {
            return gem_tableHeightUpdate(
                $(cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]'));
        }, 0);

        cf_obj[scope].expModel_coords.addHook('afterCreateRow', function() {
            return gem_tableHeightUpdate(
                $(cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]'));
        });

        cf_obj[scope].expModel_coords.addHook('afterRemoveRow', function() {
            return gem_tableHeightUpdate(
                $(cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]'));
        });

        $(cf_obj[scope].pfx + ' div[name="exposure-model-risk"] button[name="new_row_add"]').click(function () {
            cf_obj[scope].expModel_coords.alter('insert_row');
        });
    }

    function vulnerability_model_init(scope, fileNew_cb, fileNew_upload, manager)
    {
        var pfx = cf_obj[scope].pfx + ' div[name="vulnerability-model"]';
        // Vulnerability model (init)
        $(pfx + ' input[type="checkbox"]').click(manager);

        // Vulnerability model: structural (init)
        $(pfx + ' button[name="vm-structural-new"]').click(fileNew_cb);
        $(pfx + ' div[name="vm-structural-new"]' +
          ' form[name="vm-structural"]').submit(fileNew_upload);

        // Vulnerability model: nonstructural (init)
        $(pfx + ' button[name="vm-nonstructural-new"]').click(fileNew_cb);
        $(pfx + ' div[name="vm-nonstructural-new"]' +
          ' form[name="vm-nonstructural"]').submit(fileNew_upload);

        // Vulnerability model: contents (init)
        $(pfx + ' button[name="vm-contents-new"]').click(fileNew_cb);
        $(pfx + ' div[name="vm-contents-new"]' +
          ' form[name="vm-contents"]').submit(fileNew_upload);

        // Vulnerability model: businter (init)
        $(pfx + ' button[name="vm-businter-new"]').click(fileNew_cb);
        $(pfx + ' div[name="vm-businter-new"]' +
          ' form[name="vm-businter"]').submit(fileNew_upload);

        // Vulnerability model: occupants (init)
        $(pfx + ' button[name="vm-occupants-new"]').click(fileNew_cb);
        $(pfx + ' div[name="vm-occupants-new"]' +
          ' form[name="vm-occupants"]').submit(fileNew_upload);

        $(pfx + ' input[type="checkbox"]').click(manager);
        $(pfx + ' input[name="insured_losses"]').prop('checked', false); // .triggerHandler('click');
        $(pfx + ' input[name="asset-correlation-choice"]').prop('checked', false); // .triggerHandler('click');
    }

    // Site conditions (init)
    function site_conditions_init(scope, fileNew_cb, fileNew_upload, manager)
    {
        /* hazard site conditions callbacks */
        $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"]').click(manager);
        $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"][value="uniform-param"]'
         ).prop('checked', true);  // .triggerHandler('click');

        $(cf_obj[scope].pfx + ' button[name="site-conditions-new"]').click(
            fileNew_cb);
        $(cf_obj[scope].pfx + ' div[name="site-conditions-new"]' +
          ' form[name="site-conditions"]').submit(fileNew_upload);
    }

    function generic_download_cb(scope, obj, e)
    {
        e.preventDefault();

        var ret = cf_obj[scope].getData();

        if (ret.ret != 0) {
            gem_ipt.error_msg(ret.str);

            return;
        }

        var data = new FormData();
        data.append('data', JSON.stringify(ret.obj));
        var url_suffix = { scen: "scenario", e_b: "event-based" };
        $.ajax({
            url: 'prepare/' + url_suffix[scope],
            type: 'POST',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.ret == 0) {
                    var $form = $(cf_obj[scope].pfx + ' form[name="downloadForm"]');
                    var hazard = null, risk = null, plus_hazard = '', plus_risk = '';
                    var dest_name = 'Unknown';
                    var $new_input;

                    $form.empty();
                    $form.append(csrf_token);
                    $form.attr({'action': 'download'});
                    $new_input = $('<input/>');
                    $new_input.attr('type', 'hidden').attr({'name': 'zipname', 'value': data.zipname });
                    $form.append($new_input);

                    $new_input = $('<input/>');
                    if (scope == 'scen') {
                        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="hazard"]').is(':checked')) {
                            hazard = 'hazard';
                        }
                        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
                            risk = $(cf_obj['scen'].pfx + ' input[type="radio"][name="risk-type"]:checked').val();
                        }

                        if (hazard == 'hazard') {
                            plus_hazard = "Hazard";
                        }
                        if (risk != null) {
                            plus_risk = gem_capitalize(risk);
                        }
                        dest_name = "Scenario" + plus_hazard + plus_risk;
                    }
                    else if (scope == 'e_b') {
                        dest_name = "EventBasedRisk";
                    }
                    $new_input.attr('type', 'hidden').attr({'name': 'dest_name', 'value': dest_name });
                    $form.append($new_input);

                    $form.submit();
                }
            }
        });
        return false;
    }

    function do_clean_all()
    {
        $.ajax({
            url: 'clean_all',
            type: 'POST',
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.ret == 0) {
                    var tabs = ['scen', 'e_b'];
                    for (var i = 0 ; i < tabs.length ; i++) {
                        tab = tabs[i];

                        var $all_selects = $(cf_obj[tab].pfx + ' select[name="file_html"]');

                        for (var e = 0 ; e < $all_selects.length ; e++) {
                            $sel = $($all_selects[e]);
                            if ($sel.is("[multiple]")) {
                                $sel.empty();
                            }
                            else {
                                $sel.empty();
                                $("<option />", {value: '', text: '---------'}).appendTo($sel);
                            }
                        }
                    }
                }
            }
        });
        return false;

    }

    function clean_all_cb(e)
    {
        $('<div></div>').appendTo('body')
            .html('<div><h6>Do you really want to delete all uploaded files and reset the page ?</h6></div>')
            .dialog({
                dialogClass: 'gem-jqueryui-dialog',
                modal: true,
                title: 'Clean all uploaded files',
                zIndex: 10000,
                autoOpen: true,
                width: '400px',
                resizable: false,
                buttons: {
                    Yes: function () {
                        do_clean_all();

                        $(this).dialog("close");
                    },
                    No: function () {
                        $(this).dialog("close");
                    }
                },
                close: function (event, ui) {
                    $(this).remove();
                }
            });
    }

    /*
     * - - - SCENARIO - - -
     */

    function scenario_manager() {
        var hazard = null; // null or hazard
        var risk = null;   // null, damage or loss
        var hazard_sites_choice = null; // null, region-grid, list-of-sites, exposure-model, site-cond-model

        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="hazard"]').is(':checked')) {
            hazard = 'hazard';
        }
        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            risk = $(cf_obj['scen'].pfx + ' input[type="radio"][name="risk-type"]:checked').val();
        }

        // Rupture information (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="rupture-information"]');
        if (hazard != null)
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // Hazard sites (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="hazard-sites"]');
        if (hazard != null) {
            hazard_sites_choice = $(cf_obj['scen'].pfx + ' input[type="radio"]'
                                    + '[name="hazard_sites"]:checked').val();
            $target.css('display', '');
        }
        else {
            $target.css('display', 'none');
        }

        // Region grid (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="region-grid"]');
        if (hazard != null && hazard_sites_choice == 'region-grid')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // List of sites (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="list-of-sites"]');
        if (hazard != null && hazard_sites_choice == 'list-of-sites')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // Exposure model (ui)
        exposure_model_sect_manager(
            'scen', ((hazard != null && hazard_sites_choice == 'exposure-model') || risk != null),
            (risk != null));

        // Fragility and vulnerability model (ui)
        if (risk == 'damage') {
            fragility_model_sect_manager('scen', true);
            vulnerability_model_sect_manager('scen', false);
        }
        else if(risk == 'losses') {
            vulnerability_model_sect_manager('scen', true);
            fragility_model_sect_manager('scen', false);
        }
        else {
            fragility_model_sect_manager('scen', false);
            vulnerability_model_sect_manager('scen', false);
        }

        // Site conditions model (force site conditions to file) (ui)
        site_conditions_sect_manager('scen', (hazard != null), (hazard_sites_choice == 'site-cond-model'));

        // Calculation parameters (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="calculation-parameters"]');
        if (hazard != null) {
            $target.css('display', '');

            if (risk == null) {
                // if risk disabled imts fields must be shown
                $(cf_obj['scen'].pfx + ' div[name="hazard-imt_specify-imt"]').css('display', '');
            }
            else {
                $(cf_obj['scen'].pfx + ' div[name="hazard-imt_specify-imt"]').css('display', 'none');
            }
            // GMPE sub choice
            var gmpe_choice = $(cf_obj['scen'].pfx + ' input[type="radio"]'
                                + '[name="hazard_gmpe"]:checked').val();

            $(cf_obj['scen'].pfx + ' div[name^="hazard-gmpe_"]').css('display', 'none');
            $(cf_obj['scen'].pfx + ' div[name="hazard-gmpe_' + gmpe_choice + '"]').css('display', '');
        }
        else
            $target.css('display', 'none');
    }
    /* - - - SCENARIO (INIT) - - - */

    // Rupture information (init)
    $(cf_obj['scen'].pfx + ' button[name="rupture-file-new"]').click(scenario_fileNew_cb);

    $(cf_obj['scen'].pfx + ' div[name="rupture-file-new"]' +
      ' form[name="rupture-file"]').submit(scenario_fileNew_upload);

    // Hazard site
    //   Hazard site Region Grid (init)
    $(cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]').handsontable({
        colHeaders: ['Longitude', 'Latitude'],
        allowInsertColumn: false,
        allowRemoveColumn: false,
        rowHeaders: false,
        contextMenu: true,
        startRows: 3,
        startCols: 2,
        maxCols: 2,
        width: "300px",
        viewportRowRenderingOffset: 100,
        className: "htLeft",
        stretchH: "all"
    });
    cf_obj['scen'].regGrid_coords = $(
        cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]').handsontable(
            'getInstance');

    setTimeout(function() {
        return gem_tableHeightUpdate(
            $(cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]'));
    }, 0);

    cf_obj['scen'].regGrid_coords.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate(
            $(cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]'));
    });

    cf_obj['scen'].regGrid_coords.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate(
            $(cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]'));
    });

    $(cf_obj['scen'].pfx + ' div[name="region-grid"] button[name="new_row_add"]').click(function () {
        cf_obj['scen'].regGrid_coords.alter('insert_row');
    });

    // List of sites (init)
    $(cf_obj['scen'].pfx + ' button[name="list-of-sites-new"]').click(scenario_fileNew_cb);

    $(cf_obj['scen'].pfx + ' div[name="list-of-sites-new"]' +
      ' form[name="list-of-sites"]').submit(scenario_fileNew_upload);

    // Exposure model (init)
    exposure_model_init('scen', scenario_fileNew_cb, scenario_fileNew_upload, scenario_manager);

    // Fragility model (init)
    $(cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]').click(
        scenario_manager);
    $(cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"]'
      + '[name="fm-loss-include-cons"]').click(scenario_manager);

    // Fragility model: structural (init)
    $(cf_obj['scen'].pfx + ' button[name="fm-structural-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-structural-new"]' +
      ' form[name="fm-structural"]').submit(scenario_fileNew_upload);

    $(cf_obj['scen'].pfx + ' button[name="fm-structural-cons-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-structural-cons-new"]' +
      ' form[name="fm-structural-cons"]').submit(scenario_fileNew_upload);

    // Fragility model: nonstructural (init)
    $(cf_obj['scen'].pfx + ' button[name="fm-nonstructural-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-nonstructural-new"]' +
      ' form[name="fm-nonstructural"]').submit(scenario_fileNew_upload);

    $(cf_obj['scen'].pfx + ' button[name="fm-nonstructural-cons-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-nonstructural-cons-new"]' +
      ' form[name="fm-nonstructural-cons"]').submit(scenario_fileNew_upload);

    // Fragility model: contents (init)
    $(cf_obj['scen'].pfx + ' button[name="fm-contents-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-contents-new"]' +
      ' form[name="fm-contents"]').submit(scenario_fileNew_upload);

    $(cf_obj['scen'].pfx + ' button[name="fm-contents-cons-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-contents-cons-new"]' +
      ' form[name="fm-contents-cons"]').submit(scenario_fileNew_upload);

    // Fragility model: businter (init)
    $(cf_obj['scen'].pfx + ' button[name="fm-businter-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-businter-new"]' +
      ' form[name="fm-businter"]').submit(scenario_fileNew_upload);

    $(cf_obj['scen'].pfx + ' button[name="fm-businter-cons-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="fm-businter-cons-new"]' +
      ' form[name="fm-businter-cons"]').submit(scenario_fileNew_upload);

    // Vulnerability model (init)
    vulnerability_model_init('scen', scenario_fileNew_cb, scenario_fileNew_upload,
                             scenario_manager);

    // Site conditions (init)
    site_conditions_init('scen', scenario_fileNew_cb, scenario_fileNew_upload,
                         scenario_manager);

    // Calculation parameters (init)

    // Calculation parameters: imt (init)
    $(cf_obj['scen'].pfx + ' button[name="gmpe-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="gmpe-new"]' +
      ' form[name="gmpe"]').submit(scenario_fileNew_upload);

    // Calculation parameters: gsim_logic_tree_file (init)
    $(cf_obj['scen'].pfx + ' button[name="gsim-logic-tree-file-new"]').click(
        scenario_fileNew_cb);
    $(cf_obj['scen'].pfx + ' div[name="gsim-logic-tree-file-new"]' +
      ' form[name="gsim-logic-tree-file"]').submit(scenario_fileNew_upload);

    // Calculation parameters: hazard gmpe callbacks (init)
    $(cf_obj['scen'].pfx + ' input[name="hazard_gmpe"]').click(scenario_manager);
    $(cf_obj['scen'].pfx + ' input[name="hazard_gmpe"][value="specify-gmpe"]'
     ).prop('checked', true);  // .triggerHandler('click');

    $(cf_obj['scen'].pfx + ' select[name="gmpe"]').searchableOptionList(
        {data: g_gmpe_options,
         showSelectionBelowList: true,
         maxHeight: '300px'});

    $(cf_obj['scen'].pfx + ' select[name="imt"]').searchableOptionList(
        {showSelectionBelowList: true,
         maxHeight: '300px'});

    /* hazard components callbacks (init) */
    $(cf_obj['scen'].pfx + ' input[name="hazard"]').click(scenario_manager);

    /* risk components callbacks (init) */
    function scenario_risk_onclick_cb(e) {
        $(cf_obj['scen'].pfx + ' span[name="risk-menu"]').css('display', $(e.target).is(':checked') ? '' : 'none');
        scenario_manager();
    }
    $(cf_obj['scen'].pfx + ' input[name="risk"]').click(scenario_risk_onclick_cb);
    scenario_risk_onclick_cb({ target: $(cf_obj['scen'].pfx + ' input[name="risk"]')[0] });

    /* risk type components callbacks (init) */
    $(cf_obj['scen'].pfx + ' input[type="radio"][name="risk-type"]').click(scenario_manager);
    $(cf_obj['scen'].pfx + ' input[name="risk-type"][value="damage"]').prop('checked', true);

    /* generic callback to show upload div (init) */
    function scenario_fileNew_cb(e) {
        $(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();
    }

    /* form widgets and previous remote list select element must follow precise
       naming schema with '<name>-html' and '<name>-new', see config_files.html */
    function scenario_fileNew_upload(event)
    {
        return generic_fileNew_upload('scen', this, event);
    }

    /* hazard sites callbacks */
    $(cf_obj['scen'].pfx + ' input[name="hazard_sites"]').click(
        scenario_manager);
    $(cf_obj['scen'].pfx + ' input[name="hazard_sites"][value="region-grid"]'
     ).prop('checked', true); // .triggerHandler('click');

    function scenario_getData()
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

            // exposure model
            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            asset_hazard_distance_choice: false,
            asset_hazard_distance: null,

            // rupture information
            rupture_model_file: null,
            rupture_mesh_spacing: null,

            // site conditions
            site_conditions_choice: null,

            site_model_file: null,

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

            insured_losses: false,
            asset_correlation_choice: false,
            asset_correlation: null,

            // calculation parameters
            gmpe_choice: null,
            intensity_measure_types: null,
            gsim_logic_tree_file: null,

            ground_motion_correlation_model: null,
            truncation_level: null,
            maximum_distance: null,
            number_of_ground_motion_fields: null
        };

        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="hazard"]').is(':checked'))
            obj.hazard = 'hazard';
        if ($(cf_obj['scen'].pfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            obj.risk = $(cf_obj['scen'].pfx + ' input[type="radio"][name="risk-type"]:checked').val();
        }

        obj.description = $(cf_obj['scen'].pfx + ' textarea[name="description"]').val();
        obj.description = obj.description.replace(
            new RegExp("\n", "g"), " ").replace(new RegExp("\r", "g"), " ").trim();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        // Rupture information (get)
        if (obj.hazard == 'hazard') {
            obj.rupture_model_file = $(cf_obj['scen'].pfx + ' div[name="rupture-file-html"] select[name="file_html"]').val();
            if (obj.rupture_model_file == '') {
                ret.str += "'Rupture file' field is empty.\n";
            }
            obj.rupture_mesh_spacing = $(cf_obj['scen'].pfx + ' input[name="rupture_mesh_spacing"]').val();
            if (!isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) <= 0.0) {
                ret.str += "'Rupture Mesh Spacing' field isn't greater than 0 float number (" + obj.rupture_mesh_spacing + ").\n";
            }
            uniqueness_add(files_list, 'rupture model file', obj.rupture_model_file);
            ret.str += uniqueness_check(files_list);
        }

        // Hazard sites (get)
        if (obj.hazard == 'hazard') {
            obj.hazard_sites_choice = $(cf_obj['scen'].pfx + ' input[type="radio"]'
                                        + '[name="hazard_sites"]:checked').val();

            if (obj.hazard_sites_choice == 'region-grid') {
                // Hazard sites -> Region-grid (get)
                obj.grid_spacing = $(cf_obj['scen'].pfx + ' input[name="grid_spacing"]').val();
                if (!isFloat(obj.grid_spacing) || parseFloat(obj.grid_spacing) <= 0.0) {
                    ret.str += "'Grid spacing' field isn't greater than 0 float number (" + obj.grid_spacing + ").\n";
                }

                obj.reggrid_coords_data = cf_obj['scen'].regGrid_coords.getData();
                // Check for invalid value (get)
                for (var i = 0; i < obj.reggrid_coords_data.length; i++) {
                    var lon = obj.reggrid_coords_data[i][0], lat = obj.reggrid_coords_data[i][1];
                    if (lon === null || lat === null || !isFloat(lon) || !isFloat(lat) ||
                        parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                        parseFloat(lat) < -90.0  || parseFloat(lat) > 90.0) {
                        ret.str += "Entry #" + (i+1) + " of region grid 'Coordinates'"
                            + " field is invalid (" + lon + ", " + lat + ").\n";
                    }
                }
            }
            else if (obj.hazard_sites_choice == 'list-of-sites') {
                // Hazard sites -> List-of-sites (get)
                obj.list_of_sites = $(cf_obj['scen'].pfx + ' div[name="list-of-sites-html"] select[name="file_html"]').val();
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
        exposure_model_getData(
            'scen', ret, files_list, obj,
            ((obj.hazard == 'hazard' && obj.hazard_sites_choice == 'exposure-model') || obj.risk != null),
            obj.risk);

        // Fragility and vulnerability model (get)
        if (obj.risk == 'damage') {
            // Fragility model (get)
            var show_cons = $(cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"]'
                              + '[name="fm-loss-include-cons"]').is(':checked');
            obj.fm_loss_show_cons_choice = show_cons;
            var losslist = ['structural', 'nonstructural', 'contents', 'businter' ];
            var descr = { structural: 'structural', nonstructural: 'nonstructural',
                          contents: 'contents', businter: 'business interruption' };

            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(cf_obj['scen'].pfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '"]');
                $target2 = $(cf_obj['scen'].pfx + ' div[name="fragility-model"] div[name="fm-loss-'
                            + losstype + '-cons"]');

                obj['fm_loss_' + losstype + '_choice'] = $(
                    cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]'
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
            vulnerability_model_getData('scen', ret, files_list, obj);
        }

        // Site conditions (get)
        if (obj.hazard == 'hazard') {
            site_conditions_getData('scen', ret, files_list, obj);
        }

        // Calculation parameters (get)
        if (obj.hazard == 'hazard') {
            obj.gmpe_choice = $(cf_obj['scen'].pfx + ' input[type="radio"]'
                                + '[name="hazard_gmpe"]:checked').val();

            if (obj.gmpe_choice == 'specify-gmpe') {
                obj.gsim = $(cf_obj['scen'].pfx + ' input[type="radio"][name="gmpe"]:checked').map(function(_, el) {
                    return $(el).val();
                }).get();

                if (obj.gsim.length < 1) {
                    ret.str += "Unique GMPE not selected.\n";
                }
            }
            else if (obj.gmpe_choice == 'from-file') {
                // calculation parameters -> from file (get)
                obj.gsim_logic_tree_file = $(cf_obj['scen'].pfx + ' div[name="hazard-gmpe_from-file"]'
                                          + ' div[name="gsim-logic-tree-file-html"] select[name="file_html"]').val();
                if (obj.gsim_logic_tree_file == '') {
                    ret.str += "'GMPE logic tree file' field is empty.\n";
                }
                uniqueness_add(files_list, 'GMPE logic tree', obj.gsim_logic_tree_file);
                ret.str += uniqueness_check(files_list);
            }
            else {
                ret.str += "Unknown 'GMPE' choice (" + obj.gmpe_choice + ").\n";
            }

            if (obj.risk == null) {
                // if risk disabled imts fields must be shown
                // calculation parameters -> specify-imt (get)
                obj.intensity_measure_types = $(
                    cf_obj['scen'].pfx + ' div[name="hazard-imt_specify-imt"]'
                        + ' input[type="checkbox"][name="imt"]:checked').map(function(_, el) {
                            return $(el).val();
                        }).get();

                obj.custom_imt = $(cf_obj['scen'].pfx + ' input[name="custom_imt"]').val();

                if (obj.intensity_measure_types.length < 1 && obj.custom_imt == "") {
                    ret.str += "IMT's not selected.\n";
                }
            }

            obj.ground_motion_correlation_model = $(
                cf_obj['scen'].pfx + ' select[name="ground-motion-correlation"]').val();

            if (["", "JB2009"].indexOf(obj.ground_motion_correlation_model) == -1) {
                ret.str += "'Ground Motion Correlation' field unknown.\n";
            }

            obj.truncation_level = $(cf_obj['scen'].pfx + ' input[name="truncation_level"]').val();
            if (!isFloat(obj.truncation_level) || parseFloat(obj.truncation_level) < 0.0) {
                ret.str += "'Level of truncation' field isn't positive float number (" + obj.truncation_level + ").\n";
            }

            obj.maximum_distance = $(cf_obj['scen'].pfx + ' input[name="maximum_distance"]').val();
            if (!isFloat(obj.maximum_distance) || parseFloat(obj.maximum_distance) < 0.0) {
                ret.str += "'Maximum source-to-site distance' field isn't positive float number (" + obj.maximum_distance + ").\n";
            }

            obj.number_of_ground_motion_fields = $(cf_obj['scen'].pfx + ' input[name="number_of_ground_motion_fields"]').val();
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
    cf_obj['scen'].getData = scenario_getData;

    $(cf_obj['scen'].pfx + ' button[name="clean_all"]').click(clean_all_cb);

    function scenario_download_cb(e)
    {
        return generic_download_cb('scen', this, e);
    }
    $(cf_obj['scen'].pfx + ' button[name="download"]').click(scenario_download_cb);

    scenario_manager();

    /*
     * - - - EVENT BASED - - -
     */

    function event_based_fileNew_upload(event)
    {
        return generic_fileNew_upload('e_b', this, event);
    }

    function event_based_manager()
    {
        exposure_model_sect_manager('e_b', true, true);
        vulnerability_model_sect_manager('e_b', true);

        // Hazard model (UI)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-model"]';

            $target = $(pfx + ' div[name="rupture-mesh-spacing"]');
            if ($(pfx + ' input[type="checkbox"][name="rupture_mesh_spacing_choice"]').is(':checked'))
                $target.css('display', '');
            else
                $target.css('display', 'none');

            $target = $(pfx + ' div[name="area-source-discretization"]');
            if ($(pfx + ' input[type="checkbox"][name="area_source_discretization_choice"]').is(':checked'))
                $target.css('display', '');
            else
                $target.css('display', 'none');
        }

        // Site conditions (UI)
        site_conditions_sect_manager('e_b', true, false);

        // Hazard calculation (UI)
        // nothing

        // Risk calculation (UI)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';
            var pfx_vuln = cf_obj['e_b'].pfx + ' div[name="vulnerability-model"]';

            var $target = $(pfx + ' div[name="loss-curve-resolution"]');
            if ($(pfx + ' input[type="checkbox"][name="loss_curve_resolution_choice"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }

            var $target = $(pfx + ' div[name="loss-ratios"]');
            if ($(pfx + ' input[type="checkbox"][name="loss_ratios_choice"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }

            var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
            for (var lossidx in losslist) {
                var losstype = losslist[lossidx];

                $target = $(pfx + ' div[name="loss-ratios-' + losstype + '"]');
                if($(pfx_vuln + ' input[type="checkbox"][name="losstype"][value="' + losstype + '"]').is(':checked')) {
                    $target.css('display', '');
                }
                else {
                    $target.css('display', 'none');
                }
            }
        }
        // Hazard outputs (UI)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]';

            $target = $(pfx + ' div[name="hazard-related"]');
            if ($(pfx + ' input[type="checkbox"][name="hazard_curves_from_gmfs"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }

            $target = $(pfx + ' div[name="quantile-hazard-curves"]');
            if ($(pfx + ' input[type="checkbox"][name="quantile_hazard_curves_choice"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }

            $target = $(pfx + ' div[name="poes"]');
            if ($(pfx + ' input[type="checkbox"][name="hazard_maps"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }
        }

        // Risk outputs (UI)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="risk-outputs"]';
            var $target = $(pfx + ' div[name="quantile-loss-curves"]');
            if ($(pfx + ' input[type="checkbox"][name="quantile_loss_curves_choice"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }

            var $target = $(pfx + ' div[name="conditional-loss-poes"]');
            if ($(pfx + ' input[type="checkbox"][name="conditional_loss_poes_choice"]').is(':checked')) {
                $target.css('display', '');
            }
            else {
                $target.css('display', 'none');
            }
        }

    } // function event_based_manager

    /* generic callback to show upload div */
    function event_based_fileNew_cb(e) {
        $(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();
    }

    // Exposure model (init)
    exposure_model_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                        event_based_manager);

    // Vulnerability model (init)
    vulnerability_model_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                             event_based_manager);

    // Hazard model (init)
    {
        pfx = cf_obj['e_b'].pfx + ' div[name="hazard-model"]';

        // Hazard model: source_model_logic_tree_file (init)
        $(pfx + ' button[name="source-model-logic-tree-file-new"]').click(
            event_based_fileNew_cb);
        $(pfx + ' div[name="source-model-logic-tree-file-new"]' +
          ' form[name="source-model-logic-tree-file"]').submit(event_based_fileNew_upload);

        // Hazard model: source_tree_file (init)
        $(pfx + ' button[name="source-model-file-new"]').click(
            event_based_fileNew_cb);
        $(pfx + ' div[name="source-model-file-new"]' +
          ' form[name="source-model-file"]').submit(event_based_fileNew_upload);

        // Hazard model: gsim_logic_tree_file (init)
        $(pfx + ' button[name="gsim-logic-tree-file-new"]').click(
            event_based_fileNew_cb);
        $(pfx + ' div[name="gsim-logic-tree-file-new"]' +
          ' form[name="gsim-logic-tree-file"]').submit(event_based_fileNew_upload);

        $(pfx + ' input[type="checkbox"][name="rupture_mesh_spacing_choice"]').click(
            event_based_manager);
        $(pfx + ' input[type="checkbox"][name="area_source_discretization_choice"]').click(
            event_based_manager);
    }

    // Site conditions (init)
    site_conditions_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                         event_based_manager);

    // Hazard calculation (init)
    // no init

    // Risk calculation (init)
    {
        var pfx = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';

        $(pfx + ' input[type="checkbox"][name="loss_curve_resolution_choice"]').click(event_based_manager);
        $(pfx + ' input[type="checkbox"][name="loss_ratios_choice"]').click(event_based_manager);
    }

    // Hazard outputs (init)
    {
        var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]';

        $(pfx + ' input[type="checkbox"][name="hazard_curves_from_gmfs"]').click(event_based_manager);
        $(pfx + ' input[type="checkbox"][name="quantile_hazard_curves_choice"]').click(event_based_manager);
        $(pfx + ' input[type="checkbox"][name="hazard_maps"]').click(event_based_manager);
    }

    // Risk outputs (init)
    {
        var pfx = cf_obj['e_b'].pfx + ' div[name="risk-outputs"]';
        $(pfx + ' input[type="checkbox"][name="quantile_loss_curves_choice"]').click(event_based_manager);
        $(pfx + ' input[type="checkbox"][name="conditional_loss_poes_choice"]').click(event_based_manager);
    }

    $(cf_obj['e_b'].pfx + ' button[name="clean_all"]').click(clean_all_cb);
    function event_based_download_cb(e)
    {
        return generic_download_cb('e_b', this, e);
    }
    $(cf_obj['e_b'].pfx + ' button[name="download"]').on('click', event_based_download_cb);

    function event_based_getData()
    {

        var files_list = [];

        var ret = {
            ret: -1,
            str: '',
            obj: null
        };
        var obj = {
            description: null,

            // exposure model
            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            asset_hazard_distance_choice: false,
            asset_hazard_distance: null,

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

            insured_losses: false,
            asset_correlation_choice: false,
            asset_correlation: null,

            // hazard model
            source_model_logic_tree_file: null,
            source_model_file: null,
            gsim_logic_tree_file: null,
            width_of_mfd_bin: 0.1,

            rupture_mesh_spacing_choice: false,
            rupture_mesh_spacing: null,

            area_source_discretization_choice: false,
            area_source_discretization: null,

            // site conditions
            site_conditions_choice: null,

            site_model_file: null,

            reference_vs30_value: null,
            reference_vs30_type: null,
            reference_depth_to_2pt5km_per_sec: null,
            reference_depth_to_1pt0km_per_sec: null,

            // hazard calculations
            truncation_level: null,
            maximum_distance: null,
            investigation_time: null,
            ses_per_logic_tree_path: null,
            number_of_logic_tree_samples: null,

            // risk calculations
            risk_investigation_time: null,
            loss_curve_resolution_choice: false,
            loss_curve_resolution: null,
            loss_ratios_choice: false,
            loss_ratios_structural: null,
            loss_ratios_nonstructural: null,
            loss_ratios_contents: null,
            loss_ratios_businter: null,
            loss_ratios_occupants: null,

            // hazard outputs
            ground_motion_fields: null,
            hazard_curves_from_gmfs: null,
            mean_hazard_curves: null,
            quantile_hazard_curves_choice: false,
            quantile_hazard_curves: null,
            hazard_maps: null,
            poes: null,
            uniform_hazard_spectra: null,

            // risk outputs
            avg_losses: false,
            asset_loss_table: false,

            quantile_loss_curves_choice: false,
            quantile_loss_curves: null,

            conditional_loss_poes_choice: false,
            conditional_loss_poes: null
        };

        obj.description = $(cf_obj['e_b'].pfx + ' textarea[name="description"]').val();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        // Exposure model (get)
        exposure_model_getData('e_b', ret, files_list, obj, true, true);

        // Vulnerability model (get)
        vulnerability_model_getData('e_b', ret, files_list, obj);

        // Hazard model (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-model"]';

            obj.source_model_logic_tree_file = $(
                pfx + ' div[name="source-model-logic-tree-file-html"] select[name="file_html"]').val();
            if (obj.source_model_logic_tree_file == '') {
                ret.str += "'Source model logic tree file' field is empty.\n";
            }
            uniqueness_add(files_list, 'source model logic tree', obj.source_model_logic_tree_file);
            ret.str += uniqueness_check(files_list);

            // Source model files
            obj.source_model_file = $(pfx + ' div[name="source-model-file-html"] select').val();
            if (obj.source_model_file == null || obj.source_model_file.length < 1) {
                ret.str += "'Source model files' field: at least one file must be selected.\n";
            }
            if (obj.source_model_file != null) {
                for (f_id in obj.source_model_file) {
                    fname = obj.source_model_file[f_id];
                    uniqueness_add(files_list, 'source model: item #' + (parseInt(f_id) + 1), fname);
                ret.str += uniqueness_check(files_list);
                }
            }

            obj.gsim_logic_tree_file = $(
                pfx + ' div[name="gsim-logic-tree-file-html"] select[name="file_html"]').val();
            if (obj.gsim_logic_tree_file == '') {
                ret.str += "'GMPE logic tree file' field is empty.\n";
            }
            uniqueness_add(files_list, 'gmpe logic tree', obj.gsim_logic_tree_file);
            ret.str += uniqueness_check(files_list);

            obj.width_of_mfd_bin = $(
                pfx + ' input[type="text"][name="width_of_mfd_bin"]').val();
            if (!isFloat(obj.width_of_mfd_bin) || parseFloat(obj.width_of_mfd_bin) < 0.0) {
                ret.str += "'Bin width of the magnitude frequency distribution' field isn't a not negative float number (" + obj.width_of_mfd_bin + ").\n";
            }

            obj.rupture_mesh_spacing_choice = $(
                pfx + ' input[type="checkbox"][name="rupture_mesh_spacing_choice"]').is(':checked');
            if (obj.rupture_mesh_spacing_choice) {
                obj.rupture_mesh_spacing = $(pfx + ' input[type="text"][name="rupture_mesh_spacing"]').val();
                if (!isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) < 0.0) {
                    ret.str += "'Rupture mesh spacing' field isn't a not negative float number (" + obj.rupture_mesh_spacing + ").\n";
                }
            }

            obj.area_source_discretization_choice = $(
                pfx + ' input[type="checkbox"][name="area_source_discretization_choice"]').is(':checked');
            if (obj.area_source_discretization_choice) {
                obj.area_source_discretization = $(pfx + ' input[type="text"][name="area_source_discretization"]').val();
                if (!isFloat(obj.area_source_discretization) || parseFloat(obj.area_source_discretization) < 0.0) {
                    ret.str += "'Area source discretization' field isn't a not negative float number (" + obj.area_source_discretization + ").\n";
                }
            }
        }

        // Site conditions (get)
        site_conditions_getData('e_b', ret, files_list, obj);

        // Hazard calculations (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-calculation"]';

            obj.truncation_level = $(pfx + ' input[type="text"][name="truncation_level"]').val();
            if (!isFloat(obj.truncation_level) || parseFloat(obj.truncation_level) < 0.0) {
                ret.str += "'Level of truncation' field is negative float number ("
                    + obj.width_of_mfd_bin + ").\n";
            }

            obj.maximum_distance = $(pfx + ' input[type="text"][name="maximum_distance"]').val();
            if (!isFloat(obj.maximum_distance) || parseFloat(obj.maximum_distance) < 0.0) {
                ret.str += "'Maximum source-to-site distance' field is negative float number ("
                    + obj.maximum_distance + ").\n";
            }

            obj.investigation_time = $(pfx + ' input[type="text"][name="investigation_time"]').val();
            if (!isInt(obj.investigation_time) || parseInt(obj.investigation_time) <= 0.0) {
                ret.str += "'Hazard investigation time' field isn't positive number ("
                    + obj.investigation_time + ").\n";
            }

            obj.ses_per_logic_tree_path = $(pfx + ' input[type="text"][name="ses_per_logic_tree_path"]').val();
            if (!isInt(obj.ses_per_logic_tree_path) || parseInt(obj.ses_per_logic_tree_path) <= 0.0) {
                ret.str += "'Stochastic event sets per logic tree path' field isn't positive number ("
                    + obj.ses_per_logic_tree_path + ").\n";
            }

            obj.number_of_logic_tree_samples = $(pfx + ' input[type="text"][name="number_of_logic_tree_samples"]').val();
            if (!isInt(obj.number_of_logic_tree_samples) || parseInt(obj.number_of_logic_tree_samples) < 0.0) {
                ret.str += "'Number of logic tree samples' field is negative number ("
                    + obj.number_of_logic_tree_samples + ").\n";
            }

            obj.ground_motion_correlation_model = $(pfx + ' select[name="ground_motion_correlation_model"]').val();
            if (obj.ground_motion_correlation_model != '' && obj.ground_motion_correlation_model != 'JB2009') {
                ret.str += "Unknown 'Ground Motion Correlation' field (" + obj.ground_motion_correlation_model + ").\n";
            }
        }

        // Risk calculations (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';
            var pfx_vuln = cf_obj['e_b'].pfx + ' div[name="vulnerability-model"]';

            obj.risk_investigation_time = $(pfx + ' input[type="text"][name="risk_investigation_time"]').val();
            if (!isInt(obj.risk_investigation_time) || parseInt(obj.risk_investigation_time) <= 0.0) {
                ret.str += "'Risk investigation time' field isn't positive number ("
                    + obj.risk_investigation_time + ").\n";
            }

            obj.loss_curve_resolution_choice = $(
                cf_obj['e_b'].pfx + ' input[type="checkbox"][name="loss_curve_resolution_choice"]').is(':checked');
            if (obj.loss_curve_resolution_choice) {
                obj.loss_curve_resolution = $(pfx + ' input[type="text"][name="loss_curve_resolution"]').val();
                if (!isInt(obj.loss_curve_resolution) || parseInt(obj.loss_curve_resolution) <= 0.0) {
                    ret.str += "'Loss curve resolution' field isn't positive number ("
                        + obj.risk_investigation_time + ").\n";
                }
            }

            obj.loss_ratios_choice = $(
                cf_obj['e_b'].pfx + ' input[type="checkbox"][name="loss_ratios_choice"]').is(':checked');
            if (obj.loss_ratios_choice) {
                var descr = { structural: 'structural', nonstructural: 'nonstructural',
                              contents: 'contents', businter: 'business interruption',
                              occupants: 'occupants' };
                var losslist = ['structural', 'nonstructural', 'contents', 'businter', 'occupants' ];
                for (var lossidx in losslist) {
                    var losstype = losslist[lossidx];

                    if(obj['vm_loss_' + losstype + '_choice']) {
                        obj['loss_ratios_' + losstype] = $(pfx + ' input[type="text"][name="loss_ratios_' + losstype + '"]').val();
                        var arr = obj['loss_ratios_' + losstype].split(',');
                        for (var k in arr) {
                            var cur = arr[k].trim(' ');
                            if (!isFloat(cur) || cur < 0.0) {
                                ret.str += "'" + descr[losstype] + " vulnerability model' field element #" + (parseInt(k)+1)
                                    + " is negative number (" + cur + ").\n";
                            }
                        }
                    }
                }
            }
        }

        // Hazard outputs (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]';

            obj.ground_motion_fields = $(pfx + ' input[type="checkbox"][name="ground_motion_fields"]'
                                        ).is(':checked');

            obj.hazard_curves_from_gmfs = $(pfx + ' input[type="checkbox"][name="hazard_curves_from_gmfs"]'
                                        ).is(':checked');

            if (obj.hazard_curves_from_gmfs) {
                obj.mean_hazard_curves = $(pfx + ' input[type="checkbox"][name="mean_hazard_curves"]'
                                          ).is(':checked');
                obj.quantile_hazard_curves_choice = $(
                    pfx + ' input[type="checkbox"][name="quantile_hazard_curves_choice"]').is(':checked');
                if (obj.quantile_hazard_curves_choice) {
                    obj.quantile_hazard_curves = $(pfx + ' input[type="text"][name="quantile_hazard_curves"]'
                                                  ).val();

                    var arr = obj.quantile_hazard_curves.split(',');
                    for (var k in arr) {
                        var cur = arr[k].trim(' ');
                        if (!isFloat(cur) || cur <= 0.0) {
                            ret.str += "'Quantile hazard curves' field element #" + (parseInt(k)+1)
                                + " isn't positive number (" + cur + ").\n";
                        }
                    }
                }
            }

            obj.hazard_maps = $(pfx + ' input[type="checkbox"][name="hazard_maps"]').is(':checked');

            if (obj.hazard_maps) {
                obj.poes = $(pfx + ' input[type="text"][name="poes"]').val();

                var arr = obj.poes.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Probability of exceedances' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
                    }
                }
            }

            obj.uniform_hazard_spectra = $(pfx + ' input[type="checkbox"][name="uniform_hazard_spectra"]'
                                          ).is(':checked');
        }

        // Risk outputs (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="risk-outputs"]';
            var pfx_riscal = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';

            obj.avg_losses = $(pfx + ' input[type="checkbox"][name="avg_losses"]').is(':checked');
            obj.asset_loss_table = $(pfx + ' input[type="checkbox"][name="asset_loss_table"]').is(':checked');

            obj.quantile_loss_curves_choice = $(
                pfx + ' input[type="checkbox"][name="quantile_loss_curves_choice"]').is(':checked');
            if (obj.quantile_loss_curves_choice) {
                obj.quantile_loss_curves = $(pfx + ' input[type="text"][name="quantile_loss_curves"]'
                                            ).val();

                var arr = obj.quantile_loss_curves.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Quantile loss curves' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
                    }
                }
            }

            obj.conditional_loss_poes_choice = $(
                pfx + ' input[type="checkbox"][name="conditional_loss_poes_choice"]').is(':checked');

            if ((!obj.loss_ratios_choice) && obj.conditional_loss_poes_choice) {
                ret.str += "To include 'Loss maps' you must enable 'Loss ratios' in 'Risk calculation' section.\n";           }
            if (obj.loss_ratios_choice) {
                if (obj.conditional_loss_poes_choice) {
                    obj.conditional_loss_poes = $(pfx + ' input[type="text"][name="conditional_loss_poes"]').val();

                    var arr = obj.conditional_loss_poes.split(',');
                    for (var k in arr) {
                        var cur = arr[k].trim(' ');
                        if (!isFloat(cur) || cur <= 0.0) {
                            ret.str += "'Loss maps' field element #" + (parseInt(k)+1)
                                + " isn't positive number (" + cur + ").\n";
                        }
                    }
                }
            }
        }

        if (ret.str == '') {
            ret.ret = 0;
            ret.obj = obj;
        }
        return ret;
    }
    cf_obj['e_b'].getData = event_based_getData;

    event_based_manager();

    $("span.ipt_help").tooltip(
        {template: '<div class="tooltip" style="opacity: 1.0;">'
         + '<div class="tooltip-arrow" style="'
         + ' background-color: #f7f7f9; color: black; font-size: 12px;'
         + ' font-family: Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: normal; '
         + ' border-radius: 8px; border: 1px solid #e0e0e0;"></div>'
         + '<div class="tooltip-inner" style="background-color: #f7f7f9; color: black; font-size: 12px;'
         + ' font-family: Helvetica Neue, Helvetica, Arial, sans-serif; font-weight: normal;'
         + ' border-radius: 8px; border: 1px solid #e0e0e0; max-width: 300px; width: 300px; margin: 0px;">'
         + '</div></div>', placement: 'bottom'});
});

