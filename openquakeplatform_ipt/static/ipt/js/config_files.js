/*
  FIXME HEADER
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

    /* exposure model */
    $(cf_obj.shpfx + ' button[name="site-conditions-new"]').click(
        eqScenario_fileNew_cb);
    $(cf_obj.shpfx + ' div[name="site-conditions-new"]' +
      ' form[name="site-conditions"]').submit(eqScenario_fileNew_upload);


    /* hazard sites callbacks */
    function eqScenario_hazard_hazardSites_onclick_cb(e) {
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
          ' div[name^="hazard-sites_"]').css('display', 'none');
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
          ' div[name="hazard-sites_' + e.target.value + '"]').css('display', '');
    }
    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
      ' input[name="eq-scenario_hazard_sites"]').click(eqScenario_hazard_hazardSites_onclick_cb);
    eqScenario_hazard_hazardSites_onclick_cb({ target: $(
        '.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
            ' input[name="eq-scenario_hazard_sites"][value="region-grid"]')[0] });

    /* hazard site conditions callbacks */
    function eqScenario_hazard_siteCond_onclick_cb(e) {
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
          ' div[name^="hazard-sitecond_"]').css('display', 'none');
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
          ' div[name="hazard-sitecond_' + e.target.value + '"]').css('display', '');
    }
    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
      ' input[name="eq-scenario_hazard_sitecond"]').click(eqScenario_hazard_siteCond_onclick_cb);
    eqScenario_hazard_siteCond_onclick_cb({ target: $(
        '.cf_gid div[name="eq-scenario"] div[name="hazard-content"]' +
            ' input[name="eq-scenario_hazard_sitecond"][value="uniform-param"]')[0] });

    /* handsontables creations */
    /* hazard content table handsontable */
    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"] div[name="table"]').handsontable({
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
    cf_obj.scen_haz_regGrid_coords = $('.cf_gid div[name="eq-scenario"]' +
                                       ' div[name="hazard-content"] div[name="table"]').handsontable('getInstance');

    {
        var tbl = cf_obj.scen_haz_regGrid_coords;
        var $box = $('.cf_gid div[name="eq-scenario"]' +
                     ' div[name="hazard-content"] div[name="table"]')

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

    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"] button[name="new_row_add"]').click(
        function () {
            cf_obj.scen_haz_regGrid_coords.alter('insert_row');
        });
});

