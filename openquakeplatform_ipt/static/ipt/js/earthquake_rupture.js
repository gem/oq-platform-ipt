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

    planar_surface_add: function () {
        console.log("    planar_surface_add");
        var ct = er_obj.planar_tbl_cur;
        var ctx = '\
      <dev name="planar-' + ct + '">\n\
        <h4>Planar surface ' + (ct + 1) + '</h4>\n\
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
    console.log($(table_id));

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
});
