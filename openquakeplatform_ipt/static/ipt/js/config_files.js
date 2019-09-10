/*
   Copyright (c) 2015-2019, GEM Foundation.

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
    },
    vol: {
        pfx: '.cf_gid div[name="volcano"]',
        phenomena: ['ashfall', 'lavaflow', 'lahar', 'pyroclasticflow'],
        phenomena_name: ['ash fall', 'lava flow', 'lahar', 'pyroclastic density currents'],
        getData: null
        /*  expModel_coords: null */
    }
};

$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    function exposure_model_sect_manager(scope, enabled, with_constraints, without_inc_asset)
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

                $subsubt = $(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="asset-hazard-distance"]');
                $subsubt.attr('data-gem-enabled', (without_inc_asset ? 'false' : 'true'));
                $subsubt.css('display', (without_inc_asset ? 'none' : ''));
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
    // scope == 'scen' or 'e_b' or 'vol'
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
                        if (lon === null || lat === null || !gem_ipt.isFloat(lon) || !gem_ipt.isFloat(lat) ||
                            parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                            parseFloat(lat) < -90.0  || parseFloat(lat) > 90.0) {
                            ret.str += "Entry #" + (i+1) + " of exposure model 'Region constraint'"
                                + " field is invalid (" + lon + ", " + lat + ").\n";
                        }
                    }
                }

                obj.asset_hazard_distance_enabled = $(
                    cf_obj[scope].pfx + ' div[name="exposure-model"]'
                        + ' div[name="asset-hazard-distance"]').attr('data-gem-enabled') == 'true';
                if (obj.asset_hazard_distance_enabled) {
                    obj.asset_hazard_distance = $(
                        cf_obj[scope].pfx + ' div[name="exposure-model"]'
                            + ' input[type="text"][name="asset_hazard_distance"]').val();
                    if (obj.asset_hazard_distance == '') {
                        ret.str += "'Asset hazard distance' field is empty.\n";
                    }
                    else if (!gem_ipt.isFloat(obj.asset_hazard_distance)
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
            if (!gem_ipt.isFloat(obj.reference_vs30_value) || parseFloat(obj.reference_vs30_value) < 0.0) {
                ret.str += "'Reference vs30 value' field isn't positive float number (" + obj.reference_vs30_value + ").\n";
            }
            obj.reference_vs30_type = $(cf_obj[scope].pfx + ' input[type="radio"]'
                                        + '[name="hazard_sitecond_type"]:checked').val();
            if (obj.reference_vs30_type != 'inferred' && obj.reference_vs30_type != 'measured') {
                ret.str += "Reference vs30 type choice (" + obj.reference_vs30_type + ") unknown";
            }

            obj.reference_depth_to_2pt5km_per_sec = $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                      + ' input[type="text"][name="reference_depth_to_2pt5km_per_sec"]').val();
            if (!gem_ipt.isFloat(obj.reference_depth_to_2pt5km_per_sec) || parseFloat(obj.reference_depth_to_2pt5km_per_sec) < 0.0) {
                ret.str += "'Minimum depth at which vs30 >= 2.5' field isn't positive float number (" + obj.reference_depth_to_2pt5km_per_sec + ").\n";
            }
            obj.reference_depth_to_1pt0km_per_sec = $(cf_obj[scope].pfx + ' div[name="hazard-sitecond_uniform-param"]'
                                                      + ' input[type="text"][name="reference_depth_to_1pt0km_per_sec"]').val();
            if (!gem_ipt.isFloat(obj.reference_depth_to_1pt0km_per_sec) || parseFloat(obj.reference_depth_to_1pt0km_per_sec) < 0.0) {
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

    function generic_fileNew_collect(scope, reply, event)
    {
        // called if reply.success == true only

        event.preventDefault();
        var name = $(event.target.parentElement).attr("name").slice(0,-5)
        var $sibling = $(event.target).siblings("select[name='file_html']");
        var subdir = $sibling.attr('data-gem-subdir');
        var collected_reply = reply;

        function ls_subdir_cb(uuid, app_msg) {
            if (! app_msg.complete)
                return;
            var cmd_msg = app_msg.result;

            if (cmd_msg.success == true) {
                var options = [];
                var old_sel = [];
                for (var i = 0 ; i < cmd_msg.content.length ; i++) {
                    var v = cmd_msg.content[i];
                    options.push([subdir + '/' + v, v]);
                }

                if ($(cf_obj[scope].pfx + ' div[name="' + name + '-html"]')[0].hasAttribute('data-gem-group')) {
                    gem_group = $(cf_obj[scope].pfx + ' div[name="' + name + '-html"]').attr('data-gem-group');
                    // find elements of groups around all the config_file tab
                    $sel = $('.cf_gid div[data-gem-group="' + gem_group + '"] select[name="file_html"]');
                    for (var i = 0 ; i < $sel.length ; i++) {
                        old_sel[i] = $($sel[i]).val();
                    }
                }
                else {
                    $sel = $(cf_obj[scope].pfx + ' div[name="' + name + '-html"] select[name="file_html"]');
                    old_sel[0] = $sel.val();
                }

                $sel.empty();
                for (var i = 0 ; i < old_sel.length ; i++) {
                    if (! $($sel[i]).is("[multiple]")) {
                        $("<option />", {value: '', text: '---------'}).appendTo($($sel[i]));
                    }
                }
                for (var i = 0 ; i < options.length ; i++) {
                    $("<option />", {value: options[i][0], text: options[i][1]}).appendTo($sel);
                }

                // set old options of all select of the same group except current select
                for (var i = 0 ; i < old_sel.length ; i++) {
                    if ($($sel[i]).attr('name') == name) {
                        continue;
                    }
                    $($sel[i]).val(old_sel[i]);
                }

                var set_opt = [];
                for (var i = 0 ; i < collected_reply.content.length ; i++) {
                    var v = collected_reply.content[i];
                    set_opt.push([subdir + '/' + v]);
                }

                $(cf_obj[scope].pfx + ' div[name="' + name + '-html"] select[name="file_html"]').val(
                    set_opt);

                collected_reply.reason = collected_reply.content.length > 1 ? 'Files ' : 'File ';
                for (var i = 0 ; i < collected_reply.content.length ; i++) {
                    collected_reply.reason += (i > 0 ? ', ' : '');
                    collected_reply.reason += "'" + collected_reply.content[i] + "'";
                }
                collected_reply.reason += ' added correctly.';
            }
            $(cf_obj[scope].pfx + ' div[name="' + name + '-new"] div[name="msg"]').html(collected_reply.reason);
            $(cf_obj[scope].pfx + ' div[name="' + name + '-new"]').delay(3000).slideUp();
        }
        gem_api.ls(ls_subdir_cb, subdir);
    }

    function exposure_model_init(scope, fileNew_cb, fileNew_upload, manager)
    {
        file_uploader_init(scope, 'exposure-model', fileNew_cb, fileNew_upload);

        // Exposure model: risk-only region constraint checkbox (init)
        $(cf_obj[scope].pfx + ' div[name="exposure-model"] div[name="exposure-model-risk"]'
          + ' input[name="region_constraint_choice"]').click(manager);

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
            cf_obj[scope].pfx + ' div[name="exposure-model-risk"] div[name="region-constr"]'
        ).handsontable('getInstance');

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
        var $target = $(cf_obj[scope].pfx + ' div[name="vulnerability-model"]');
        // Vulnerability model (init)
        $target.find('input[type="checkbox"]').click(manager);

        // Vulnerability model: structural (init)
        file_uploader_init($target, 'vm-structural', fileNew_cb, fileNew_upload);

        // Vulnerability model: nonstructural (init)
        file_uploader_init($target, 'vm-nonstructural', fileNew_cb, fileNew_upload);

        // Vulnerability model: contents (init)
        file_uploader_init($target, 'vm-contents', fileNew_cb, fileNew_upload);

        // Vulnerability model: businter (init)
        file_uploader_init($target, 'vm-businter', fileNew_cb, fileNew_upload);

        // Vulnerability model: occupants (init)
        file_uploader_init($target, 'vm-occupants', fileNew_cb, fileNew_upload);

        $target.find('input[type="checkbox"]').click(manager);
        $target.find('input[name="insured_losses"]').prop('checked', false); // .triggerHandler('click');
        $target.find('input[name="asset-correlation-choice"]').prop('checked', false); // .triggerHandler('click');
    }

    // Site conditions (init)
    function site_conditions_init(scope, fileNew_cb, fileNew_upload, manager)
    {
        /* hazard site conditions callbacks */
        $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"]').click(manager);
        $(cf_obj[scope].pfx + ' input[name="hazard_sitecond"][value="uniform-param"]'
         ).prop('checked', true);  // .triggerHandler('click');

        file_uploader_init(scope, 'site-conditions', fileNew_cb, fileNew_upload);
    }

    cf_obj.generate_dest_name = function(scope)
    {
        var dest_name = 'Unknown';
        var hazard = null, risk = null, plus_hazard = '', plus_risk = '';

        if (scope == 'scen') {
            base_name = 'Scenario';
        }
        else if (scope == 'e_b') {
            base_name = 'EventBased';
        }
        else if (scope == 'vol') {
            base_name = 'Volcano';
        }
        else {
            base_name = 'Unknown';
        }

        if ($(cf_obj[scope].pfx + ' input[type="checkbox"]' +
              '[name="hazard"]').is(':checked')) {
            hazard = 'hazard';
        }
        if ($(cf_obj[scope].pfx + ' input[type="checkbox"]' +
              '[name="risk"]').is(':checked')) {
            if (scope == 'scen') {
                risk = $(cf_obj[scope].pfx + ' input[type="radio"]' +
                         '[name="risk-type"]:checked').val();
            }
            else {
                risk = "risk";
            }
        }

        if (hazard == 'hazard') {
            plus_hazard = "Hazard";
        }
        if (risk != null) {
            plus_risk = gem_capitalize(risk);
        }

        dest_name = base_name + plus_hazard + plus_risk;

        return dest_name;
    };

    function generic_prepare_download_normal_postcb(data, scope)
    {
        var $form = $(cf_obj[scope].pfx + ' form[name="downloadForm"]');
        var dest_name;
        var $new_input;
        $form.empty();
        $form.append(csrf_token);
        $form.attr({'action': 'download'});
        $form.attr({'accept': 'application/zip'});
        $new_input = $('<input/>');
        $new_input.attr('type', 'hidden').attr({'name': 'zipname', 'value': data.zipname });
        $form.append($new_input);

        $new_input = $('<input/>');
        dest_name = cf_obj.generate_dest_name(scope);
        $new_input.attr('type', 'hidden').attr({'name': 'dest_name', 'value': dest_name });
        $form.append($new_input);

        $form.submit();
    }

    function generic_prepare_download_gemapi_postcb(reply, scope)
    {
        var dest_name = cf_obj.generate_dest_name(scope);

        function build_zip_cb(uuid, msg)
        {
            if (! msg.complete) {
                return;
            }

            var res = msg.result;
            if (res.success == false) {
                gem_ipt.error_msg(res.reason);
                return;
            }

            function save_as_cb(uuid, msg)
            {

                if (msg.complete) {
                    gem_api.delete_file(dumb_cb, res.content);
                }
            }
            gem_api.save_as(save_as_cb, res.content, dest_name + '.zip');
        }

        gem_api.build_zip(build_zip_cb, reply.content, reply.zipname);
    }

    function runcalc_obj()
    {
    }

    runcalc_obj.prototype = {
        runcalc_cb: function(file_name, success, reason) {
            gem_api.run_oq_engine_calc([file_name]);
        }
    };

    window.runcalc_gacb = function(object_id, file_name, success, reason)
    {
        var obj = gem_api_ctx_get_object(object_id);
        var ret = obj.runcalc_cb(file_name, success, reason);

        gem_api_ctx_del(object_id);

        return ret;
    }

    function generic_prepare_runcalc_normal_postcb(data, scope)
    {
        var dest_name;
        var $new_input;

        var csrf_name = $(csrf_token).attr('name');
        var csrf_value = $(csrf_token).attr('value');

        if (typeof gem_api == 'undefined')
            return false;

        var cookie_csrf = {'name': csrf_name, 'value': csrf_value};
        var cookies = [cookie_csrf];
        var dd_headers = [ipt_cookie_builder(cookies)];

        dest_name = cf_obj.generate_dest_name(scope);

        var dd_data = [{'name': 'csrfmiddlewaretoken', 'value': csrf_value},
                       {'name': 'zipname', 'value': data.zipname },
                       {'name': 'dest_name', 'value': dest_name }
                      ];

        cb_obj = new runcalc_obj();
        var cb_obj_id = gem_api_ctx_get_object_id(cb_obj);
        gem_api.delegate_download('download', 'POST', dd_headers, dd_data,
                                  'runcalc_gacb', cb_obj_id);
    }

    function generic_prepare_runcalc_gemapi_postcb(reply, scope)
    {
        function build_zip_cb(uuid, msg) {
            if (! msg.complete) {
                return;
            }

            var cmd_msg = msg.result;
            if (cmd_msg.success == false) {
                gem_ipt.error_msg(cmd_msg.reason);
                return;
            }
            var zip_filename = cmd_msg.content;

            function runcalc_cb(uuid, msg) {
                if (! msg.complete) {
                    return;
                }

                var cmd_msg = msg.result;
                if (! cmd_msg.success) {
                    gem_ipt.info_msg(cmd_msg.reason);
                }
                else {
                    gem_ipt.info_msg('Calculation started.');
                }

                gem_api.delete_file(dumb_cb, zip_filename);

                return;
            }
            gem_api.run_oq_engine_calc(runcalc_cb, cmd_msg.content);
        }

        gem_api.build_zip(build_zip_cb, reply.content, reply.zipname);
    }

    /*
       a zip file with all is needed to run a calculation is currently in 2 phases:
       - prepare the zip file on the server
       -
         . download it (using generic_prepare_download_postcb function)
         OR
         . delegate gem integrated environment to do it and run a calculation
           (using generic_prepare_download_postcb function)
     */
    function generic_prepare_cb(scope, obj, on_success, e)
    {
        e.preventDefault();

        var ret = cf_obj[scope].getData();

        if (ret.ret != 0) {
            gem_ipt.error_msg(ret.str);

            return;
        }

        var data = new FormData();
        data.append('data', JSON.stringify(ret.obj));
        var url_suffix = { scen: "scenario", e_b: "event-based", vol: "volcano" };
        $.ajax({
            url: 'prepare/' + url_suffix[scope],
            type: 'POST',
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.ret == 0) {
                    return on_success(data, scope);
                }
                else {
                    gem_ipt.error_msg(data.msg);
                }
            }
        });
        return false;
    }

    function grc_obj(scope)
    {
        this.scope = scope;
    }

    grc_obj.prototype = {
        generic_run_calculation_gacb: function(file_name, success, reason)
        {
            if (success != 0) {
                gem_ipt.error_msg(reason);
                return;
            }

            // run second part of the command
            ret = gem_api.run_oq_engine_calc([file_name]);
            if (ret.ret != 0) {
                gem_ipt.error_msg(reason);
                return;
            }
        }
    };

    function generic_run_calculation_gacb(object_id, file_name, success, reason)
    {
        var obj = gem_api_ctx_get_object(object_id);

        var ret = obj.generic_run_calculation_gacb(file_name, success, reason);
        gem_api_ctx_del(object_id);

        return ret;
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
                    var tabs = ['scen', 'e_b', 'vol'];
                    for (var i = 0 ; i < tabs.length ; i++) {
                        tab = tabs[i];

                        var $all_selects = $(cf_obj[tab].pfx + ' select[name="file_html"]'
                                            ).add(ex_obj.pfx + ' select[name="file_html"]');

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
        var hazard = null; // null or 'hazard'
        var risk = null;   // null, 'damage' or 'loss'
        var hazard_sites_choice = null; // null, region-grid, list-of-sites, exposure-model
        var region_grid_choice = null; // null, region-coordinates, infer-from-exposure
        var $target, $subtarget;
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

            /* region grid callbacks */
            region_grid_choice = $(cf_obj['scen'].pfx + ' input[name="region_grid"]:checked').val();

            $subtarget = $(cf_obj['scen'].pfx + ' div[name="region-coordinates-table"]');
            $subtarget.css('display', (region_grid_choice == 'infer-from-exposure' ? 'none' : ''));

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

        // GMF file upload (ui)
        $target = $(cf_obj['scen'].pfx + ' div[name="gmf-file"]');
        if (hazard == null && risk != null) {
            $target.css('display', '');

            $subtarget = $(cf_obj['scen'].pfx + ' div[name="gmf-file"] div[name="gmf-file-html"]');

            if ($(cf_obj['scen'].pfx + ' div[name="gmf-file"] input[name="use_gmf_file"]').is(':checked'))
                $subtarget.css('display', '');
            else
                $subtarget.css('display', 'none');
        }
        else {
            $target.css('display', 'none');
        }

        // Exposure model (ui) - (scenario)
        // exposure_model_sect_manager(scope, enabled, with_constraints, without_inc_asset)
        exposure_model_sect_manager(
            'scen', ((hazard != null && (
                hazard_sites_choice == 'exposure-model'
                    || (hazard_sites_choice == 'region-grid' && region_grid_choice == 'infer-from-exposure')
            )) || risk != null),
            (risk != null),
            (hazard_sites_choice == 'exposure-model' ||
             (hazard_sites_choice == 'region-grid' && region_grid_choice == 'infer-from-exposure'))
        );

        // Fragility and vulnerability model (ui)
        if (risk == 'damage') {
            fragility_model_sect_manager('scen', true);
            vulnerability_model_sect_manager('scen', false);
        }
        else if(risk == 'losses') {
            fragility_model_sect_manager('scen', false);
            vulnerability_model_sect_manager('scen', true);
        }
        else {
            fragility_model_sect_manager('scen', false);
            vulnerability_model_sect_manager('scen', false);
        }

        // Site conditions model (force site conditions to file) (ui)
        // WAS site_conditions_sect_manager('scen', (hazard != null), (hazard_sites_choice == 'site-cond-model'));
        site_conditions_sect_manager('scen', (hazard != null), false);
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
            $(cf_obj['scen'].pfx + ' div[name="hazard-gmpe_specify-gmpe"]').css('display', '');
        }
        else
            $target.css('display', 'none');
    }
    /* - - - SCENARIO (INIT) - - - */

    // Rupture information (init)
    file_uploader_init('scen', 'rupture-file', scenario_fileNew_cb, scenario_fileNew_upload);

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
        cf_obj['scen'].pfx + ' div[name="region-grid"] div[name="table"]'
    ).handsontable('getInstance');

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
    file_uploader_init('scen', 'list-of-sites', scenario_fileNew_cb, scenario_fileNew_upload);


    // GMF file upload (init)
    $(cf_obj['scen'].pfx + ' div[name="gmf-file"] input[name="use_gmf_file"]').click(scenario_manager);

    file_uploader_init('scen', 'gmf-file', scenario_fileNew_cb, scenario_fileNew_upload);

    // Exposure model (init)
    exposure_model_init('scen', scenario_fileNew_cb, scenario_fileNew_upload, scenario_manager);

    // Fragility model (init)
    $(cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"][name="losstype"]').click(
        scenario_manager);
    $(cf_obj['scen'].pfx + ' div[name="fragility-model"] input[type="checkbox"]'
      + '[name="fm-loss-include-cons"]').click(scenario_manager);

    // Fragility model: structural (init)
    file_uploader_init('scen', 'fm-structural', scenario_fileNew_cb, scenario_fileNew_upload);
    file_uploader_init('scen', 'fm-structural-cons', scenario_fileNew_cb, scenario_fileNew_upload);

    // Fragility model: nonstructural (init)
    file_uploader_init('scen', 'fm-nonstructural', scenario_fileNew_cb, scenario_fileNew_upload);
    file_uploader_init('scen', 'fm-nonstructural-cons', scenario_fileNew_cb, scenario_fileNew_upload);

    // Fragility model: contents (init)
    file_uploader_init('scen', 'fm-contents', scenario_fileNew_cb, scenario_fileNew_upload);
    file_uploader_init('scen', 'fm-contents-cons', scenario_fileNew_cb, scenario_fileNew_upload);

    // Fragility model: businter (init)
    file_uploader_init('scen', 'fm-businter', scenario_fileNew_cb, scenario_fileNew_upload);
    file_uploader_init('scen', 'fm-businter-cons', scenario_fileNew_cb, scenario_fileNew_upload);

    // Vulnerability model (init)
    vulnerability_model_init('scen', scenario_fileNew_cb, scenario_fileNew_upload,
                             scenario_manager);

    // Site conditions (init)
    site_conditions_init('scen', scenario_fileNew_cb, scenario_fileNew_upload,
                         scenario_manager);

    // Calculation parameters (init)

    // Calculation parameters: imt (init)
    file_uploader_init('scen', 'gmpe', scenario_fileNew_cb, scenario_fileNew_upload);

    // Calculation parameters: gsim_logic_tree_file (init)
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

    /* form widgets and previous remote list select element must follow precise
       naming schema with '<name>-html' and '<name>-new', see config_files.html */
    function scenario_fileNew_upload(event)
    {
        form = $(event.target).parent('form').get(0);
        return generic_fileNew_upload('scen', form, event);
    }

    function scenario_fileNew_collect(event, reply)
    {
        return generic_fileNew_collect('scen', reply, event);
    }

    function scenario_fileNew_cb(e) {
        if (typeof gem_api == 'undefined') {
            /* generic callback to show upload div (init) */
            $(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();
            if ($(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"]').css('display') != 'none') {
                if (typeof window.gem_not_interactive == 'undefined') {
                    $(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"] input[type="file"]').click();
                    var name = e.target.name;

                    function uploader_rollback() {
                        if ($(cf_obj['scen'].pfx + ' div[name="' + name +
                              '"] input[type="file"]').val().length > 0) {
                            $(document.body).off('focusin', uploader_rollback);
                            return;
                        }

                        var $msg = $(cf_obj['scen'].pfx + ' div[name="' + name + '"] div[name="msg"]');
                        $msg.html("Upload file cancelled.");
                        $(cf_obj['scen'].pfx + ' div[name="' + name + '"]').delay(3000).slideUp({
                            done: function () {
                                $(cf_obj['scen'].pfx + ' div[name="' + name + '"] div[name="msg"]').html('');
                            }
                        });
                        $(document.body).off('focusin', uploader_rollback);
                    }
                    $(document.body).on('focusin', uploader_rollback);


                }
            }
        }
        else { // if (typeof gem_api == 'undefined') {
            var event = e;
            var $msg = $(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"] div[name="msg"]');
            $(cf_obj['scen'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();

            var $sibling = $(e.target).siblings("select[name='file_html']");
            var subdir = $sibling.attr('data-gem-subdir');
            var sel_grp = $sibling.attr('data-gem-group');
            var is_multiple = $sibling.is("[multiple]");

            function cb(uuid, app_msg) {
                if (! app_msg.complete)
                    return;

                var cmd_msg = app_msg.result;
                if (cmd_msg.success) {
                    $msg.html("File '" + cmd_msg.content[0] + "' collected correctly.");
                    scenario_fileNew_collect(event, cmd_msg);
                }
                else {
                    $msg.html(cmd_msg.reason);
                }
                $(cf_obj['scen'].pfx + ' div[name="' + event.target.name + '"]').delay(3000).slideUp();
            }
            gem_api.select_and_copy_file(cb, subdir, is_multiple);
        }
    }

    /* hazard sites callbacks */
    $(cf_obj['scen'].pfx + ' input[name="hazard_sites"]').click(
        scenario_manager);
    $(cf_obj['scen'].pfx + ' input[name="hazard_sites"][value="region-grid"]'
     ).prop('checked', true); // .triggerHandler('click');

    /* region grid opts callbacks */
    $(cf_obj['scen'].pfx + ' input[name="region_grid"]').click(
        scenario_manager);
    $(cf_obj['scen'].pfx + ' input[name="region_grid"][value="region-coordinates"]'
     ).prop('checked', true).triggerHandler('click');

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

            region_grid: null,

            // hazard sites
            grid_spacing: null,
            reggrid_coords_data: null,
            list_of_sites: null,

            // ground motion field
            gmf_file: null,

            // exposure model
            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            asset_hazard_distance_enabled: false,
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
            if (!gem_ipt.isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) <= 0.0) {
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
                if (!gem_ipt.isFloat(obj.grid_spacing) || parseFloat(obj.grid_spacing) <= 0.0) {
                    ret.str += "'Grid spacing' field isn't greater than 0 float number (" + obj.grid_spacing + ").\n";
                }

                obj.region_grid_choice = $(cf_obj['scen'].pfx + ' input[type="radio"]'
                                           + '[name="region_grid"]:checked').val();
                if (obj.region_grid_choice == "region-coordinates") {
                    obj.reggrid_coords_data = cf_obj['scen'].regGrid_coords.getData();
                    // Check for invalid value (get)
                    for (var i = 0; i < obj.reggrid_coords_data.length; i++) {
                        var lon = obj.reggrid_coords_data[i][0], lat = obj.reggrid_coords_data[i][1];
                        if (lon === null || lat === null || !gem_ipt.isFloat(lon) || !gem_ipt.isFloat(lat) ||
                            parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                            parseFloat(lat) < -90.0  || parseFloat(lat) > 90.0) {
                            ret.str += "Entry #" + (i+1) + " of region grid 'Coordinates'"
                                + " field is invalid (" + lon + ", " + lat + ").\n";
                        }
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
            else {
                ret.str += "Unknown 'Hazard sites' choice (' + obj.hazard_sites_choice + ').\n";
            }
        }

        // Ground Motion Field file
        if (obj.hazard == null && obj.risk != null &&
            $(cf_obj['scen'].pfx + ' div[name="gmf-file"] input[name="use_gmf_file"]').is(':checked')) {
            obj.gmf_file = $(cf_obj['scen'].pfx + ' div[name="gmf-file"] div[name="gmf-file-html"] select[name="file_html"]').val();
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
            obj.gsim =  $(cf_obj['scen'].pfx + ' div[name="hazard-gmpe_specify-gmpe"]'
                        + ' input[type="checkbox"][name="gmpe"]:checked').map(function(_, el) {
                            return $(el).val();
                        }).get();
            if (obj.gsim.length < 1) {
                ret.str += "At least one GMPE must be selected.\n";
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
            if (!gem_ipt.isFloat(obj.truncation_level) || parseFloat(obj.truncation_level) < 0.0) {
                ret.str += "'Level of truncation' field isn't positive float number (" + obj.truncation_level + ").\n";
            }

            obj.maximum_distance = $(cf_obj['scen'].pfx + ' input[name="maximum_distance"]').val();
            if (!gem_ipt.isFloat(obj.maximum_distance) || parseFloat(obj.maximum_distance) < 0.0) {
                ret.str += "'Maximum source-to-site distance' field isn't positive float number (" + obj.maximum_distance + ").\n";
            }

            obj.number_of_ground_motion_fields = $(cf_obj['scen'].pfx + ' input[name="number_of_ground_motion_fields"]').val();
            if (!gem_ipt.isInt(obj.number_of_ground_motion_fields) || parseInt(obj.number_of_ground_motion_fields) <= 0) {
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
        var generic_prepare_download_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_download_normal_postcb : generic_prepare_download_gemapi_postcb;

        return generic_prepare_cb('scen', this, generic_prepare_download_postcb, e);
    }
    $(cf_obj['scen'].pfx + ' button[name="download"]').click(scenario_download_cb);

    function scenario_runcalc_cb(e)
    {
        var generic_prepare_runcalc_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_runcalc_normal_postcb : generic_prepare_runcalc_gemapi_postcb;

        return generic_prepare_cb('scen', this, generic_prepare_runcalc_postcb, e);
    }
    $(cf_obj['scen'].pfx + ' button[name="run-calc-btn"]').click(scenario_runcalc_cb);

    scenario_manager();
    $(cf_obj['scen'].pfx + ' input[name="hazard"]').prop('checked', true).triggerHandler('click');

    /*
     * - - - EVENT BASED - - -
     */

    function event_based_fileNew_upload(event)
    {
        form = $(event.target).parent('form').get(0);
        return generic_fileNew_upload('e_b', form, event);
    }

    function event_based_fileNew_collect(event, reply)
    {
        return generic_fileNew_collect('e_b', reply, event);
    }

    function event_based_manager()
    {
        var hazard = null; // null or 'hazard'
        var risk = null;   // null or 'risk'
        var hazard_sites_choice = null; // null, region-grid, list-of-sites, exposure-model
        var region_grid_choice = null; // null, region-coordinates, infer-from-exposure
        var $target, $subtarget, $subtarget2;
        var use_imt_from_vulnerability = false;
        if ($(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="hazard"]').is(':checked')) {
            hazard = 'hazard';
        }
        if ($(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            risk = 'risk';
        }

        // Hazard sites (ui)
        $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-sites"]');
        if (hazard != null) {
            hazard_sites_choice = $(cf_obj['e_b'].pfx + ' input[type="radio"]'
                                    + '[name="hazard_sites"]:checked').val();

            /* region grid callbacks */
            region_grid_choice = $(cf_obj['e_b'].pfx + ' input[name="region_grid"]:checked').val();

            $subtarget = $(cf_obj['e_b'].pfx + ' div[name="region-coordinates-table"]');
            $subtarget.css('display', (region_grid_choice == 'infer-from-exposure' ? 'none' : ''));

            $target.css('display', '');
        }
        else {
            $target.css('display', 'none');
        }

        // Region grid (ui)
        $target = $(cf_obj['e_b'].pfx + ' div[name="region-grid"]');
        if (hazard != null && hazard_sites_choice == 'region-grid')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // List of sites (ui)
        $target = $(cf_obj['e_b'].pfx + ' div[name="list-of-sites"]');
        if (hazard != null && hazard_sites_choice == 'list-of-sites')
            $target.css('display', '');
        else
            $target.css('display', 'none');

        // Exposure model (ui) - (event_based)
        // exposure_model_sect_manager(scope, enabled, with_constraints, without_inc_asset)
        exposure_model_sect_manager(
            'e_b', ((hazard != null && (
                hazard_sites_choice == 'exposure-model'
                    || (hazard_sites_choice == 'region-grid' && region_grid_choice == 'infer-from-exposure')
            )) || risk != null),
            (risk != null),
            (hazard_sites_choice == 'exposure-model' ||
             (hazard_sites_choice == 'region-grid' && region_grid_choice == 'infer-from-exposure'))
        );

        // Hazard model (UI)
        $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-model"]');
        if (hazard != null) {
            $target.css('display', '');
            $subtarget = $target.find('div[name="rupture-mesh-spacing"]');
            if ($target.find('input[type="checkbox"][name="rupture_mesh_spacing_choice"]').is(':checked'))
                $subtarget.css('display', '');
            else
                $subtarget.css('display', 'none');

            $subtarget = $target.find('div[name="area-source-discretization"]');
            if ($target.find('input[type="checkbox"][name="area_source_discretization_choice"]').is(':checked'))
                $subtarget.css('display', '');
            else
                $subtarget.css('display', 'none');

            $subtarget = $target.find('div[name="complex-fault-mesh"]');
            if ($target.find('input[type="checkbox"][name="complex_fault_mesh_choice"]').is(':checked'))
                $subtarget.css('display', '');
            else
                $subtarget.css('display', 'none');
        }
        else {
            $target.css('display', 'none');
        }
        // Site conditions (UI)
        // WAS site_conditions_sect_manager('e_b', (hazard != null), (hazard_sites_choice == 'site-cond-model'));
        site_conditions_sect_manager('e_b', (hazard != null), false);

        // Hazard calculation (UI)
        $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-calculation"]');
        if (hazard != null) {
            $target.css('display', '');

            $subtarget = $target.find('div[name="hazard-imt_specify-imt"]');
            $subtarget2 = $target.find('div[name="use-imt-from-vulnerability"]');

            if (risk == null) {
                // if risk disabled imts fields and use-imt-from-vuln must be shown
                $subtarget.css('display', '');
                $subtarget2.css('display', '');
                use_imt_from_vulnerability = $target.find('input[name="use_imt_from_vulnerability"]'
                                                         ).is(':checked');
            }
            else {
                $subtarget.css('display', 'none');
                $subtarget2.css('display', 'none');
            }
        }
        else {
            $target.css('display', 'none');
        }

        vulnerability_model_sect_manager('e_b', (hazard != null && use_imt_from_vulnerability == true) ||
                                         risk != null);

        // Risk calculation (UI)
        $target = $(cf_obj['e_b'].pfx + ' div[name="risk-calculation"]');
        if (risk != null) {
            $target.css('display', '');
        }
        else {
            $target.css('display', 'none');
        }

        // Hazard outputs (UI)
        $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]');
        if (hazard != null) {
            $target.css('display', '');

            $subtarget = $target.find('div[name="hazard-related"]');
            if ($target.find('input[type="checkbox"][name="hazard_curves_from_gmfs"]').is(':checked')) {
                $subtarget.css('display', '');
            }
            else {
                $subtarget.css('display', 'none');
            }

            $subtarget = $target.find('div[name="quantile-hazard-curves"]');
            if ($target.find('input[type="checkbox"][name="quantile_hazard_curves_choice"]').is(':checked')) {
                $subtarget.css('display', '');
            }
            else {
                $subtarget.css('display', 'none');
            }

            $subtarget = $target.find('div[name="poes"]');
            if ($target.find('input[type="checkbox"][name="hazard_maps"]').is(':checked')) {
                $subtarget.css('display', '');
            }
            else {
                $subtarget.css('display', 'none');
            }
        }
        else {
            $target.css('display', 'none');
        }

        // Risk outputs (UI)
        $target = $(cf_obj['e_b'].pfx + ' div[name="risk-outputs"]');
        if (risk != null) {
            $target.css('display', '');
            var $subtarget = $target.find('div[name="quantile-loss-curves"]');
            if ($target.find('input[type="checkbox"][name="quantile_loss_curves_choice"]').is(':checked')) {
                $subtarget.css('display', '');
            }
            else {
                $subtarget.css('display', 'none');
            }

            var $subtarget = $target.find('div[name="conditional-loss-poes"]');
            if ($target.find('input[type="checkbox"][name="conditional_loss_poes_choice"]').is(':checked')) {
                $subtarget.css('display', '');
            }
            else {
                $subtarget.css('display', 'none');
            }
        }
        else {
            $target.css('display', 'none');
        }

    } // function event_based_manager

    /* generic callback to show upload div */
    function event_based_fileNew_cb(e) {
        if (typeof gem_api == 'undefined') {
            /* generic callback to show upload div (init) */
            $(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();
            if ($(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"]').css('display') != 'none') {
                if (typeof window.gem_not_interactive == 'undefined') {
                    $(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"] input[type="file"]').click();

                    var name = e.target.name;

                    function uploader_rollback() {
                        if ($(cf_obj['e_b'].pfx + ' div[name="' + name +
                              '"] input[type="file"]').val().length > 0) {
                            $(document.body).off('focusin', uploader_rollback);
                            return;
                        }

                        var $msg = $(cf_obj['e_b'].pfx + ' div[name="' + name + '"] div[name="msg"]');
                        $msg.html("Upload file cancelled.");
                        $(cf_obj['e_b'].pfx + ' div[name="' + name + '"]').delay(3000).slideUp({
                            done: function () {
                                $(cf_obj['e_b'].pfx + ' div[name="' + name + '"] div[name="msg"]').html('');
                            }
                        });
                        $(document.body).off('focusin', uploader_rollback);
                    }
                    $(document.body).on('focusin', uploader_rollback);
                }
            }
        }
        else { // if (gem_api == null
            var event = e;
            var $msg = $(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"] div[name="msg"]');
            $(cf_obj['e_b'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();

            var $sibling = $(e.target).siblings("select[name='file_html']");
            var subdir = $sibling.attr('data-gem-subdir');
            var sel_grp = $sibling.attr('data-gem-group');
            var is_multiple = $sibling.is("[multiple]");

            function cb(uuid, app_msg) {
                if (! app_msg.complete)
                    return;

                var cmd_msg = app_msg.result;
                if (cmd_msg.success) {
                    $msg.html("File '" + cmd_msg.content[0] + "' collected correctly.");
                    event_based_fileNew_collect(event, cmd_msg);
                }
                else {
                    $msg.html(cmd_msg.reason);
                }
                $(cf_obj['e_b'].pfx + ' div[name="' + event.target.name + '"]').delay(3000).slideUp();
            }
            gem_api.select_and_copy_file(cb, subdir, is_multiple);
        }
    }

    /* - - - EVENT BASED (INIT) - - - */

    // Hazard site
    //   Hazard site Region Grid (init)
    $(cf_obj['e_b'].pfx + ' div[name="region-grid"] div[name="table"]').handsontable({
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
    cf_obj['e_b'].regGrid_coords = $(
        cf_obj['e_b'].pfx + ' div[name="region-grid"] div[name="table"]'
    ).handsontable('getInstance');

    setTimeout(function() {
        return gem_tableHeightUpdate(
            $(cf_obj['e_b'].pfx + ' div[name="region-grid"] div[name="table"]'));
    }, 0);

    cf_obj['e_b'].regGrid_coords.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate(
            $(cf_obj['e_b'].pfx + ' div[name="region-grid"] div[name="table"]'));
    });

    cf_obj['e_b'].regGrid_coords.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate(
            $(cf_obj['e_b'].pfx + ' div[name="region-grid"] div[name="table"]'));
    });

    $(cf_obj['e_b'].pfx + ' div[name="region-grid"] button[name="new_row_add"]').click(function () {
        cf_obj['e_b'].regGrid_coords.alter('insert_row');
    });


    // List of sites (init)
    $(cf_obj['e_b'].pfx + ' button[name="list-of-sites-new"]').click(event_based_fileNew_cb);

    // Exposure model (init)
    exposure_model_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                        event_based_manager);

    // Vulnerability model (init)
    vulnerability_model_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                             event_based_manager);

    // Hazard model (init)
    {
        var $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-model"]');

        // Hazard model: source_model_logic_tree_file (init)
        file_uploader_init($target, 'source-model-logic-tree-file',
                           event_based_fileNew_cb, event_based_fileNew_upload)

        // Hazard model: source_tree_file (init)
        file_uploader_init($target, 'source-model-file',
                           event_based_fileNew_cb, event_based_fileNew_upload)

        // Hazard model: gsim_logic_tree_file (init)
        file_uploader_init($target, 'gsim-logic-tree-file',
                           event_based_fileNew_cb, event_based_fileNew_upload)

        $target.find('input[type="checkbox"][name="rupture_mesh_spacing_choice"]').click(
            event_based_manager);
        $target.find('input[type="checkbox"][name="area_source_discretization_choice"]').click(
            event_based_manager);
        $target.find('input[type="checkbox"][name="complex_fault_mesh_choice"]').click(
            event_based_manager);
    }

    // Site conditions (init)
    site_conditions_init('e_b', event_based_fileNew_cb, event_based_fileNew_upload,
                         event_based_manager);

    // Hazard calculation (init)
    $(cf_obj['e_b'].pfx + ' select[name="imt"]').searchableOptionList(
        {showSelectionBelowList: true,
         maxHeight: '300px'});

    $(cf_obj['e_b'].pfx + ' div[name="hazard-calculation"] input[name="use_imt_from_vulnerability"]').click(
        event_based_manager);

    // Risk calculation (init)
    // no init

    // Hazard outputs (init)
    {
        var $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]');

        $target.find('input[type="checkbox"][name="hazard_curves_from_gmfs"]').click(event_based_manager);
        $target.find('input[type="checkbox"][name="quantile_hazard_curves_choice"]').click(event_based_manager);
        $target.find('input[type="checkbox"][name="hazard_maps"]').click(event_based_manager);
    }

    // Risk outputs (init)
    {
        var $target = $(cf_obj['e_b'].pfx + ' div[name="risk-outputs"]');
        $target.find('input[type="checkbox"][name="quantile_loss_curves_choice"]').click(event_based_manager);
        $target.find('input[type="checkbox"][name="conditional_loss_poes_choice"]').click(event_based_manager);
    }

    $(cf_obj['e_b'].pfx + ' button[name="clean_all"]').click(clean_all_cb);
    function event_based_download_cb(e)
    {
        var generic_prepare_download_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_download_normal_postcb : generic_prepare_download_gemapi_postcb;

        return generic_prepare_cb('e_b', this, generic_prepare_download_postcb, e);
    }
    $(cf_obj['e_b'].pfx + ' button[name="download"]').on('click', event_based_download_cb);

    function event_based_runcalc_cb(e)
    {
        var generic_prepare_runcalc_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_runcalc_normal_postcb : generic_prepare_runcalc_gemapi_postcb;

        return generic_prepare_cb('e_b', this, generic_prepare_runcalc_postcb, e);
    }
    $(cf_obj['e_b'].pfx + ' button[name="run-calc-btn"]').click(event_based_runcalc_cb);

    /* hazard sites callbacks */
    $(cf_obj['e_b'].pfx + ' input[name="hazard_sites"]').click(
        event_based_manager);
    $(cf_obj['e_b'].pfx + ' input[name="hazard_sites"][value="region-grid"]'
     ).prop('checked', true); // .triggerHandler('click');

    /* region grid opts callbacks */
    $(cf_obj['e_b'].pfx + ' input[name="region_grid"]').click(
        event_based_manager);
    $(cf_obj['e_b'].pfx + ' input[name="region_grid"][value="region-coordinates"]'
     ).prop('checked', true).triggerHandler('click');

    function event_based_getData()
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

            // hazard sites
            hazard_sites_choice: null,

            grid_spacing: null,
            region_grid_choice: null,
            reggrid_coords_data: null,

            list_of_sites: null,

            // site conditions
            site_conditions_choice: null,

            site_model_file: null,

            reference_vs30_value: null,
            reference_vs30_type: null,
            reference_depth_to_2pt5km_per_sec: null,
            reference_depth_to_1pt0km_per_sec: null,

            // hazard model
            source_model_logic_tree_file: null,
            source_model_file: null,
            gsim_logic_tree_file: null,
            width_of_mfd_bin: 0.1,

            rupture_mesh_spacing_choice: false,
            rupture_mesh_spacing: null,

            area_source_discretization_choice: false,
            area_source_discretization: null,

            complex_fault_mesh_choice: false,
            complex_fault_mesh: null,

            // Hazard calculation
            intensity_measure_types: null,
            custom_imt: null,
            use_imt_from_vulnerability: false,

            ground_motion_correlation_model: null,
            maximum_distance: null,
            truncation_level: null,
            investigation_time: null,
            ses_per_logic_tree_path: null,
            number_of_logic_tree_samples: null,

            // exposure model
            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            asset_hazard_distance_enabled: false,
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

            // hazard outputs
            save_ruptures: false,
            ground_motion_fields: null,
            hazard_curves_from_gmfs: null,
            quantile_hazard_curves_choice: false,
            quantile_hazard_curves: null,
            hazard_maps: null,
            poes: null,
            uniform_hazard_spectra: null,

            // risk calculations
            risk_investigation_time: null,
            ret_periods_for_aggr: null,

            // risk outputs
            quantile_loss_curves_choice: false,
            quantile_loss_curves: null,

            conditional_loss_poes_choice: false,
            conditional_loss_poes: null
        };

        if ($(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="hazard"]').is(':checked'))
            obj.hazard = 'hazard';
        if ($(cf_obj['e_b'].pfx + ' input[type="checkbox"][name="risk"]').is(':checked')) {
            obj.risk = "risk";
        }

        obj.description = $(cf_obj['e_b'].pfx + ' textarea[name="description"]').val();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }
        obj.description = obj.description.replace(
            new RegExp("\n", "g"), " ").replace(new RegExp("\r", "g"), " ").trim();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        // Hazard sites (get)
        if (obj.hazard == 'hazard') {
            obj.hazard_sites_choice = $(cf_obj['e_b'].pfx + ' input[type="radio"]'
                                        + '[name="hazard_sites"]:checked').val();

            if (obj.hazard_sites_choice == 'region-grid') {
                // Hazard sites -> Region-grid (get)
                obj.grid_spacing = $(cf_obj['e_b'].pfx + ' input[name="grid_spacing"]').val();
                if (!gem_ipt.isFloat(obj.grid_spacing) || parseFloat(obj.grid_spacing) <= 0.0) {
                    ret.str += "'Grid spacing' field isn't greater than 0 float number (" + obj.grid_spacing + ").\n";
                }

                obj.region_grid_choice = $(cf_obj['e_b'].pfx + ' input[type="radio"]'
                                           + '[name="region_grid"]:checked').val();
                if (obj.region_grid_choice == "region-coordinates") {
                    obj.reggrid_coords_data = cf_obj['e_b'].regGrid_coords.getData();
                    // Check for invalid value (get)
                    for (var i = 0; i < obj.reggrid_coords_data.length; i++) {
                        var lon = obj.reggrid_coords_data[i][0], lat = obj.reggrid_coords_data[i][1];
                        if (lon === null || lat === null || !gem_ipt.isFloat(lon) || !gem_ipt.isFloat(lat) ||
                            parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                            parseFloat(lat) < -90.0  || parseFloat(lat) > 90.0) {
                            ret.str += "Entry #" + (i+1) + " of region grid 'Coordinates'"
                                + " field is invalid (" + lon + ", " + lat + ").\n";
                        }
                    }
                }
            }
            else if (obj.hazard_sites_choice == 'list-of-sites') {
                // Hazard sites -> List-of-sites (get)
                obj.list_of_sites = $(cf_obj['e_b'].pfx + ' div[name="list-of-sites-html"] select[name="file_html"]').val();
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
            else {
                ret.str += "Unknown 'Hazard sites' choice (' + obj.hazard_sites_choice + ').\n";
            }
        }

        // Site conditions (get)
        if (obj.hazard == 'hazard') {
            site_conditions_getData('e_b', ret, files_list, obj);
        }

        // Hazard model (get)
        if (obj.hazard == 'hazard') {
            var $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-model"]');

            obj.source_model_logic_tree_file = $target.find('div[name="source-model-logic-tree-file-html"] select[name="file_html"]').val();
            if (obj.source_model_logic_tree_file == '') {
                ret.str += "'Source model logic tree file' field is empty.\n";
            }
            uniqueness_add(files_list, 'source model logic tree', obj.source_model_logic_tree_file);
            ret.str += uniqueness_check(files_list);

            // Source model files
            obj.source_model_file = $target.find('div[name="source-model-file-html"] select').val();
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

            obj.gsim_logic_tree_file = $target.find('div[name="gsim-logic-tree-file-html"] select[name="file_html"]').val();
            if (obj.gsim_logic_tree_file == '') {
                ret.str += "'GMPE logic tree file' field is empty.\n";
            }
            uniqueness_add(files_list, 'gmpe logic tree', obj.gsim_logic_tree_file);
            ret.str += uniqueness_check(files_list);

            obj.width_of_mfd_bin = $target.find('input[type="text"][name="width_of_mfd_bin"]').val();
            if (!gem_ipt.isFloat(obj.width_of_mfd_bin) || parseFloat(obj.width_of_mfd_bin) < 0.0) {
                ret.str += "'Bin width of the magnitude frequency distribution' field isn't a not negative float number (" + obj.width_of_mfd_bin + ").\n";
            }

            obj.rupture_mesh_spacing_choice = $target.find('input[type="checkbox"][name="rupture_mesh_spacing_choice"]').is(':checked');
            if (obj.rupture_mesh_spacing_choice) {
                obj.rupture_mesh_spacing = $target.find('input[type="text"][name="rupture_mesh_spacing"]').val();
                if (!gem_ipt.isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) < 0.0) {
                    ret.str += "'Rupture mesh spacing' field isn't a not negative float number (" + obj.rupture_mesh_spacing + ").\n";
                }
            }

            obj.area_source_discretization_choice = $target.find('input[type="checkbox"][name="area_source_discretization_choice"]').is(':checked');
            if (obj.area_source_discretization_choice) {
                obj.area_source_discretization = $target.find('input[type="text"][name="area_source_discretization"]').val();
                if (!gem_ipt.isFloat(obj.area_source_discretization) || parseFloat(obj.area_source_discretization) < 0.0) {
                    ret.str += "'Area source discretization' field isn't a not negative float number (" + obj.area_source_discretization + ").\n";
                }
            }

            obj.complex_fault_mesh_choice = $target.find('input[type="checkbox"][name="complex_fault_mesh_choice"]').is(':checked');
            if (obj.complex_fault_mesh_choice) {
                obj.complex_fault_mesh = $target.find('input[type="text"][name="complex_fault_mesh"]').val();
                if (!gem_ipt.isFloat(obj.complex_fault_mesh) || parseFloat(obj.complex_fault_mesh) <= 0.0) {
                    ret.str += "'Complex fault mesh spacing' field isn't a positive float number (" + obj.complex_fault_mesh + ").\n";
                }
            }
        }

        // Calculation parameters (get)
        if (obj.hazard == 'hazard') {
            $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-calculation"]');
            if (obj.risk == null) {
                // if risk disabled imts fields must be shown
                // calculation parameters -> specify-imt (get)
                obj.intensity_measure_types = $target.find('div[name="hazard-imt_specify-imt"]'
                        + ' input[type="checkbox"][name="imt"]:checked').map(function(_, el) {
                            return $(el).val();
                        }).get();

                obj.custom_imt = $target.find('input[name="custom_imt"]').val();

                if (obj.intensity_measure_types.length < 1 && obj.custom_imt == "") {
                    ret.str += "IMT's not selected.\n";
                }
            }

            obj.use_imt_from_vulnerability = $target.find('input[name="use_imt_from_vulnerability"]').is(':checked');

            obj.ground_motion_correlation_model = $target.find('select[name="ground-motion-correlation"]').val();

            if (["", "JB2009"].indexOf(obj.ground_motion_correlation_model) == -1) {
                ret.str += "'Ground Motion Correlation' field unknown.\n";
            }

            obj.maximum_distance = $target.find('input[name="maximum_distance"]').val();
            if (!gem_ipt.isFloat(obj.maximum_distance) || parseFloat(obj.maximum_distance) < 0.0) {
                ret.str += "'Maximum source-to-site distance' field isn't positive float number (" + obj.maximum_distance + ").\n";
            }
            obj.truncation_level = $target.find('input[name="truncation_level"]').val();
            if (!gem_ipt.isFloat(obj.truncation_level) || parseFloat(obj.truncation_level) < 0.0) {
                ret.str += "'Level of truncation' field isn't positive float number (" + obj.truncation_level + ").\n";
            }

            obj.investigation_time = $target.find('input[type="text"][name="investigation_time"]').val();
            if (!gem_ipt.isInt(obj.investigation_time) || parseInt(obj.investigation_time) <= 0.0) {
                ret.str += "'Hazard investigation time' field isn't positive number ("
                    + obj.investigation_time + ").\n";
            }

            obj.ses_per_logic_tree_path = $target.find('input[type="text"][name="ses_per_logic_tree_path"]').val();
            if (!gem_ipt.isInt(obj.ses_per_logic_tree_path) || parseInt(obj.ses_per_logic_tree_path) <= 0.0) {
                ret.str += "'Stochastic event sets per logic tree path' field isn't positive number ("
                    + obj.ses_per_logic_tree_path + ").\n";
            }

            obj.number_of_logic_tree_samples = $target.find('input[type="text"][name="number_of_logic_tree_samples"]').val();
            if (!gem_ipt.isInt(obj.number_of_logic_tree_samples) || parseInt(obj.number_of_logic_tree_samples) < 0.0) {
                ret.str += "'Number of logic tree samples' field is negative number ("
                    + obj.number_of_logic_tree_samples + ").\n";
            }
        }

        // Exposure model (get)
        exposure_model_getData(
            'e_b', ret, files_list, obj,
            ((obj.hazard == 'hazard' && obj.hazard_sites_choice == 'exposure-model') || obj.risk != null),
            obj.risk);

        if ((obj.hazard != null && obj.use_imt_from_vulnerability == true) ||
            obj.risk != null) {
            // Vulnerability model (get)
            vulnerability_model_getData('e_b', ret, files_list, obj);
        }

        // Hazard outputs (get)
        if (obj.hazard != null) {
            var $target = $(cf_obj['e_b'].pfx + ' div[name="hazard-outputs"]');

            obj.save_ruptures = $target.find('input[type="checkbox"][name="save_rupture_data"]'
                                           ).is(':checked');

            obj.ground_motion_fields = $target.find('input[type="checkbox"][name="ground_motion_fields"]'
                                        ).is(':checked');

            obj.hazard_curves_from_gmfs = $target.find('input[type="checkbox"][name="hazard_curves_from_gmfs"]'
                                        ).is(':checked');

            if (obj.hazard_curves_from_gmfs) {
                obj.quantile_hazard_curves_choice = $target.find('input[type="checkbox"][name="quantile_hazard_curves_choice"]').is(':checked');
                if (obj.quantile_hazard_curves_choice) {
                    obj.quantile_hazard_curves = $target.find('input[type="text"][name="quantile_hazard_curves"]'
                                                  ).val();

                    var arr = obj.quantile_hazard_curves.split(',');
                    for (var k in arr) {
                        var cur = arr[k].trim(' ');
                        if (!gem_ipt.isFloat(cur) || cur <= 0.0) {
                            ret.str += "'Quantile hazard curves' field element #" + (parseInt(k)+1)
                                + " isn't positive number (" + cur + ").\n";
                        }
                    }
                }
            }

            obj.hazard_maps = $target.find('input[type="checkbox"][name="hazard_maps"]').is(':checked');

            if (obj.hazard_maps) {
                obj.poes = $target.find('input[type="text"][name="poes"]').val();

                var arr = obj.poes.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!gem_ipt.isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Probability of exceedances' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
                    }
                }
            }

            obj.uniform_hazard_spectra = $target.find('input[type="checkbox"][name="uniform_hazard_spectra"]'
                                          ).is(':checked');
        }

        // Risk calculations (get)
        {
            var pfx = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';
            var pfx_vuln = cf_obj['e_b'].pfx + ' div[name="vulnerability-model"]';

            obj.risk_investigation_time = $(pfx + ' input[type="text"][name="risk_investigation_time"]').val();
            if (!gem_ipt.isInt(obj.risk_investigation_time) || parseInt(obj.risk_investigation_time) <= 0.0) {
                ret.str += "'Risk investigation time' field isn't positive number ("
                    + obj.risk_investigation_time + ").\n";
            }


            obj.ret_periods_for_aggr = $(pfx + ' input[type="text"][name="ret_periods_for_aggr"]').val();

            if (obj.ret_periods_for_aggr == "") {
                obj.ret_periods_for_aggr = null;
            }
            else {
                var arr = obj.ret_periods_for_aggr.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!gem_ipt.isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Return periods for aggregate loss curve' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
                    }
                }
            }
        }

        // Risk outputs (get)
        {
            var $target = $(cf_obj['e_b'].pfx + ' div[name="risk-outputs"]');
            var pfx_riscal = cf_obj['e_b'].pfx + ' div[name="risk-calculation"]';

            obj.quantile_loss_curves_choice = $target.find('input[type="checkbox"][name="quantile_loss_curves_choice"]').is(':checked');
            if (obj.quantile_loss_curves_choice) {
                obj.quantile_loss_curves = $target.find('input[type="text"][name="quantile_loss_curves"]'
                                            ).val();

                var arr = obj.quantile_loss_curves.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!gem_ipt.isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Quantile loss curves' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
                    }
                }
            }

            obj.conditional_loss_poes_choice = $target.find('input[type="checkbox"][name="conditional_loss_poes_choice"]').is(':checked');

            if (obj.conditional_loss_poes_choice) {
                obj.conditional_loss_poes = $target.find('input[type="text"][name="conditional_loss_poes"]').val();

                var arr = obj.conditional_loss_poes.split(',');
                for (var k in arr) {
                    var cur = arr[k].trim(' ');
                    if (!gem_ipt.isFloat(cur) || cur <= 0.0) {
                        ret.str += "'Loss maps' field element #" + (parseInt(k)+1)
                            + " isn't positive number (" + cur + ").\n";
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
    /* hazard components callbacks (init) */
    $(cf_obj['e_b'].pfx + ' input[name="hazard"]').click(event_based_manager);
    $(cf_obj['e_b'].pfx + ' input[name="risk"]').click(event_based_manager);

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

    $(cf_obj['e_b'].pfx + ' input[name="hazard"]').prop('checked', true).triggerHandler('click');

    /*
     * - - - VOLCANO - - -
     */

    function volcano_fileNew_upload(event)
    {
        form = $(event.target).parent('form').get(0);
        return generic_fileNew_upload('vol', form, event);
    }

    function volcano_fileNew_collect(event, reply)
    {
        return generic_fileNew_collect('vol', reply, event);
    }

    function volcano_manager()
    {
        var $phen, $phens = $(cf_obj['vol'].pfx + " div[name='phens'] input[type='checkbox']");
        var $phen_input, $file_new, is_ashfall, is_cons_model, $cons_model;

        var $expo_is_reg_const = $(cf_obj['vol'].pfx + " div[name='exposure'] input[name='is-reg-constr']");
        var $expo_reg_const = $(cf_obj['vol'].pfx + " div[name='exposure'] div[name='region-constraint']");

        for (var i = 0 ; i < $phens.length ; i++) {
            is_ashfall = $($phens[i]).attr('name') == 'ashfall';

            $phen = $($phens[i]);
            $phen_input = $(cf_obj['vol'].pfx + " div[name='" + $phen.attr('name') + "-input']");

            if ($phen.is(':checked')) {
                $phen_input.show();
                phen_type = $phen_input.find("select[name='in-type']").val();
                $epsg_tag = $phen_input.find("div[name='epsg']");
                $discr_dist_tag = $phen_input.find("div[name='discr-dist']");
                $haz_field_tag = $phen_input.find("div[name='haz-field']");
                $density_tag = $phen_input.find("div[name='density']");
                $spec_ass_haz_dist =  $phen_input.find("div[name='spec-ass-haz-dist']");
                if (phen_type == 'text') {
                    $epsg_tag.show();
                    $discr_dist_tag.hide();
                    $haz_field_tag.hide();
                    $density_tag.show();
                    $spec_ass_haz_dist.show();
                }
                else if (phen_type == 'openquake') {
                    $epsg_tag.hide();
                    $discr_dist_tag.hide();
                    $haz_field_tag.hide();
                    $density_tag.hide();
                    $spec_ass_haz_dist.show();
                }
                else if (phen_type == 'shape') {
                    $epsg_tag.hide();
                    $discr_dist_tag.show();
                    $haz_field_tag.show();
                    $density_tag.show();
                    $spec_ass_haz_dist.show();
                }
                else if (phen_type == 'shape-to-wkt') {
                    $epsg_tag.hide();
                    $discr_dist_tag.hide();
                    $haz_field_tag.hide();
                    $density_tag.hide();
                    $spec_ass_haz_dist.hide();
                }
                var accept_in = multi_accept[$phen.attr('name') + '_file'][phen_type];
                var accept = "";

                for (var e = 0 ; e < accept_in.length ; e++) {
                    accept += (e > 0 ? ", " : "") + "." + accept_in[e];
                }

                $(cf_obj['vol'].pfx + ' div[name="' + $phen.attr('name') +
                  '-input' + '"] input[type="file"]').attr('accept', accept);

                if (is_ashfall) {
                    is_cons_model = $(cf_obj['vol'].pfx +
                                      " div[name='fragility'] input[name='is-cons-models']").is(':checked');
                    $cons_model = $(cf_obj['vol'].pfx + " div[name='fragility'] div[name='ashfall-cons']");
                    if (is_cons_model)
                        $cons_model.show();
                    else
                        $cons_model.hide();
                    $(cf_obj['vol'].pfx + " div[name='fragility']").show();
                }
            }
            else {
                $phen_input.hide();
                if (is_ashfall) {
                    $(cf_obj['vol'].pfx + " div[name='fragility']").hide();
                }
            }
        }

        // Exposure model (ui) - (volcano)
        // exposure_model_sect_manager(scope, enabled, with_constraints, without_inc_asset)
        exposure_model_sect_manager('vol', true, true, true);
    }

    /* generic callback to show upload div */
    function volcano_fileNew_cb(e) {
        var name = $(e.target).attr('name');
        var $epsg = $(e.target).parent().parent().find('input[name="' + name.slice(0, -9) + '-epsg"]');

        if ($epsg.length > 0) {
            if ($epsg.val()  == '') {
                gem_ipt.error_msg('Associated coordinate reference system [EPSG] not properly set.');
                return;
            }
        }

        if (typeof gem_api == 'undefined') {
            /* generic callback to show upload div (init) */
            $(cf_obj['vol'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();
            if ($(cf_obj['vol'].pfx + ' div[name="' + e.target.name + '"]').css('display') != 'none') {
                if (typeof window.gem_not_interactive == 'undefined') {
                    $(cf_obj['vol'].pfx + ' div[name="' + e.target.name + '"] input[type="file"]').click();
                    var name = e.target.name;

                    function uploader_rollback() {
                        if ($(cf_obj['vol'].pfx + ' div[name="' + name +
                              '"] input[type="file"]').val().length > 0) {
                            $(document.body).off('focusin', uploader_rollback);
                            return;
                        }

                        var $msg = $(cf_obj['vol'].pfx + ' div[name="' + name + '"] div[name="msg"]');
                        $msg.html("Upload file cancelled.");
                        $(cf_obj['vol'].pfx + ' div[name="' + name + '"]').delay(3000).slideUp({
                            done: function () {
                                $(cf_obj['vol'].pfx + ' div[name="' + name + '"] div[name="msg"]').html('');
                            }
                        });
                        $(document.body).off('focusin', uploader_rollback);
                    }
                    $(document.body).on('focusin', uploader_rollback);
                }
            }
        }
        else { // if (gem_api == null
            var event = e;
            var $msg = $(cf_obj['vol'].pfx + ' div[name="' + e.target.name + '"] div[name="msg"]');
            $(cf_obj['vol'].pfx + ' div[name="' + e.target.name + '"]').slideToggle();

            var $sibling = $(e.target).siblings("select[name='file_html']");
            var subdir = $sibling.attr('data-gem-subdir');
            var sel_grp = $sibling.attr('data-gem-group');
            var is_multiple = $sibling.is("[multiple]");

            function cb(uuid, app_msg) {
                if (! app_msg.complete)
                    return;

                var cmd_msg = app_msg.result;
                if (cmd_msg.success) {
                    $msg.html("File '" + cmd_msg.content[0] + "' collected correctly.");
                    volcano_fileNew_collect(event, cmd_msg);
                }
                else {
                    $msg.html(cmd_msg.reason);
                }
                $(cf_obj['vol'].pfx + ' div[name="' + event.target.name + '"]').delay(3000).slideUp();
            }
            gem_api.select_and_copy_file(cb, subdir, is_multiple);
        }
    }

    /* force to have at least one checkbox enabled */
    function volcano_phen_cb(event)
    {
        var $phens = $(cf_obj['vol'].pfx + " div[name='phens'] input[type='checkbox']:checked");

        if ($phens.length == 0) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        volcano_manager();
    }

    /* - - - VOLCANO (INIT) - - - */

    $(cf_obj['vol'].pfx + " div[name='phens'] input[type='checkbox']").click(volcano_phen_cb);
    $(cf_obj['vol'].pfx + ' input[name="ashfall"]').prop('checked', true).triggerHandler('click');
    $(cf_obj['vol'].pfx + " div[name='fragility'] input[name='is-cons-models']").click(volcano_manager);

    // Exposure model (init)
    exposure_model_init('vol', volcano_fileNew_cb, volcano_fileNew_upload, volcano_manager);

    var phenomena = cf_obj['vol'].phenomena;
    var phenomena_name = cf_obj['vol'].phenomena_name;
    for (var i = 0 ; i < phenomena.length ; i++) {
        file_uploader_init('vol', phenomena[i] + '-file', volcano_fileNew_cb, volcano_fileNew_upload);
        $(cf_obj['vol'].pfx + " div[name='" + phenomena[i] + "-input'] select[name='in-type']"
         ).change(function in_type_change(event) {
             var $obj = $(event.target).parent().parent().find("form#file-upload-form");
             generic_fileNew_refresh('vol', $obj, event);
             volcano_manager();
         });
    }

    file_uploader_init('vol', 'fm-ashfall-file', volcano_fileNew_cb, volcano_fileNew_upload);
    file_uploader_init('vol', 'fm-ashfall-cons', volcano_fileNew_cb, volcano_fileNew_upload);

    // Volcano outputs (init)
    $(cf_obj['vol'].pfx + ' button[name="clean_all"]').click(clean_all_cb);

    // Scope violation but isn't so serious
    $(ex_obj.pfx + ' button[name="clean_all"]').click(clean_all_cb);

    function volcano_getData()
    {

        var files_list = [];
        var $tab = $(cf_obj['vol'].pfx);
        var ret = {
            ret: -1,
            str: '',
            obj: null
        };
        var obj = {
            description: null,

            ashfall_in_type: false,
            lavaflow_in_type: false,
            lahar_in_type: false,
            pyroclasticflow_in_type: false,

            ashfall_choice: false,
            lavaflow_choice: false,
            lahar_choice: false,
            pyroclasticflow_choice: false,

            ashfall_file: null,
            ashfall_epsg: null,
            ashfall_discr_dist: null,
            ashfall_haz_field: null,
            ashfall_ass_haz_dist: null,
            ashfall_wet_ampl: "",
            ashfall_density: "",

            // fragility
            fm_ashfall_file: null,
            ashfall_cons_models_choice: false,
            ashfall_cons_models_file: null,

            lavaflow_file: null,
            lavaflow_epsg: null,
            lavaflow_discr_dist: null,
            lavaflow_haz_field: null,
            lavaflow_ass_haz_dist: null,

            lahar_epsg: null,
            lahar_file: null,
            lahar_discr_dist: null,
            lahar_haz_field: null,
            lahar_ass_haz_dist: null,

            pyroclasticflow_file: null,
            pyroclasticflow_epsg: null,
            pyroclasticflow_discr_dist: null,
            pyroclasticflow_haz_field: null,
            pyroclasticflow_ass_haz_dist: null,

            // exposure
            exposure_model: null,
            exposure_model_regcons_choice: false,
            exposure_model_regcons_coords_data: null,

            asset_hazard_distance_enabled: false,
            asset_hazard_distance: null,

            // # FIXME modal_damage_state
            // is_modal_damage_state: false
        };

        obj.description = $tab.find('textarea[name="description"]').val();
        obj.description = obj.description.replace(
            new RegExp("\n", "g"), " ").replace(new RegExp("\r", "g"), " ").trim();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        var phenomena = cf_obj['vol'].phenomena;
        var phenomena_name = cf_obj['vol'].phenomena_name;
        var in_type;
        for (var i = 0 ; i < phenomena.length ; i++) {
            obj[phenomena[i] + "_choice"] = $tab.find(
                "input[type='checkbox'][name='" + phenomena[i] + "']").is(':checked');
            if (! obj[phenomena[i] + "_choice"])
                continue;

            in_type = $tab.find(
                "div[name='" + phenomena[i] + "-input'] select[name='in-type']").val();

            obj[phenomena[i] + "_in_type"] = in_type;

            obj[phenomena[i] + "_ass_haz_dist"] = $tab.find(
                "div[name='" + phenomena[i] + "-input'] input[name='spec-ass-haz-dist']").val();
            if (obj[phenomena[i] + "_ass_haz_dist"] == '') {
                ret.str += upper_first(phenomena_name[i]) + ": asset hazard distance not set.\n";
            }

            obj[phenomena[i] + "_file"] = $tab.find('div[name="' + phenomena[i] + '-input"]\
                div[name="' + phenomena[i] + '-file-html"] select[name="file_html"]').val();
            if (obj[phenomena[i] + "_file"] == "") {
                ret.str += upper_first(phenomena_name[i]) + ": associated file not set.\n";
            }

            if (in_type == 'text') {
                obj[phenomena[i] + '_epsg'] = $tab.find(
                    'div[name="' + phenomena[i] + '-input"] input[type="text"][name="epsg"]').val();
                if (obj[phenomena[i] + '_epsg'] == '') {
                    ret.str += upper_first(phenomena_name[i]) + ": EPSG is empty.\n";
                    console.log('mop: catched');
                }
            }
            else if (in_type == 'shape') {
                obj[phenomena[i] + '_discr_dist'] = $tab.find(
                    'div[name="' + phenomena[i] + '-input"] input[type="text"][name="discr-dist"]').val();
                if (obj[phenomena[i] + '_discr_dist'] == '') {
                    ret.str += upper_first(phenomena_name[i]) + ": discretization distance is empty.\n";
                }
                obj[phenomena[i] + '_haz_field'] = $tab.find(
                    'div[name="' + phenomena[i] + '-input"] input[type="text"][name="haz-field"]').val();
                if (obj[phenomena[i] + '_haz_field'] == '') {
                    ret.str += upper_first(phenomena_name[i]) + ": hazard field is empty.\n";
                }
            }
        }

        if (obj.ashfall_choice) {
            obj.ashfall_wet_ampl = $tab.find(
                'div[name="ashfall-input"] input[type="text"][name="wet-ampl"]').val();
            if (obj.ashfall_wet_ampl == "" || parseFloat(obj.ashfall_wet_ampl) < 1.0) {
                ret.str += "'Ash wet amplification factor' value must be >= 1.0.\n";
            }

            obj.ashfall_density = $tab.find(
                'div[name="ashfall-input"] input[type="text"][name="density"]').val();
            if (obj.ashfall_density == "" || parseFloat(obj.ashfall_density) < 1.0) {
                ret.str += "'Ash density' value must be >= 1.0.\n";
            }

            obj.fm_ashfall_file = $tab.find('div[name="fragility"] div[name="fm-ashfall-file-html"]' +
                                          ' select[name="file_html"]').val();
            if (obj.fm_ashfall_file == "")
                ret.str += "Fragility function associated file not set.\n";


            obj.ashfall_cons_models_choice = $tab.find(
                'div[name="fragility"]' +
                    ' input[type="checkbox"][name="is-cons-models"]').is(':checked');
            if (obj.ashfall_cons_models_choice) {
                obj.ashfall_cons_models_file = $tab.find(
                    'div[name="fragility"] div[name="fm-ashfall-cons-html"]' +
                        ' select[name="file_html"]').val();
                if (obj.ashfall_cons_models_file == "")
                    ret.str += "Consequence models file not set.\n";
            }
        }

        // Exposure model (get)
        exposure_model_getData('vol', ret, files_list, obj, true, true);

        // # FIXME modal_damage_state
        // obj.is_modal_damage_state = ($tab.find(
        //    "select[name='is-modal-damage-state']").val() == "yes");
        //
        if (ret.str == '') {
            ret.ret = 0;
            ret.obj = obj;
        }
        return ret;
    }
    cf_obj['vol'].getData = volcano_getData;

    function volcano_download_cb(e)
    {
        var generic_prepare_download_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_download_normal_postcb : generic_prepare_download_gemapi_postcb;

        return generic_prepare_cb('vol', this, generic_prepare_download_postcb, e);
    }
    $(cf_obj['vol'].pfx + ' button[name="download"]').click(volcano_download_cb);

    function volcano_runcalc_cb(e)
    {
        var generic_prepare_runcalc_postcb = (typeof gem_api == 'undefined') ?
            generic_prepare_runcalc_normal_postcb : generic_prepare_runcalc_gemapi_postcb;

        return generic_prepare_cb('vol', this, generic_prepare_runcalc_postcb, e);
    }
    $(cf_obj['vol'].pfx + ' button[name="run-calc-btn"]').click(volcano_runcalc_cb);

    volcano_manager();
});
