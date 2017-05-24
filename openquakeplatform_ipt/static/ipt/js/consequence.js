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

var co_obj = {
    pfx: "div.co_gid ",
    damage_states: null,
    tbl: null,
    tbl_file: null,
    header: null
};

// tab initialization
function co_updateTable() {
    $(co_obj.pfx + '#table_file').val("");
    co_obj.tbl_file = null;

    // Remove any existing table, if already exists
    if ($(co_obj.pfx + '#table').handsontable('getInstance') !== undefined) {
        $(co_obj.pfx + '#table').handsontable('destroy');
    }

    // Default columns
    co_obj.header = ['taxonomy'];
    co_obj.damage_states = [];
    co_obj.damage_states = $(co_obj.pfx + "input[name='damage-states']").val().split(',');
    for (var i = 0 ; i < co_obj.damage_states.length ; i++) {
        co_obj.damage_states[i] = co_obj.damage_states[i].trim();
        co_obj.header.push(co_obj.damage_states[i] + "<br>mean");
        co_obj.header.push(co_obj.damage_states[i] + "<br>std dev");
    }

    var headerLength = co_obj.header.length;

    // Create the table

    ///////////////////////////////
    /// Exposure Table Settings ///
    ///////////////////////////////
    $(co_obj.pfx + '#table').handsontable({
        colHeaders: co_obj.header,
        rowHeaders: true,
        contextMenu: true,
        startRows: 3,
        startCols: headerLength,
        maxCols: headerLength,
        className: "htRight"
    });
    co_obj.tbl = $(co_obj.pfx + '#table').handsontable('getInstance');
    setTimeout(function() {
        return gem_tableHeightUpdate($(co_obj.pfx + '#table'));
    }, 0);

    co_obj.tbl.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate($(co_obj.pfx + '#table'));
    });

    co_obj.tbl.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate($(co_obj.pfx + '#table'));
    });
    co_obj.tbl.addHook('afterChange', function(changes, source) {
        // when loadData is used, for performace reasons, changes are 'null'
        if (changes != null || source != 'loadData') {
            $(co_obj.pfx + '#table_file').val("");
            co_obj.tbl_file = null;
        }
    });

    $(co_obj.pfx + '#outputText').empty();
    $(co_obj.pfx + '#convertBtn').show();
}

$('.co_gid #downloadBtn').click(function() {
    sendbackNRML(co_obj.nrml, 'co');
});

$(co_obj.pfx + '#convertBtn').click(function() {
    var data = null
    if ($(co_obj.pfx + 'input#table_file')[0].files.length > 0) {
        data = co_obj.tbl_file;

        if (table_with_headers(data, 1, null, null)) {
            data = data.slice(1);
        }
    }
    else {
        // Get the values from the table
        data = co_obj.tbl.getData();
    }

    // Check for null values
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            var s = data[i][j] + " ";
            if (data[i][j] === null || data[i][j].toString().trim() == "" || parseInt(data[i][j]) < 0.0) {
                output_manager('ex', "empty or negative cell at coords (" + (i+1) + ", " + (j+1) + ")", null, null);
                return;
            }
        }
    }

    var description = $(co_obj.pfx + "textarea[name='descr']").val();
    var asset = $(co_obj.pfx + "input[name='asset-cat']").val();
    var loss_cat = $(co_obj.pfx + "select#lossCategory").val();
    // damage states use co_obj attribute
    var prob_dist = $(co_obj.pfx + "select#prob_distrib").val();

/*
    <consequenceFunction id="Concrete" dist="LN">
      <params ls="slight" mean="0.04" stddev="0.00"/>
      <params ls="moderate" mean="0.31" stddev="0.00"/>
      <params ls="extreme" mean="0.60" stddev="0.00"/>
      <params ls="collapse" mean="1.00" stddev="0.00"/>
    </consequenceFunction>
*/
    // Create consequences
    var cons_func = ""
    for (var i = 0 ; i < data.length ; i++) {
        cons_func += '\t\t<consequenceFunction id="' + data[i][0] + '" dist="' + prob_dist + '">\n';
        for (var e = 1 ; e < data[i].length ; e+=2) {
            cons_func += '\t\t\t<params ls="' + co_obj.damage_states[(e - 1) / 2] + '" mean="' + parseFloat(data[i][e]) + '" stddev="' + parseFloat(data[i][e+1])+ '"/>\n'
        }
        cons_func += "\t\t</consequenceFunction>\n"
    }

    // Create a NRML element
    var nrml =
        '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<nrml xmlns="http://openquake.org/xmlns/nrml/0.5">\n' +
        '\t<consequenceModel id="' + 'consequence-from-IPT' + '" assetCategory="' + asset + '" lossCategory="' + loss_cat + '">\n' +
        '\t\t<description>' + description + '</description>\n' +
        '\t\t<limitStates>' + co_obj.damage_states.join(' ') + '</limitStates>\n' +
        cons_func +
        '\t</consequenceModel>\n' +
        '</nrml>\n';
    validateAndDisplayNRML(nrml, 'co', co_obj);
});

$(document).ready(function () {

    $(co_obj.pfx + 'input#table_file').on(
        'change', function ex_table_file_mgmt(evt) { ipt_table_file_mgmt(evt, co_obj); });

    co_updateTable();
    $(co_obj.pfx + '#new_row_add').click(function() {
        co_obj.tbl.alter('insert_row');
    });

    $(co_obj.pfx + "input[name='damage-states']").on('change', co_updateTable);

    $(co_obj.pfx + '#outputDiv').hide();
    $('#absoluteSpinner').hide();
});
