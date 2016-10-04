/*
   Copyright (c) 2016, GEM Foundation.

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

var er_obj = {
    pfx: "div.er_gid ",
    rupture_type_manager: function(evt) {
        var rupt_cur = $(evt.target).attr("value");
        $(er_obj.pfx + ' div[name="rupture"] > div').hide();
        $(er_obj.pfx + ' div[name="rupture"] > div[name="' + rupt_cur + '"').show();
    },
    simple_tbl: null,
    planar_tbl: {},
    planar_tbl_cur: 0,

    complex_tbl: {},
    complex_tbl_cur: 0,

    arbitrary_tbl: {},

    tbl_complex_params: {
            colHeaders: [ 'Longitude (°)', 'Latitude (°)', 'Depth (km)'],
            startCols: 3,
            minCols: 3,
            maxCols: 3,
            startRows: 2,
            minRows: 1,
            maxRows: 10000,
            contextMenu: ['row_above', 'row_below', 'remove_row', 'undo', 'redo'],
            className: "htRight"
    },

    /************
     *          *
     *  PLANAR  *
     *          *
     ************/
    planar_surface_del: function (obj) {
        var id = obj.getAttribute("data_gem_id");
        var item = $(er_obj.pfx + 'div[name="planars"] div[name="planar-' + id + '"]');
        delete(this.planar_tbl[id]);
        item.remove();
    },

    planar_surface_add: function () {
        var ct = er_obj.planar_tbl_cur;
        var ctx = '\
      <div name="planar-' + ct + '">\n\
        <div class="menuItems" style="margin-top: 12px;">\n\
            <div style="display: inline-block; float: left;"><h4>Planar surface ' + (ct + 1) + '</h4></div><button type="button" data_gem_id="' + ct + '" class="btn" style="margin-top: 8px; margin-bottom: 8px;" onclick="er_obj.planar_surface_del(this);">Delete Planar Surface</button>\n\
        </div>\n\
        <div class="menuItems">\n\
         <label>Strike (degrees) <span class="ui-icon ui-icon-help ipt_help" title="The strike direction corresponds to the angle between the north and the direction you take so that when you walk along the fault trace the fault dips on your right."></span>:</label>\n\
          <input type="text" name="dip" value="90" placeholder="0 ≤ float ≤ 90">\n\
        </div>\n\
        <div class="menuItems">\n\
          <label>Dip (degrees)  <span class="ui-icon ui-icon-help ipt_help" title="The dip is the steepest angle of descent of the fault plane relative to a horizontal plane; it is measured in degrees [0, 90].">:</label>\n\
          <input type="text" name="upper_ses_dep" placeholder="float ≥ 0" value="0">\n\
        </div>\n\
\n\
        <div class="menuItems planar_geometry">\n\
          <label>Planar Geometry:</label>\n\
          <div style="margin-left: auto;">\n\
            <div name="geometry-' + ct + '" style="margin-left: auto; width: 340px; height: 120px; overflow: hidden;"></div>\n\
          </div>\n\
        </div>\n\
</div>';
        $(er_obj.pfx + 'div[name="planars"]').append(ctx);

        var table_id = er_obj.pfx + 'div[name="rupture"] > div[name="planar"] div[name="geometry-' + ct + '"]';

        $(table_id).handsontable({
            colHeaders: [ 'Longitude (°)', 'Latitude (°)', 'Depth (km)'],
            rowHeaders: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
            startCols: 3,
            startRows: 4,
            maxCols: 3,
            maxRows: 4,
            className: "htRight"
        });
        er_obj.simple_tbl[ct] = $(table_id).handsontable('getInstance');

        er_obj.planar_tbl_cur++;
    },

    /*************
     *           *
     *  COMPLEX  *
     *           *
     *************/
    complex_surface_middle_del: function (obj) {
        var id = obj.getAttribute("data_gem_id");
        var mid_id = obj.getAttribute("data_gem_mid_id");
        var $item = $(er_obj.pfx + 'div[name="complexes"] div[name="complex-' + id + '"] div[name="middle-' + mid_id + '"]');
        delete(this.complex_tbl[id].middles[mid_id]);
        $item.remove();
    },

    complex_surface_middle_add: function (obj) {
        var id = obj.getAttribute("data_gem_id");
        var mid_id = er_obj.complex_tbl[id].middles_n;

        var ctx = '\
          <div class="menuItems" name="middle-' + mid_id + '">\n\
            <label>Fault intermediate edge ' + (mid_id + 1) + ':</label>\n\
            <button style="margin-bottom: 8px;" data_gem_id="' + id + '" data_gem_mid_id="'+ mid_id + '" \
onclick="er_obj.complex_surface_middle_del(this);">Delete Fault</button>\n\
            <div style="margin-left: auto;">\n\
              <div name="middle-geometry-' + id + '-' + mid_id + '" style="margin-left: auto; width: 240px; height: 90px; overflow: hidden;"></div>\n\
            </div>\n\
          </div>\n';
        $(er_obj.pfx + 'div[name="complexes"] div[name="complex-' + id + '"] div[name="middles"]').append(ctx);

        var middle_table_id = er_obj.pfx + 'div[name="rupture"] > div[name="complex"] div[name="complex-' + id + '"] div[name="middles"] div[name="middle-geometry-' + id + '-' + mid_id + '"]';
        $(middle_table_id).handsontable(er_obj.tbl_complex_params);
        er_obj.complex_tbl[id].middles[mid_id] = $(middle_table_id).handsontable('getInstance');

        er_obj.complex_tbl[id].middles_n++;
    },

    complex_surface_del: function (obj) {
        var id = obj.getAttribute("data_gem_id");
        var $item = $(er_obj.pfx + 'div[name="complexes"] div[name="complex-' + id + '"]');

        for (var mid_id = 0 ; mid_id < this.complex_tbl[id].middles_n ; mid_id++) {
            if (mid_id in this.complex_tbl[id].middles) {
                var middle_table_id = er_obj.pfx + 'div[name="rupture"] > div[name="complex"] div[name="complex-' + id + '"] div[name="middles"] div[name="middle-geometry-' + id + '-' + mid_id + '"]';
                $(middle_table_id).remove();
                delete(this.complex_tbl[id].middles[mid_id]);
            }
        }
        delete(this.complex_tbl[id]);
        $item.remove();
    },

    complex_surface_add: function () {
        var ct = er_obj.complex_tbl_cur;
        var ctx = '\
      <div name="complex-' + ct + '">\n\
        <div class="menuItems" style="margin-top: 12px; margin-left: 100px;">\n\
          <div style="display: inline-block; float: left;"><h4>Complex surface ' + (ct + 1) + '</h4></div><button type="button" data_gem_id="' + ct + '" class="btn" style="margin-top: 8px; margin-bottom: 8px;" onclick="er_obj.complex_surface_del(this);">Delete Complex Surface</button>\n\
        </div>\n\
        <div class="menuItems complex_geometry">\n\
          <label>Fault top edge:</label>\n\
          <div style="margin-left: auto;">\n\
            <div name="top-geometry-' + ct + '" style="margin-left: auto; width: 240px; height: 90px; overflow: hidden;"></div>\n\
          </div>\n\
        </div>\n\
        <div name="middles"></div>\n\
        <div class="menuItems" style="margin-top: 12px; text-align: center;">\n\
          <button type="button" data_gem_id="' + ct + '" class="btn" style="margin-top: 8px; margin-bottom: 8px;" onclick="er_obj.complex_surface_middle_add(this);">Add intermediate edge</button>\n\
        </div>\n\
        <div class="menuItems complex_geometry">\n\
          <label>Fault bottom edge:</label>\n\
          <div style="margin-left: auto;">\n\
            <div name="bottom-geometry-' + ct + '" style="margin-left: auto; width: 240px; height: 90px; overflow: hidden;"></div>\n\
          </div>\n\
        </div>\n\
</div>';
        $(er_obj.pfx + 'div[name="complexes"]').append(ctx);

        er_obj.complex_tbl[ct] = { top: null, bottom: null, middles: {}, middles_n: 0 };

        var top_table_id = er_obj.pfx + 'div[name="rupture"] > div[name="complex"] div[name="top-geometry-' + ct + '"]';

        $(top_table_id).handsontable(er_obj.tbl_complex_params);
        er_obj.complex_tbl[ct].top = $(top_table_id).handsontable('getInstance');

        var bottom_table_id = er_obj.pfx + 'div[name="rupture"] > div[name="complex"] div[name="bottom-geometry-' + ct + '"]';
        $(bottom_table_id).handsontable(er_obj.tbl_complex_params);
        er_obj.complex_tbl[ct].bottom = $(bottom_table_id).handsontable('getInstance');

        er_obj.complex_tbl_cur++;
    },

    /***************
     *             *
     *  ARBITRARY  *
     *             *
     ***************/

    arbitrary_geometry_populate: function() {
        var mag, hypo_lat, hypo_lon, hypo_depth, strike, dip, rake
        mag = $(er_obj.pfx + 'input[name="magnitude"]').val();
        console.log('mag: ' + $(er_obj.pfx + 'input[name="magnitude"]').length);
        hypo_lat = $(er_obj.pfx + 'input[name="hypo_lat"]').val();
        hypo_lon = $(er_obj.pfx + 'input[name="hypo_lon"]').val();
        hypo_depth = $(er_obj.pfx + 'input[name="hypo_depth"]').val();

        strike = $(er_obj.pfx + 'div[name="arbitrary"] input[name="strike"]').val();
        dip = $(er_obj.pfx + 'div[name="arbitrary"] input[name="dip"]').val();

        rake = $(er_obj.pfx + 'input[name="rake"]').val();

        pargs = { "mag": mag, "hypo_lat": hypo_lat, "hypo_lon": hypo_lon, "hypo_depth": hypo_depth,
                  "strike": strike, "dip": dip, "rake": rake };
        console.log(pargs);
        $.post('sendback_er_rupture_surface',
               { mag: mag, hypo_lat: hypo_lat, hypo_lon: hypo_lon, hypo_depth: hypo_depth,
                 strike: strike, dip: dip, rake: rake })
            .done(function(resp){
                var data = [];
                var rows = ["topLeft", "bottomLeft", "bottomRight", "topRight"];
                var cols = ["lat", "lon", "depth"];
                for (i in rows) {
                    row = resp[rows[i]];
                    data[i] = [];
                    for (e in cols) {
                        data[i][e] = row[cols[e]];
                    }
                }

                er_obj.arbitrary_tbl.loadData(data);
            })
            .fail(function(resp){
                console.log('POST.error');
            });
    }
};

