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
        $(er_obj.pfx + ' div[name="rupture"] div').hide();
        $(er_obj.pfx + ' div[name="rupture"] div[name="' + rupt_cur + '"').show();
    },

    tbl: {},
    tbl_idx: 0,
    nrml: "",
    header: [],

    // perAreaRefCount is used to keep track of any time perArea is selected
    perAreaRefCount: {
        costStruc : false,
        costNonStruc : false,
        costContent : false,
        costBusiness : false
    },

    perAreaUpdate: function(selectedValue, element) {
        // Manage all define cost elements that are using perArea
        if (selectedValue == 'per_area') {
            this.perAreaRefCount[element] = true;
        }
        else {
            this.perAreaRefCount[element] = false;
        }
    },

    perAreaIsVisible: function() {
        // If perAreaRefCountManager returnes false then we can hide the area
        // option from the form

        for(var k in this.perAreaRefCount) {
            if (this.perAreaRefCount[k] === true) {
                return true;
            }
        }
        return false;
    },

    perAreaManager: function(selectedValue, element) {
        // Manage all define cost elements that are using perArea
        this.perAreaUpdate(selectedValue, element);

        if (this.perAreaIsVisible())
            $('.er_gid #perArea').show();
        else
            $('.er_gid #perArea').hide();
    }
};

$('.er_gid #costStruc').change(function() {
    // There is a bug in the handsontable lib where one can not
    // paste values into the table when the user has made a selection
    // from a dropdown menu. The reason for this error is that the focus
    // remains on the menu.
    // The workaround for this is to un-focus the selection menu with blur()
    // More info: https://github.com/handsontable/handsontable/issues/2973
    $(this).blur();
    er_obj.perAreaManager($(this).val(), $(this).context.id);
    if ($(this).val() != 'none') {
        $('.er_gid #structural_costs_units_div').show();
        $('.er_gid #retrofittingSelect').show();
        $('.er_gid #limitDiv').show();
        $('.er_gid #deductibleDiv').show();
    } else {
        $('.er_gid #structural_costs_units_div').hide();
        $('.er_gid #retrofittingSelect').hide();
        $('.er_gid #limitDiv').hide();
        $('.er_gid #deductibleDiv').hide();
        // Uncheck retrofitting
        $('.er_gid #retroChbx').attr('checked', false);
        // Unselect the limit & deductible
        $(".er_gid #limitSelect").val('0');
        $(".er_gid #deductibleSelect").val('0');
    }
});

$('.er_gid #costNonStruc').change(function() {
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();

    if ($(this).val() != 'none') {
        $('.er_gid #nonstructural_costs_units_div').show();
    }
    else {
        $('.er_gid #nonstructural_costs_units_div').hide();
    }
    er_obj.perAreaManager($(this).val(), $(this).context.id);
});

$('.er_gid #costContent').change(function() {
    if ($(this).val() != 'none') {
        $('.er_gid #contents_costs_units_div').show();
    }
    else {
        $('.er_gid #contents_costs_units_div').hide();
    }
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    er_obj.perAreaManager($(this).val(), $(this).context.id);
});

$('.er_gid #costBusiness').change(function() {
    if ($(this).val() != 'none') {
        $('.er_gid #busi_inter_costs_units_div').show();
    }
    else {
        $('.er_gid #busi_inter_costs_units_div').hide();
    }

    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    er_obj.perAreaManager($(this).val(), $(this).context.id);
});

$('.er_gid #form').change(function() {
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    er_updateTable();
    $('.er_gid #outputDiv').hide();
});

function er_checkForValueInHeader(header, argument) {
    var inx = er_obj.header.indexOf(argument);
    return inx;
}

