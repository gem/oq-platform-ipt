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
    damageStates: null,
    tbl_file: null
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
    co_obj.damageStates = [];
    co_obj.damageStates = $(co_obj.pfx + "input[name='damage-states']").val().split(',');
    for (var i = 0 ; i < co_obj.damageStates ; i++) {
        co_obj.damageStates[i] = co_obj.damageStates[i].trim();
        xxx
    }

    console.log('dam_states: ');
    console.log(co_obj.damageStates);
    return 123;
    
    function checkForValue (argument, valueArg) {
        // Modify the table header only when the menu is altered
        // This constraint will allow Limit, Deductible and Occupant elements to be
        // added to the header
        if (argument != 'none' && valueArg === undefined) {
            if (checkForValueInHeader(co_obj.header, argument) == -1) {
                co_obj.header.push(argument);
            }
        // This constraint will allow structural, non-structural, contents and business
        // costs to be added to the header
        } else if (argument != 'none' && valueArg !== undefined) {
            if (checkForValueInHeader(co_obj.header, valueArg) == -1) {
                co_obj.header.push(valueArg);
            }
        }
    }

    // Get info from the expsure form and use it to build the table header
    $('.co_gid #costStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'structural');
    });

    $('.co_gid #costNonStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'non-structural');
    });

    $('.co_gid #costContent option:selected').each(function() {
        checkForValue($(this).attr('value'), 'contents');
    });

    $('.co_gid #costBusiness option:selected').each(function() {
        checkForValue($(this).attr('value'), 'business');
    });

    $('.co_gid #limitSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'limit');
    });

    $('.co_gid #deductibleSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'deductible');
    });

    var perAreaVisible = $('.co_gid #perArea:visible').length;
    if (perAreaVisible === 1) {
        co_obj.header.push('area');
    }

    $('.co_gid #occupantsCheckBoxes input:checked').each(function() {
        co_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    $('.co_gid #retrofittingSelect input:checked').each(function() {
        co_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    var headerLength = co_obj.header.length;

    // Create the table
    var container = document.getElementById('table');

    ///////////////////////////////
    /// Exposure Table Settings ///
    ///////////////////////////////
    $('.co_gid #table').handsontable({
        colHeaders: co_obj.header,
        rowHeaders: true,
        contextMenu: true,
        startRows: 3,
        startCols: headerLength,
        maxCols: headerLength,
        className: "htRight"
    });
    co_obj.tbl = $('.co_gid #table').handsontable('getInstance');
    setTimeout(function() {
        return gem_tableHeightUpdate($('.co_gid #table'));
    }, 0);

    co_obj.tbl.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate($('.co_gid #table'));
    });

    co_obj.tbl.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate($('.co_gid #table'));
    });
    co_obj.tbl.addHook('afterChange', function(changes, source) {
        // when loadData is used, for performace reasons, changes are 'null'
        if (changes != null || source != 'loadData') {
            $('.co_gid #table_file').val("");
            co_obj.tbl_file = null;
        }
    });

    $('.co_gid #outputText').empty();
    $('.co_gid #convertBtn').show();
}




$(document).ready(function () {
    co_updateTable();

    $(".co_gid input[name='damage-states']").on('change', co_updateTable);
});