// tab initialization
$(document).ready(function () {
    /////////////////////////////////////////////////////////
    // Manage the visibility of the perArea selection menu //
    /////////////////////////////////////////////////////////
    $(er_obj.pfx + ' input[name="rupture_type"]').click(er_obj.rupture_type_manager);

    var header = ['Longitude', 'Latitude'];
    var table_id = er_obj.pfx + 'div[name="rupture"] > div[name="simple"] > div > div > div[name="geometry"]';

    $(table_id).handsontable({
        colHeaders: [ 'Longitude', 'Latitude'],
        rowHeaders: true,
        contextMenu: true,
        startRows: 3,
        startCols: 2,
        maxCols: 2,
        className: "htRight"
    });
    er_obj.simple_tbl = $(table_id).handsontable('getInstance');

    setTimeout(function() {
        return gem_tableHeightUpdate(
            $(er_obj.pfx + 'div[name="rupture"] > div[name="simple"] > div > div > div[name="geometry"]'));
    }, 0);

    er_obj.simple_tbl.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate(
            $(er_obj.pfx + 'div[name="rupture"] > div[name="simple"] > div > div > div[name="geometry"]'));
    });

    er_obj.simple_tbl.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate(
            $(er_obj.pfx + 'div[name="rupture"] > div[name="simple"] > div > div > div[name="geometry"]'));
    });

    $(er_obj.pfx + 'div[name="rupture"] > div[name="simple"] > div > div > button[name="new_row_add"]').click(
        function() { er_obj.simple_tbl.alter('insert_row'); });

    $(er_obj.pfx + 'div[name="rupture"] > div[name="planar"] button[name="planar_surface_add"]').click(
        er_obj.planar_surface_add);
    er_obj.planar_surface_add();

    $(er_obj.pfx + 'div[name="rupture"] > div[name="complex"] button[name="complex_surface_add"]').click(
        er_obj.complex_surface_add);
    er_obj.complex_surface_add();

    /* arbitrary */
    var table_id = er_obj.pfx + 'div[name="rupture"] > div[name="arbitrary"] div[name="geometry"]';

    $(table_id).handsontable({
        colHeaders: [ 'Longitude (°)', 'Latitude (°)', 'Depth (km)'],
        rowHeaders: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
        startCols: 3,
        startRows: 4,
        readOnly: true,
        className: "htRight"
    });
    er_obj.arbitrary_tbl = $(table_id).handsontable('getInstance');

});
