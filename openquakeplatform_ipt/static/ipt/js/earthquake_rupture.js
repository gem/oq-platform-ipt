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

    arbitrary_tbl: null,

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
<div style="display: inline-block; float: left;"><h4>Planar surface ' + (ct + 1) + '</h4></div>';
        ctx += (ct == 0 ? '<div style="clear: both;"></div>' : '<button type="button" data_gem_id="' + ct + '" class="btn" style="margin-top: 8px; margin-bottom: 8px;" onclick="er_obj.planar_surface_del(this);">Delete Planar Surface</button>');
        ctx += '\
        </div>\n\
        <div class="menuItems">\n\
         <label>Strike (degrees) <span class="ui-icon ui-icon-help ipt_help" title="The strike direction corresponds to the angle between the north and the direction you take so that when you walk along the fault trace the fault dips on your right."></span>:</label>\n\
          <input type="text" name="strike" value="0" placeholder="0 ≤ float ≤ 360">\n\
        </div>\n\
        <div class="menuItems">\n\
          <label>Dip (degrees)  <span class="ui-icon ui-icon-help ipt_help" title="The dip is the steepest angle of descent of the fault plane relative to a horizontal plane; it is measured in degrees (0, 90].">:</label>\n\
          <input type="text" name="dip" placeholder="0 < float ≤ 90" value="90">\n\
        </div>\n\
\n\
        <div class="menuItems planar_geometry">\n\
          <label>Planar Geometry:</label>\n\
          <div style="margin-left: auto;">\n\
            <div name="geometry-' + ct + '" style="margin-left: auto; width: 340px; height: 140px; overflow: hidden;"></div>\n\
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
        er_obj.planar_tbl[ct] = $(table_id).handsontable('getInstance');

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
        var mid_id = er_obj.complex_tbl[id].middles_cur;

        var ctx = '\
          <div class="menuItems" name="middle-' + mid_id + '">\n\
            <label>Fault intermediate edge ' + (mid_id + 1) + ':</label>\n\
            <button style="margin-bottom: 8px;" data_gem_id="' + id + '" data_gem_mid_id="'+ mid_id + '" \
onclick="er_obj.complex_surface_middle_del(this);">Delete intermediate edge</button>\n\
            <div style="margin-left: auto;">\n\
              <div name="middle-geometry-' + id + '-' + mid_id + '" style="margin-left: auto; width: 240px; height: 90px; overflow: hidden;"></div>\n\
            </div>\n\
          </div>\n';
        $(er_obj.pfx + 'div[name="complexes"] div[name="complex-' + id + '"] div[name="middles"]').append(ctx);

        var middle_table_id = er_obj.pfx + 'div[name="rupture"] > div[name="complex"] div[name="complex-' + id + '"] div[name="middles"] div[name="middle-geometry-' + id + '-' + mid_id + '"]';
        $(middle_table_id).handsontable(er_obj.tbl_complex_params);
        er_obj.complex_tbl[id].middles[mid_id] = $(middle_table_id).handsontable('getInstance');

        er_obj.complex_tbl[id].middles_cur++;
    },

    complex_surface_del: function (obj) {
        var id = obj.getAttribute("data_gem_id");
        var $item = $(er_obj.pfx + 'div[name="complexes"] div[name="complex-' + id + '"]');

        for (var mid_id = 0 ; mid_id < this.complex_tbl[id].middles_cur ; mid_id++) {
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
            <div style="display: inline-block; float: left;"><h4>Complex surface ' + (ct + 1) + '</h4></div>';

        ctx += (ct == 0 ? '<div style="clear: both;"></div>' : '            <button type="button" data_gem_id="' + ct + '" class="btn" style="margin-top: 8px; margin-bottom: 8px;" onclick="er_obj.complex_surface_del(this);">Delete Complex Surface</button>');
        ctx += '\n\
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

        er_obj.complex_tbl[ct] = { top: null, bottom: null, middles: {}, middles_cur: 0 };

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

    arbitrary_geometry_populate: function(obj) {
        var thiz = this;
        var mag, hypo_lat, hypo_lon, hypo_depth, rake, strike, dip;
        var reset_data = [["", "", ""], ["", "", ""], ["", "", ""], ["", "", ""]];
        try {
            var header = this.validate_header();
            mag = header.mag;
            rake = header.rake;
            hypo_lat = header.hypo_lat;
            hypo_lon = header.hypo_lon;
            hypo_depth = header.hypo_depth;

            strike = gem_ipt.check_val(
                "Strike", $(this.pfx + 'div[name="arbitrary"] input[name="strike"]').val(),
                'float-range-in-in', 0, 360);
            dip = gem_ipt.check_val(
                "Dip", $(this.pfx + 'div[name="arbitrary"] input[name="dip"]').val(),
                'float-range-out-in', 0, 90);
        } catch(exc) {
            thiz.arbitrary_tbl.loadData(reset_data);
            gem_ipt.error_msg(exc.message);
            return false;
        }

        var pargs = { "mag": mag, "hypo_lat": hypo_lat, "hypo_lon": hypo_lon, "hypo_depth": hypo_depth,
                      "strike": strike, "dip": dip, "rake": rake };

        $.post('sendback_er_rupture_surface', pargs)
            .done(function(resp){
                if (resp.ret == 0) {
                    var data = [];
                    var rows = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
                    var cols = ["lon", "lat", "depth"];
                    for (i in rows) {
                        row = resp[rows[i]];
                        data[i] = [];
                        for (e in cols) {
                            data[i][e] = row[cols[e]];
                        }
                    }

                    thiz.arbitrary_tbl.loadData(data);
                }
                else {
                    gem_ipt.error_msg('Geometry calculation failed with message:\n' + resp.ret_s);
                    thiz.arbitrary_tbl.loadData(reset_data);
                }
            })
            .fail(function(resp){
                gem_ipt.error_msg('Geometry calculation call failed.\n');
                thiz.arbitrary_tbl.loadData(reset_data);
            });
    },

    validate_header: function() {
        var mag, rake, hypo_lat, hypo_lon, hypo_depth;

        mag = gem_ipt.check_val("Magnitude", $(this.pfx + 'input[name="magnitude"]').val(),
                                'float-gt', 0);
        rake = gem_ipt.check_val("Rake", $(this.pfx + 'input[name="rake"]').val(),
                                 'float-range-in-in', -180, 180);
        hypo_lat = gem_ipt.check_val("Latitude of hypocenter", $(this.pfx + 'input[name="hypo_lat"]').val(),
                                     'float-range-in-in', -90, 90);
        hypo_lon = gem_ipt.check_val("Longitude of hypocenter", $(this.pfx + 'input[name="hypo_lon"]').val(),
                                     'float-range-in-in', -180, 180);
        hypo_depth = gem_ipt.check_val("Depth of hypocenter", $(this.pfx + 'input[name="hypo_depth"]').val(),
                                       'float-ge', 0);

        return ({"mag": mag, "rake": rake, "hypo_lat": hypo_lat, "hypo_lon": hypo_lon, "hypo_depth": hypo_depth});
    },

    header2nrml: function(mag, rake, hypo_lon, hypo_lat, hypo_depth) {
        var nrml;

        nrml = '\
        <magnitude>' + mag + '</magnitude>\n\
        <rake>' + rake + '</rake>\n\
        <hypocenter lat="' + hypo_lat + '" lon="' + hypo_lon + '" depth="' + hypo_depth + '"/>\n';

        return nrml;
    },

    convert2nrml: function(obj) {
        var mag, hypo_lat, hypo_lon, hypo_depth, rake;
        var strike, dip, upper_ses_dep, lower_ses_dep;
        var simple_tbl_data;
        var planar = {};

        /* data validation */
        try {
            var header = this.validate_header();
            mag = header.mag;
            rake = header.rake;
            hypo_lat = header.hypo_lat;
            hypo_lon = header.hypo_lon;
            hypo_depth = header.hypo_depth;

            rupture_type = $(this.pfx + ' input[type="radio"][name="rupture_type"]:checked').val();
            if (rupture_type == 'simple') {
                simple_tbl_data = this.simple_tbl.getData();
                gem_ipt.check_val("Simple fault geometry", simple_tbl_data, "tab-check",
                                  [["Longitude", "float-range-in-in", -180, 180],
                                   ["Latitude", "float-range-in-in", -90, 90]]);
                dip = gem_ipt.check_val("Dip", $(this.pfx + 'div[name="simple"] input[name="dip"]').val(),
                                            'float-range-out-in', 0, 90);
                upper_ses_dep = gem_ipt.check_val(
                    "Upper seismogenic depth", $(this.pfx + 'div[name="simple"] input[name="upper_ses_dep"]').val(),
                    'float-ge', 0);
                lower_ses_dep = gem_ipt.check_val(
                    "Lower seismogenic depth", $(this.pfx + 'div[name="simple"] input[name="lower_ses_dep"]').val(),
                    'float-gt', upper_ses_dep );
            }
            else if (rupture_type == 'planar') {
                for (var i = 0 ; i < this.planar_tbl_cur ; i++) {
                    if (!(i in this.planar_tbl))
                        continue;
                    try {
                        planar[i] = {};

                        planar[i].strike = gem_ipt.check_val(
                            "Strike", $(this.pfx + 'div[name="planar"] div[name="planars"] div[name="planar-' + i
                                        + '"] input[name="strike"]').val(), 'float-range-in-in', 0, 360);
                        planar[i].dip = gem_ipt.check_val(
                            "Dip", $(this.pfx + 'div[name="planar"] div[name="planars"] div[name="planar-' + i
                                     + '"] input[name="dip"]').val(), 'float-range-out-in', 0, 90);

                        planar[i].tbl_data = this.planar_tbl[i].getData();

                        gem_ipt.check_val("Surface geometry", planar[i].tbl_data, "tab-check",
                                          [["Longitude", "float-range-in-in", -180, 180],
                                           ["Latitude", "float-range-in-in", -90, 90],
                                           ["Depth", "float-ge", 0]],
                                          ["topLeft", "topRight", "bottomLeft", "bottomRight"]);

                        if (this.planar_tbl[i].getDataAtCell(0,2) != this.planar_tbl[i].getDataAtCell(1,2)) {
                            throw new gem_ipt.check_exception("Surface geometries Top Left ("
                                                              + this.planar_tbl[i].getDataAtCell(0,2)
                                                              + ") and Top Right ("
                                                              + this.planar_tbl[i].getDataAtCell(1,2)
                                                              + ") differ.");
                        }

                        if (this.planar_tbl[i].getDataAtCell(2,2) != this.planar_tbl[i].getDataAtCell(3,2)) {
                            throw new gem_ipt.check_exception("Surface geometries Bottom Left ("
                                                              + this.planar_tbl[i].getDataAtCell(2,2)
                                                              + ") and Bottom Right ("
                                                              + this.planar_tbl[i].getDataAtCell(3,2)
                                                              + ") differ.");
                        }
                    } catch(exp) {
                        throw new gem_ipt.check_exception("Error in 'Planar surface " + (i + 1) + "' with message:\n" +
                                                       exp.message);
                    }
                }
            }
            else if (rupture_type == 'complex') {
                for (var i = 0 ; i < this.complex_tbl_cur ; i++) {
                    if (!(i in this.complex_tbl))
                        continue;
                    try {
                        // obj initialization:
                        //     er_obj.complex_tbl[ct] = { top: null, bottom: null, middles: {}, middles_cur: 0 };
                        var complex_obj = this.complex_tbl[i];

                        var top_tbl_data = complex_obj.top.getData();

                        gem_ipt.check_val("Fault top edge", top_tbl_data, "tab-check",
                                          [["Longitude", "float-range-in-in", -180, 180],
                                           ["Latitude", "float-range-in-in", -90, 90],
                                           ["Depth", "float-ge", 0]]);

                        for (var e = 0 ; e < complex_obj.middles_cur ; e++) {
                            if (!(e in complex_obj.middles))
                                continue;

                            var middle_tbl_data = complex_obj.middles[e].getData();
                            gem_ipt.check_val("Fault intermediate edge " + (e + 1), middle_tbl_data, "tab-check",
                                              [["Longitude", "float-range-in-in", -180, 180],
                                               ["Latitude", "float-range-in-in", -90, 90],
                                               ["Depth", "float-ge", 0]]);
                        }

                        var bottom_tbl_data = complex_obj.bottom.getData();
                        gem_ipt.check_val("Fault bottom edge", bottom_tbl_data, "tab-check",
                                          [["Longitude", "float-range-in-in", -180, 180],
                                           ["Latitude", "float-range-in-in", -90, 90],
                                           ["Depth", "float-ge", 0]]);


                    } catch(exp) {
                        throw new gem_ipt.check_exception("Error in 'Complex surface " + (i + 1) + "' with message:\n" +
                                                       exp.message);
                    }
                }
            }
            else if (rupture_type == 'arbitrary') {
                strike = gem_ipt.check_val(
                    "Strike", $(this.pfx + 'div[name="arbitrary"] input[name="strike"]').val(),
                    'float-range-in-in', 0, 360);
                dip = gem_ipt.check_val(
                    "Dip", $(this.pfx + 'div[name="arbitrary"] input[name="dip"]').val(),
                    'float-range-out-in', 0, 90);

                var tbl_data = this.arbitrary_tbl.getData();

                gem_ipt.check_val("Surface geometry", tbl_data, "tab-check",
                                  [["Longitude", "float-range-in-in", -180, 180],
                                   ["Latitude", "float-range-in-in", -90, 90],
                                   ["Depth", "float-ge", 0]],
                                  ["topLeft", "topRight", "bottomLeft", "bottomRight"]);
            }
            else {
                throw new gem_ipt.check_exception("Rupture type '" + rupture_type + "' not recognized.");
            }

        } catch(exc) {
            gem_ipt.error_msg(exc.message);
            return false;
        }

        /* NRML generation */

        var nrml = '<?xml version="1.0" encoding="utf-8"?>\n\
<nrml xmlns:gml="http://www.opengis.net/gml" xmlns="http://openquake.org/xmlns/nrml/0.4">';

        if (rupture_type == 'simple') {
            nrml += '    <simpleFaultRupture>\n';
            nrml += er_obj.header2nrml(mag, rake, hypo_lon, hypo_lat, hypo_depth);
            nrml += '\
        <simpleFaultGeometry>\n\
            <gml:LineString>\n\
                <gml:posList>\n';
            for (var i = 0 ; i < simple_tbl_data.length ; i++) {
                nrml += '                    ' + simple_tbl_data[i][0] + ' ' + simple_tbl_data[i][1] + '\n';
            }
            nrml += '\
                </gml:posList>\n\
            </gml:LineString>\n\
            <dip>' + dip + '</dip>\n\
            <upperSeismoDepth>' + upper_ses_dep + '</upperSeismoDepth>\n\
            <lowerSeismoDepth>' + lower_ses_dep + '</lowerSeismoDepth>\n\
        </simpleFaultGeometry>\n\
    </simpleFaultRupture>\n';
        }
        else if (rupture_type == 'planar') {
            var plan_n = 0;
            for (var i = 0 ; i < this.planar_tbl_cur ; i++) {
                if (i in this.planar_tbl) {
                    plan_n++;
                }
            }
            if (plan_n == 1) {
                nrml += '    <singlePlaneRupture>\n';
            }
            else {
                nrml += '    <multiplePlaneRupture>\n'
            }
            nrml += this.header2nrml(mag, rake, hypo_lon, hypo_lat, hypo_depth);
            for (var i = 0 ; i < this.planar_tbl_cur ; i++) {
                var data = planar[i].tbl_data;
                if (! (i in this.planar_tbl))
                    continue;
                nrml += '\
        <planarSurface strike="' + planar[i].strike + '" dip="' + planar[i].dip + '">\n\
            <topLeft lon="'     + data[0][0] + '" lat="' + data[0][1] + '" depth="' + data[0][2] + '"/>\n\
            <topRight lon="'    + data[1][0] + '" lat="' + data[1][1] + '" depth="' + data[1][2] + '"/>\n\
            <bottomLeft lon="'  + data[2][0] + '" lat="' + data[2][1] + '" depth="' + data[2][2] + '"/>\n\
            <bottomRight lon="' + data[3][0] + '" lat="' + data[3][1] + '" depth="' + data[3][2] + '"/>\n\
        </planarSurface>\n';
            }
            if (plan_n == 1) {
                nrml += '    </singlePlaneRupture>\n';
            }
            else {
                nrml += '    </multiplePlaneRupture>\n'
            }
        }
        else if (rupture_type == 'complex') {
            nrml += '    <complexFaultRupture>\n';
            nrml += this.header2nrml(mag, rake, hypo_lon, hypo_lat, hypo_depth);
            for (var i = 0 ; i < this.complex_tbl_cur ; i++) {
                if (!(i in this.complex_tbl)) {
                    continue;
                }
                complex_tbl = this.complex_tbl[i];
                data_top =  complex_tbl.top.getData();
                nrml += '\
        <complexFaultGeometry>\n\
            <faultTopEdge>\n\
                <gml:LineString>\n\
                    <gml:posList>\n';

                var data_top = complex_tbl.top.getData();
                for (var e = 0 ; e < data_top.length ; e++) {
                    nrml += '\
                        ' + data_top[e][0] + ' ' + data_top[e][1] + ' ' + data_top[e][2] + '\n';

                }
                nrml += '\
                    </gml:posList>\n\
                </gml:LineString>\n\
            </faultTopEdge>\n';

                for (var e = 0 ; e < complex_tbl.middles_cur ; e++) {
                    if (! (e in complex_tbl.middles)) {
                        continue;
                    }
                    var data_mid = complex_tbl.middles[e].getData();
                    nrml += '\
            <intermediateEdge>\n\
                <gml:LineString>\n\
                    <gml:posList>\n';
                    for (var a = 0 ; a < data_mid.length ; a++) {
                        nrml += '\
                        ' + data_mid[a][0] + ' ' + data_mid[a][1] + ' ' + data_mid[a][2] + '\n';
                    }
                    nrml += '\
                    </gml:posList>\n\
                </gml:LineString>\n\
            </intermediateEdge>\n';
                }
                nrml += '\
            <faultBottomEdge>\n\
                <gml:LineString>\n\
                    <gml:posList>\n';

                var data_bottom = complex_tbl.bottom.getData();
                for (var e = 0 ; e < data_bottom.length ; e++) {
                    nrml += '\
                        ' + data_bottom[e][0] + ' ' + data_bottom[e][1] + ' ' + data_bottom[e][2] + '\n';

                }
                nrml += '\
                    </gml:posList>\n\
                </gml:LineString>\n\
            </faultBottomEdge>\n\
        </complexFaultGeometry>\n';
            }
            nrml += '    </complexFaultRupture>\n';
        }
        else if (rupture_type == 'arbitrary') {
            nrml += '    <singlePlaneRupture>\n';
            nrml += this.header2nrml(mag, rake, hypo_lon, hypo_lat, hypo_depth);
            var data = this.arbitrary_tbl.getData();
            nrml += '\
        <planarSurface strike="' + strike + '" dip="' + dip + '">\n\
            <topLeft lon="'     + data[0][0] + '" lat="' + data[0][1] + '" depth="' + data[0][2] + '"/>\n\
            <topRight lon="'    + data[1][0] + '" lat="' + data[1][1] + '" depth="' + data[1][2] + '"/>\n\
            <bottomLeft lon="'  + data[2][0] + '" lat="' + data[2][1] + '" depth="' + data[2][2] + '"/>\n\
            <bottomRight lon="' + data[3][0] + '" lat="' + data[3][1] + '" depth="' + data[3][2] + '"/>\n\
        </planarSurface>\n';
            nrml += '    </singlePlaneRupture>\n';
        }
        nrml += '</nrml>\n';
        console.log(nrml);
        validateAndDisplayNRML(nrml, 'er', er_obj);
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
        startRows: 2,
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

    /* converter */
    $(er_obj.pfx + '#convertBtn').click(function(e) { er_obj.convert2nrml(e); });

    $('.er_gid #downloadBtn').click(function() {
    sendbackNRML(er_obj.nrml, 'er');
});

});
