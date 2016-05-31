/*
  FIXME HEADER
  */

var cf_obj = {
    scen_haz_regGrid_coords: null
}

$(document).ready(function () {
    $('.cf_gid #tabs[name="subtabs"] a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    /* hazard components callbacks */
    function eqScenario_hazard_onclick_cb(e) {
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]').css('display', $(e.target).is(':checked') ? '' : 'none');
    }
    $('.cf_gid div[name="eq-scenario"] input[name="hazard"]').click(eqScenario_hazard_onclick_cb);
    eqScenario_hazard_onclick_cb({ target: $('.cf_gid div[name="eq-scenario"] input[name="hazard"]')[0]});

    /* risk components callbacks */
    function eqScenario_risk_onclick_cb(e) {
        $('.cf_gid div[name="eq-scenario"] span[name="risk-menu"]').css('display', $(e.target).is(':checked') ? '' : 'none');
    }
    $('.cf_gid div[name="eq-scenario"] input[name="risk"]').click(eqScenario_risk_onclick_cb);
    eqScenario_risk_onclick_cb({ target: $('.cf_gid div[name="eq-scenario"] input[name="risk"]')[0] });

    /* hazard rupture info */
    function eqScenario_ruptureFileNew_cb(e) {
        $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"] div[name="rupture-file-new"]').toggle();
    }
    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"] button[name="rupture-file-new"]').click(
        eqScenario_ruptureFileNew_cb);

    function eqScenario_ruptureFileNew_upload(event)
    {
        event.preventDefault();
        var data = new FormData($('form[name="rupture_file"]').get(0));

        $.ajax({
            url: $(this).attr('action'),
            type: $(this).attr('method'),
            data: data,
            cache: false,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.ret == 0) {
                    $sel = $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]'
                             + ' select[name="rupture_file_html"]')
                    $sel.empty()

                    var options = null;
                    for (var i = 0 ; i < data.items.length ; i++) {
                        $("<option />", {value: data.items[i][0], text: data.items[i][1]}).appendTo($sel);
                    }
                }
                $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]'
                  + ' div[name="rupture-file-new"] div[name="msg"]').html(data.ret_msg);
                $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"]'
                  + ' div[name="rupture-file-new"]').delay(3000).slideUp();
            }
        });
        return false;
    }
    $('.cf_gid div[name="eq-scenario"] div[name="hazard-content"] div[name="rupture-file-new"]' +
      ' form[name="rupture_file"]').submit(eqScenario_ruptureFileNew_upload);

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