function er_updateTable() {
    // Remove any existing table, if already exists
    if ($('.er_gid #table').handsontable('getInstance') !== undefined) {
        $('.er_gid #table').handsontable('destroy');
    }

    // Default columns
    er_obj.header = [ 'Longitude', 'Latitude', 'Vs30', 'Vs30 Type', 'Depth 1 km/s', 'Depth 2.5 km/s'];

    function checkForValue (argument, valueArg) {
        // Modify the table header only when the menu is altered
        // This constraint will allow Limit, Deductible and Occupant elements to be
        // added to the header
        if (argument != 'none' && valueArg === undefined) {
            if (er_checkForValueInHeader(er_obj.header, argument) == -1) {
                er_obj.header.push(argument);
            }
        // This constraint will allow structural, non-structural, contents and business
        // costs to be added to the header
        } else if (argument != 'none' && valueArg !== undefined) {
            if (er_checkForValueInHeader(er_obj.header, valueArg) == -1) {
                er_obj.header.push(valueArg);
            }
        }
    }

    // Get info from the expsure form and use it to build the table header
    $('.er_gid #costStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'structural');
    });

    $('.er_gid #costNonStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'non-structural');
    });

    $('.er_gid #costContent option:selected').each(function() {
        checkForValue($(this).attr('value'), 'contents');
    });

    $('.er_gid #costBusiness option:selected').each(function() {
        checkForValue($(this).attr('value'), 'business');
    });

    $('.er_gid #limitSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'limit');
    });

    $('.er_gid #deductibleSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'deductible');
    });

    var perAreaVisible = $('.er_gid #perArea:visible').length;
    if (perAreaVisible === 1) {
        er_obj.header.push('area');
    }

    $('.er_gid #occupantsCheckBoxes input:checked').each(function() {
        er_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    $('.er_gid #retrofittingSelect input:checked').each(function() {
        er_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    var headerLength = er_obj.header.length;

    // Create the table
    var container = document.getElementById('table');

    ///////////////////////////////
    /// Exposure Table Settings ///
    ///////////////////////////////
    $('.er_gid #table').handsontable({
        colHeaders: er_obj.header,
        rowHeaders: true,
        contextMenu: true,
        startRows: 3,
        startCols: headerLength,
        maxCols: headerLength,
        className: "htRight"
    });
    er_obj.tbl = $('.er_gid #table').handsontable('getInstance');
    setTimeout(function() {
        return gem_tableHeightUpdate($('.er_gid #table'));
    }, 0);

    er_obj.tbl.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate($('.er_gid #table'));
    });

    er_obj.tbl.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate($('.er_gid #table'));
    });

    $('.er_gid #outputText').empty();
    $('.er_gid #convertBtn').show();
}

$('.er_gid #downloadBtn').click(function() {
    sendbackNRML(er_obj.nrml, 'er');
});

$('.er_gid #convertBtn').click(function() {
    // Get the values from the table
    var tab_data = er_obj.tbl.getData();

    var pfx = '.er_gid #table';

    for (var i = 0; i < tab_data.length; i++) {
        for (var j = 0; j < tab_data[i].length; j++) {
            if (tab_data[i][j] === null || tab_data[i][j].toString().trim() == "") {
                var error_msg = "empty cell detected at table coords (" + (i+1) + ", " + (j+1) + ")";
                output_manager('er', error_msg, null, null);
                return;
            }
        }
    }

    var sites = '';
    // Check for null values
    for (var i = 0; i < tab_data.length; i++) {
        sites += '\t<site lon="' + tab_data[i][0] + '" lat="' + tab_data[i][1] + '" vs30="' + tab_data[i][2] +
             '" vs30Type="' + tab_data[i][3] + '" z1pt0="' + tab_data[i][4] + '" z2pt5="' + tab_data[i][5] +'"/>\n';
    }

    // Create a NRML element
    var nrml = '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<nrml xmlns:gml="http://www.opengis.net/gml" xmlns="http://openquake.org/xmlns/nrml/0.4">\n' +
            '  <siteModel>\n' +
            sites +
            '  </siteModel>\n' +
        '</nrml>\n';

    validateAndDisplayNRML(nrml, 'er', er_obj);
});

// tab initialization
$(document).ready(function () {
    /////////////////////////////////////////////////////////
    // Manage the visibility of the perArea selection menu //
    /////////////////////////////////////////////////////////
    $(er_obj.pfx + ' input[name="rupture_type"]').click(er_obj.rupture_type_manager);
});
