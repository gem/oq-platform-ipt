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
    $(cf_obj.shpfx + ' button[name="imt-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="imt-new"]' +
      ' form[name="imt"]').submit(eqScenario_fileNew_upload);

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


    /* hazard imt callbacks */
    function eqScenario_hazard_imt_onclick_cb(e) {
        $(cf_obj.shpfx + ' div[name^="hazard-imt_"]').css('display', 'none');
        $(cf_obj.shpfx + ' div[name="hazard-imt_' + e.target.value + '"]').css('display', '');
    }
    $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_imt"]').click(
        eqScenario_hazard_imt_onclick_cb);
    eqScenario_hazard_imt_onclick_cb({
        target: $(cf_obj.shpfx + ' input[name="eq-scenario_hazard_imt"][value="specify-imt"]')[0]
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

    function eqScenario_download_cb(e)
    {
        var ret_str = '';
        var description = null;

        /* rupture information */
        var rupture_information = null;
        var rupture_mesh_spacing = null;

        /* hazard sites */
        var hazard_sites_choice = null;
        var grid_spacing = null;
        var reggrid_coords_data = null;
        var list_of_sites = null;
        var exposure_model = null;

        /* site conditions */
        var site_conditions_choice = null;
        var reference_vs30_value = null;
        var reference_vs30_type = null;
        var reference_depth_to_2pt5km_per_sec = null;
        var reference_depth_to_1pt0km_per_sec = null;
        var site_model_file = null;

        /* calculation parameters */
        var gsim = null;

        var imt_choice = null;
        var intensity_measure_types = null;
        var fravul_model_file = null;

        var ground_motion_correlation_model = null;
        var truncation_level = null;
        var maximum_distance = null;

        description = $(cf_obj.shpfx + ' textarea[name="description"]').val();
        if (description == '') {
            ret_str += "'Description' field is empty.\n";
        }

        /* rupture information */
        rupture_information = $(cf_obj.shpfx + ' div[name="rupture-file-html"] select[name="file_html"]').val();
        if (rupture_information == '') {
            ret_str += "'Rupture file' field is empty.\n";
        }
        rupture_mesh_spacing = $(cf_obj.shpfx + ' input[name="rupture_mesh_spacing"]').val();
        if (!isFloat(rupture_mesh_spacing) || parseFloat(rupture_mesh_spacing) <= 0.0) {
            ret_str += "'Rupture Mesh Spacing' field isn't greater than 0 float number (" + rupture_mesh_spacing + ").\n";
        }

        /* hazard sites */
        hazard_sites_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                    + '[name="eq-scenario_hazard_sites"]:checked').val();


        if (hazard_sites_choice == 'region-grid') {
            /* hazard sites -> region-grid */
            grid_spacing = $(cf_obj.shpfx + ' input[name="grid_spacing"]').val();
            if (!isFloat(grid_spacing) || parseFloat(grid_spacing) <= 0.0) {
                ret_str += "'Grid spacing' field isn't greater than 0 float number (" + grid_spacing + ").\n";
            }

            reggrid_coords_data = cf_obj.scen_haz_regGrid_coords.getData();
            // Check for invalid value
            for (var i = 0; i < reggrid_coords_data.length; i++) {
                var lon = reggrid_coords_data[i][0], lat = reggrid_coords_data[i][1];
                if (lon === null || lat === null || !isFloat(lon) || !isFloat(lat) ||
                    parseFloat(lon) < -180.0 || parseFloat(lon) > 180.0 ||
                    parseFloat(lat) < -90.0  || parseFloat(lat) > 180.0) {
                    ret_str += "Entry #" + (i+1) + " of region grid 'Coordinates'"
                        + " field is invalid (" + lon + ", " + lat + ").\n";
                }
            }
        }
        else if (hazard_sites_choice == 'list-of-sites') {
            /* hazard sites -> list-of-sites */
            list_of_sites = $(cf_obj.shpfx + ' div[name="list-of-sites-html"] select[name="file_html"]').val();
            if (list_of_sites == '') {
                ret_str += "'List of sites' field is empty.\n";
            }
        }
        else if (hazard_sites_choice == 'exposure-model') {
            /* hazard sites -> exposure-model */
            exposure_model = $(cf_obj.shpfx + ' div[name="exposure-model-html"] select[name="file_html"]').val();
            if (exposure_model == '') {
                ret_str += "'Exposure model' field is empty.\n";
            }
        }
        else if (hazard_sites_choice == 'site-cond-model') {
            /* hazard sites -> site-cond-model */

            /* no other checks in this case */
        }
        else {
            ret_str += "Unknown 'Hazard sites' choice (' + hazard_sites_choice + ').\n";
        }

        /* site conditions */
        site_conditions_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                                   + '[name="eq-scenario_hazard_sitecond"]:checked').val();

        if (site_conditions_choice == 'uniform-param') {
            /* site conditions -> uniform-param */
            reference_vs30_value = $(cf_obj.shpfx + ' div[name="hazard-sitecond_uniform-param"]'
                                     + ' input[type="text"][name="reference_vs30_value"]').val();
            if (!isFloat(reference_vs30_value) || parseFloat(reference_vs30_value) < 0.0) {
                ret_str += "'Reference vs30 value' field isn't positive float number (" + reference_vs30_value + ").\n";
            }
            reference_vs30_type = $(cf_obj.shpfx + ' input[type="radio"]'
                                   + '[name="eq-scenario_hazard_sitecond_type"]:checked').val();
            if (reference_vs30_type != 'inferred' && reference_vs30_type != 'measured') {
                ret_str += "Reference vs30 type choice (" + reference_vs30_type + ") unknown";
            }

            if (!isFloat(reference_depth_to_2pt5km_per_sec) || parseFloat(reference_depth_to_2pt5km_per_sec) < 0.0) {
                ret_str += "'Minimum depth at which vs30 >= 2.5' field isn't positive float number (" + reference_depth_to_2pt5km_per_sec + ").\n";
            }
            if (!isFloat(reference_depth_to_1pt0km_per_sec) || parseFloat(reference_depth_to_1pt0km_per_sec) < 0.0) {
                ret_str += "'Minimum depth at which vs30 >= 1.0' field isn't positive float number (" + reference_depth_to_1pt0km_per_sec + ").\n";
            }
        }
        else if (site_conditions_choice == 'from-file') {
            /* site conditions -> from-file */
            site_model_file = $(cf_obj.shpfx + ' div[name="site-conditions-html"] select[name="file_html"]').val();
            if (site_model_file == '') {
                ret_str += "'Site conditions file' field is empty.\n";
            }
        }
        else {
            ret_str += "Unknown 'Site conditions' choice (' + site_conditions_choice + ').\n";
        }

        /* calculation parameters */
        gsim = $(cf_obj.shpfx + ' input[type="radio"][name="gmpe"]:checked').map(function(_, el) {
            return $(el).val();
        }).get();

        if (gsim.length < 1) {
            ret_str += "GMPE's not selected.\n";
        }

        imt_choice = $(cf_obj.shpfx + ' input[type="radio"]'
                       + '[name="eq-scenario_hazard_imt"]:checked').val();

        if (imt_choice == 'specify-imt') {
            /* calculation parameters -> specify-imt */
            intensity_measure_types = $(
                cf_obj.shpfx + ' div[name="hazard-imt_specify-imt"]'
                    + ' input[type="checkbox"][name="imt"]:checked').map(function(_, el) {
                        return $(el).val();
                    }).get();

            if (intensity_measure_types.length < 1) {
                ret_str += "IMT's not selected.\n";
            }
        }
        else if (imt_choice == 'from-file') {
            /* calculation parameters -> from file */
            fravul_model_file = $(cf_obj.shpfx + ' div[name="hazard-imt_from-file"]'
                                  + ' div[name="fravul-model-html"] select[name="file_html"]').val();
            if (fravul_model_file == '') {
                ret_str += "'Fragility/Vulnerability model file' field is empty.\n";
            }
        }
        else {
            ret_str += "Unknown 'Intensity Measure Types' choice (' + imt_choice + ').\n";
        }

        ground_motion_correlation_model = $(
            cf_obj.shpfx + ' select[name="ground-motion-correlation"]').val();

        if (["none", "JB2009"].indexOf(ground_motion_correlation_model) == -1) {
            ret_str += "'Ground Motion Correlation' field unknown or empty.\n";
        }

        truncation_level = $(cf_obj.shpfx + ' input[name="truncation_level"]').val();
        if (!isFloat(truncation_level) || parseFloat(truncation_level) < 0.0) {
            ret_str += "'Level of truncation' field isn't positive float number (" + truncation_level + ").\n";
        }

        maximum_distance = $(cf_obj.shpfx + ' input[name="maximum_distance"]').val();
        if (!isFloat(maximum_distance) || parseFloat(maximum_distance) < 0.0) {
            ret_str += "'Maximum source-to-site distance' field isn't positive float number (" + maximum_distance + ").\n";
        }

        number_of_ground_motion_fields = $(cf_obj.shpfx + ' input[name="number_of_ground_motion_fields"]').val();
        if (!isInt(number_of_ground_motion_fields) || parseInt(number_of_ground_motion_fields) <= 0) {
            ret_str += "'Number of ground motion fields' field isn't greater than 0 integer number (" + number_of_ground_motion_fields + ").\n";
        }

        if (ret_str != '') {
            $( "#dialog-message" ).html(ret_str.replace(/\n/g, "<br/>"));
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
    }

    $(cf_obj.shpfx + ' button[name="download"]').click(eqScenario_download_cb);

});

