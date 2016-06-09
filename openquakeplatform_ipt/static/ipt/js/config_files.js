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
    shpfx: '.cf_gid div[name="eq-scenario"] div[name="hazard-content"]',
    scen_haz_regGrid_coords: null
}

$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    /* hazard components callbacks */
    function eqScenario_hazard_onclick_cb(e) {
        $(cf_obj.shpfx).css('display', $(e.target).is(':checked') ? '' : 'none');
    }
    $('.cf_gid div[name="eq-scenario"] input[name="hazard"]').click(eqScenario_hazard_onclick_cb);
    eqScenario_hazard_onclick_cb({ target: $('.cf_gid div[name="eq-scenario"] input[name="hazard"]')[0]});

    /* risk components callbacks */
    function eqScenario_risk_onclick_cb(e) {
        $('.cf_gid div[name="eq-scenario"] span[name="risk-menu"]').css('display', $(e.target).is(':checked') ? '' : 'none');
    }
    $('.cf_gid div[name="eq-scenario"] input[name="risk"]').click(eqScenario_risk_onclick_cb);
    eqScenario_risk_onclick_cb({ target: $('.cf_gid div[name="eq-scenario"] input[name="risk"]')[0] });


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
                if (data.ret == 0) {
                    $sel = $(cf_obj.shpfx + ' div[name="' + name + '-html"] select[name="file_html"]')
                    $sel.empty()

                    var options = null;
                    for (var i = 0 ; i < data.items.length ; i++) {
                        $("<option />", {value: data.items[i][0], text: data.items[i][1]}).appendTo($sel);
                    }
                    $sel.val(data.selected);
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
        $(cf_obj.shpfx + ' div[name^="hazard-sites_"]').css('display', 'none');
        $(cf_obj.shpfx + ' div[name="hazard-sites_' + e.target.value + '"]').css('display', '');
        if (e.target.value == "site-cond-model") {
            $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sitecond"]').prop('disabled', true);
            $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sitecond"][value="from-file"]').prop('checked', true);
            $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sitecond"][value="from-file"]').trigger('click');
            $(cf_obj.shpfx + ' span[name="eq-scenario_hazard_sitecond"]').addClass('inlible_disabled');
        }
        else {
            $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sitecond"]').prop('disabled', false);
            $(cf_obj.shpfx + ' span[name="eq-scenario_hazard_sitecond"]').removeClass('inlible_disabled');
        }
    }
    $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sites"]').click(
        eqScenario_hazard_hazardSites_onclick_cb);
    eqScenario_hazard_hazardSites_onclick_cb({ target: $(
        cf_obj.shpfx + ' input[name="eq-scenario_hazard_sites"][value="region-grid"]')[0] });

    /* hazard site conditions callbacks */
    function eqScenario_hazard_siteCond_onclick_cb(e) {
        $(cf_obj.shpfx + ' div[name^="hazard-sitecond_"]').css('display', 'none');
        $(cf_obj.shpfx + ' div[name="hazard-sitecond_' + e.target.value + '"]').css('display', '');
    }
    $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_sitecond"]').click(
        eqScenario_hazard_siteCond_onclick_cb);
    eqScenario_hazard_siteCond_onclick_cb({
        target: $(cf_obj.shpfx
                  + ' input[name="eq-scenario_hazard_sitecond"][value="uniform-param"]')[0]
    });


    /* hazard gmpe callbacks */
    function eqScenario_hazard_gmpe_onclick_cb(e) {
        $(cf_obj.shpfx + ' div[name^="hazard-gmpe_"]').css('display', 'none');
        $(cf_obj.shpfx + ' div[name="hazard-gmpe_' + e.target.value + '"]').css('display', '');
    }
    $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_gmpe"]').click(
        eqScenario_hazard_gmpe_onclick_cb);
    eqScenario_hazard_gmpe_onclick_cb({
        target: $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_gmpe"][value="specify-gmpe"]')[0]
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
        className: "htRight",
        stretchH: "all"
    });
    cf_obj.scen_haz_regGrid_coords = $(cf_obj.shpfx + ' div[name="table"]').handsontable('getInstance');
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
            description: null,

            /* rupture information */
            rupture_information: null,
            rupture_mesh_spacing: null,

            /* hazard sites */
            hazard_sites_choice: null,
            grid_spacing: null,
            reggrid_coords_data: null,
            list_of_sites: null,
            exposure_model: null,

            /* site conditions */
            site_conditions_choice: null,
            reference_vs30_value: null,
            reference_vs30_type: null,
            reference_depth_to_2pt5km_per_sec: null,
            reference_depth_to_1pt0km_per_sec: null,

            site_model_file: null,

            /* calculation parameters */
            gmpe_choice: null,
            intensity_measure_types: null,
            fravul_model_file: null,

            ground_motion_correlation_model: null,
            truncation_level: null,
            maximum_distance: null,
            number_of_ground_motion_fields: null
        };

        obj.description = $(cf_obj.shpfx + ' textarea[name="description"]').val();
        if (obj.description == '') {
            ret.str += "'Description' field is empty.\n";
        }

        /* rupture information */
        obj.rupture_information = $(cf_obj.shpfx + ' div[name="rupture-file-html"] select[name="file_html"]').val();
        if (obj.rupture_information == '') {
            ret.str += "'Rupture file' field is empty.\n";
        }
        obj.rupture_mesh_spacing = $(cf_obj.shpfx + ' input[name="rupture_mesh_spacing"]').val();
        if (!isFloat(obj.rupture_mesh_spacing) || parseFloat(obj.rupture_mesh_spacing) <= 0.0) {
            ret.str += "'Rupture Mesh Spacing' field isn't greater than 0 float number (" + obj.rupture_mesh_spacing + ").\n";
        }
        uniqueness_add(files_list, 'rupture information', obj.rupture_information);

        /* hazard sites */
        obj.hazard_sites_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                    + '[name="eq-scenario_hazard_sites"]:checked').val();


        if (obj.hazard_sites_choice == 'region-grid') {
            /* hazard sites -> region-grid */
            obj.grid_spacing = $(cf_obj.shpfx + ' input[name="grid_spacing"]').val();
            if (!isFloat(obj.grid_spacing) || parseFloat(obj.grid_spacing) <= 0.0) {
                ret.str += "'Grid spacing' field isn't greater than 0 float number (" + obj.grid_spacing + ").\n";
            }

            obj.reggrid_coords_data = cf_obj.scen_haz_regGrid_coords.getData();
            // Check for invalid value
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
            /* hazard sites -> list-of-sites */
            obj.list_of_sites = $(cf_obj.shpfx + ' div[name="list-of-sites-html"] select[name="file_html"]').val();
            if (obj.list_of_sites == '') {
                ret.str += "'List of sites' field is empty.\n";
            }
            uniqueness_add(files_list, 'list of sites', obj.list_of_sites);
            ret.str += uniqueness_check(files_list);
        }
        else if (obj.hazard_sites_choice == 'exposure-model') {
            /* hazard sites -> exposure-model */
            obj.exposure_model = $(cf_obj.shpfx + ' div[name="exposure-model-html"] select[name="file_html"]').val();
            if (obj.exposure_model == '') {
                ret.str += "'Exposure model' field is empty.\n";
            }

            uniqueness_add(files_list, 'exposure model', obj.exposure_model);
            ret.str += uniqueness_check(files_list);
        }
        else if (obj.hazard_sites_choice == 'site-cond-model') {
            /* hazard sites -> site-cond-model */

            /* no other checks in this case */
        }
        else {
            ret.str += "Unknown 'Hazard sites' choice (' + obj.hazard_sites_choice + ').\n";
        }

        /* site conditions */
        obj.site_conditions_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                   + '[name="eq-scenario_hazard_sitecond"]:checked').val();

        if (obj.site_conditions_choice == 'uniform-param') {
            /* site conditions -> uniform-param */
            obj.reference_vs30_value = $(cf_obj.shpfx + ' div[name="hazard-sitecond_uniform-param"]'
                                     + ' input[type="text"][name="reference_vs30_value"]').val();
            if (!isFloat(obj.reference_vs30_value) || parseFloat(obj.reference_vs30_value) < 0.0) {
                ret.str += "'Reference vs30 value' field isn't positive float number (" + obj.reference_vs30_value + ").\n";
            }
            obj.reference_vs30_type = $(cf_obj.shpfx + ' input[type="radio"]'
                                   + '[name="eq-scenario_hazard_sitecond_type"]:checked').val();
            if (obj.reference_vs30_type != 'inferred' && obj.reference_vs30_type != 'measured') {
                ret.str += "Reference vs30 type choice (" + obj.reference_vs30_type + ") unknown";
            }

            if (!isFloat(obj.reference_depth_to_2pt5km_per_sec) || parseFloat(obj.reference_depth_to_2pt5km_per_sec) < 0.0) {
                ret.str += "'Minimum depth at which vs30 >= 2.5' field isn't positive float number (" + obj.reference_depth_to_2pt5km_per_sec + ").\n";
            }
            if (!isFloat(obj.reference_depth_to_1pt0km_per_sec) || parseFloat(obj.reference_depth_to_1pt0km_per_sec) < 0.0) {
                ret.str += "'Minimum depth at which vs30 >= 1.0' field isn't positive float number (" + obj.reference_depth_to_1pt0km_per_sec + ").\n";
            }
        }
        else if (obj.site_conditions_choice == 'from-file') {
            /* site conditions -> from-file */
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

        /* calculation parameters */

        obj.gmpe_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                        + '[name="eq-scenario_hazard_gmpe"]:checked').val();

        if (obj.gmpe_choice == 'specify-gmpe') {
            obj.gsim = $(cf_obj.shpfx + ' input[type="radio"][name="gmpe"]:checked').map(function(_, el) {
                return $(el).val();
            }).get();

            if (obj.gsim.length < 1) {
                ret.str += "Unique GMPE not selected.\n";
            }
        }
        else if (obj.gmpe_choice == 'from-file') {
            /* calculation parameters -> from file */
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

        /* calculation parameters -> specify-imt */
        obj.intensity_measure_types = $(
            cf_obj.shpfx + ' div[name="hazard-imt_specify-imt"]'
                + ' input[type="checkbox"][name="imt"]:checked').map(function(_, el) {
                    return $(el).val();
                }).get();

        if (obj.intensity_measure_types.length < 1) {
            ret.str += "IMT's not selected.\n";
        }


        obj.ground_motion_correlation_model = $(
            cf_obj.shpfx + ' select[name="ground-motion-correlation"]').val();

        if (["none", "JB2009"].indexOf(obj.ground_motion_correlation_model) == -1) {
            ret.str += "'Ground Motion Correlation' field unknown or empty.\n";
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
                console.log("SUCCESS! ");

                // if (data.ret == 0) {
                //     $sel = $(cf_obj.shpfx + ' div[name="' + name + '-html"] select[name="file_html"]')
                //     $sel.empty()

                //     var options = null;
                //     for (var i = 0 ; i < data.items.length ; i++) {
                //         $("<option />", {value: data.items[i][0], text: data.items[i][1]}).appendTo($sel);
                //     }
                //     $sel.val(data.selected);
                // }
                // $(cf_obj.shpfx + ' div[name="' + name + '-new"] div[name="msg"]').html(data.ret_msg);
                // $(cf_obj.shpfx + ' div[name="' + name + '-new"]').delay(3000).slideUp();
            }
        });
        return false;
    }

    $(cf_obj.shpfx + ' button[name="download"]').click(eqScenario_download_cb);

});

