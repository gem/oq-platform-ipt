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

var ex_obj = {
    pfx: "div.ex_gid ",
    o: $('div.ex_gid'),
    tbl_file: null,
    tbl: {},
    tbl_idx: 0,
    nrml: "",
    header: [],
    headerbase_len: 0,

    ctx: {
        description: null,
        costStruc: null,
        structural_costs_units: null,
        retroChbx: null,
        limitSelect: null,
        deductibleSelect: null,
        costNonStruc: null,
        nonstructural_costs_units: null,
        costContent: null,
        contents_costs_units: null,
        costBusiness: null,
        busi_inter_costs_units: null,
        perAreaSelect: null,
        area_units: null,
        occupants_day: null,
        occupants_night: null,
        occupants_transit: null,
        tags: null,
        table: null
    },

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
            ex_obj.o.find('#perArea').show();
        else
            ex_obj.o.find('#perArea').hide();
    },

    ctx_get: function (obj) {
        var ctx = obj.ctx;

        ctx.description = obj.o.find('textarea#description').val();
        ctx.costStruc = obj.o.find('select#costStruc').val();
        ctx.structural_costs_units = obj.o.find('input#structural_costs_units').val();
        ctx.retroChbx = obj.o.find('input#retroChbx').is(':checked');
        ctx.limitSelect = obj.o.find('select#limitSelect').val();
        ctx.deductibleSelect = obj.o.find('select#deductibleSelect').val();
        ctx.costNonStruc = obj.o.find('select#costNonStruc').val();
        ctx.nonstructural_costs_units = obj.o.find('input#nonstructural_costs_units').val();
        ctx.costContent = obj.o.find('select#costContent').val();
        ctx.contents_costs_units = obj.o.find('input#contents_costs_units').val();
        ctx.costBusiness = obj.o.find('select#costBusiness').val();
        ctx.busi_inter_costs_units = obj.o.find('input#busi_inter_costs_units').val();
        ctx.perAreaSelect = obj.o.find('select#perAreaSelect').val();
        ctx.area_units = obj.o.find('input#area_units').val();

        ctx.occupants_day = obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="day"]').is(':checked');
        ctx.occupants_night = obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="night"]').is(':checked');
        ctx.occupants_transit = obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="transit"]').is(':checked');
        ctx.tags = obj.o.find('#tags').tagsinput('items');
        ctx.table = obj.o.find('#table').handsontable('getInstance').getData();
    },

    ctx_save: function (obj) {
        if (window.localStorage == undefined) {
            return false;
        }
        obj.ctx_get(obj);
        var ser = JSON.stringify(obj.ctx);
        window.localStorage.setItem('gem_ipt_exposure', ser);
        console.log(ser);
    },

    ctx_load_step_gen: function(obj, step_cur, ctx) {
        function ctx_load_step() {
            wrapping4load(obj.pfx + '*', true);

            if (gl_wrapping4load_counter != 0) {
                // console.log("ctx_load_step: gl_wrapping4load_counter != 0 (" + gl_wrapping4load_counter + ")");
                gl_wrapping4load_counter = 0;
                setTimeout(ctx_load_step, 0);
                // console.log('retry later');
                return;
            }
            // else {
            //     console.log('ctx_load_step, advance');
            // }
            var changed = false;
            while (changed == false) {
                switch(step_cur) {
                case 0:
                    if (obj.o.find('textarea#description').val() != ctx.description) {
                        obj.o.find('textarea#description').val(ctx.description).change();
                        changed = true;
                    }
                    break;
                case 1:
                    if (obj.o.find('select#costStruc').val() != ctx.costStruc) {
                        obj.o.find('select#costStruc').val(ctx.costStruc).change();
                        changed = true;
                    }
                    break;
                case 2:
                    if (obj.o.find('input#structural_costs_units').val() != ctx.structural_costs_units) {
                        obj.o.find('input#structural_costs_units').val(ctx.structural_costs_units).change();
                        changed = true;
                    }
                    break;
                case 3:
                    if (obj.o.find('input#retroChbx').is(':checked') != ctx.retroChbx) {
                        obj.o.find('input#retroChbx').prop('checked', ctx.retroChbx).change();
                        changed = true;
                    }
                    break;
                case 4:
                    if (obj.o.find('select#limitSelect').val() != ctx.limitSelect) {
                        obj.o.find('select#limitSelect').val(ctx.limitSelect).change();
                        changed = true;
                    }
                    break;
                case 5:
                    if (obj.o.find('select#deductibleSelect').val() != ctx.deductibleSelect) {
                        obj.o.find('select#deductibleSelect').val(ctx.deductibleSelect).change();
                        changed = true;
                    }
                    break;
                case 6:
                    if (obj.o.find('select#costNonStruc').val() != ctx.costNonStruc) {
                        obj.o.find('select#costNonStruc').val(ctx.costNonStruc).change();
                        changed = true;
                    }
                    break;
                case 7:
                    if (obj.o.find('input#nonstructural_costs_units').val() != ctx.nonstructural_costs_units) {
                        obj.o.find('input#nonstructural_costs_units').val(ctx.nonstructural_costs_units).change();
                        changed = true;
                    }
                    break;
                case 8:
                    if (obj.o.find('select#costContent').val() != ctx.costContent) {
                        obj.o.find('select#costContent').val(ctx.costContent).change();
                        changed = true;
                    }
                    break;
                case 9:
                    if (obj.o.find('input#contents_costs_units').val() != ctx.contents_costs_units) {
                        obj.o.find('input#contents_costs_units').val(ctx.contents_costs_units).change();
                        changed = true;
                    }
                    break;
                case 10:
                    if (obj.o.find('select#costBusiness').val() != ctx.costBusiness) {
                        obj.o.find('select#costBusiness').val(ctx.costBusiness).change();
                        changed = true;
                    }
                    break;
                case 11:
                    if (obj.o.find('input#busi_inter_costs_units').val() != ctx.busi_inter_costs_units) {
                        obj.o.find('input#busi_inter_costs_units').val(ctx.busi_inter_costs_units);
                        changed = true;
                    }
                    break;
                case 12:
                    if (obj.o.find('select#perAreaSelect').val() != ctx.perAreaSelect) {
                        obj.o.find('select#perAreaSelect').val(ctx.perAreaSelect).change();
                        changed = true;
                    }
                    break;
                case 13:

                    if (obj.o.find('input#area_units').val() != ctx.area_units) {
                        obj.o.find('input#area_units').val(ctx.area_units).change();
                        changed = true;
                    }
                    break;
                case 14:
                    if (obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="day"]').is(
                        ':checked') != ctx.occupants_day) {
                        obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="day"]').prop(
                            'checked', ctx.occupants_day).change();
                        changed = true;
                    }
                    break;
                case 15:
                    if (obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="night"]').is(
                        ':checked') != ctx.occupants_night) {
                        obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="night"]').prop(
                            'checked', ctx.occupants_night).change();
                        changed = true;
                    }
                    break;
                case 16:
                    if (obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="transit"]').is(
                        ':checked') != ctx.occupants_transit) {
                        obj.o.find('div#occupantsCheckBoxes input[type="checkbox"][value="transit"]').prop(
                            'checked', ctx.occupants_transit).change();
                        changed = true;
                    }
                    break;
                case 17:
                    var eq = false;
                    var tags_cur = obj.o.find('#tags').tagsinput('items');
                    if (ctx.tags.length == tags_cur.length) {
                        eq = true;
                        for (var i = 0 ; i < ctx.tags.length ; i++) {
                            if (ctx.tags[i] != tags_cur[i]) {
                                eq = false;
                                break;
                            }
                        }
                    }
                    if (eq == false) {
                        for (var i = 0 ; i < ctx.tags.length ; i++) {
                            obj.o.find('#tags').tagsinput('add', ctx.tags[i]);
                        }
                        changed = true;
                    }
                    break;
                case 18:
                    console.log('pre-load');
                    var table = obj.o.find('#table').handsontable('getInstance');
                    table.loadData(ctx.table);
                    changed = true;
                    break;
                default:
                    console.log('dewrapping');
                    wrapping4load(obj.pfx + '*', false);
                    return;
                    break;
                }

                step_cur++;
            }
            setTimeout(ctx_load_step, 0);
        };
        return ctx_load_step;
    },

    ctx_load: function (obj) {
        if (window.localStorage == undefined) {
            return false;
        }
        var ser = window.localStorage.getItem('gem_ipt_exposure');
        if (ser == null)
            return false;

        var ctx = JSON.parse(ser);
        var load_step = 0;

        var ctx_load_step = obj.ctx_load_step_gen(obj, 0, ctx);

        setTimeout(ctx_load_step, 0);
    }
};

ex_obj.o.find('#costStruc').change(function() {
    // There is a bug in the handsontable lib where one can not
    // paste values into the table when the user has made a selection
    // from a dropdown menu. The reason for this error is that the focus
    // remains on the menu.
    // The workaround for this is to un-focus the selection menu with blur()
    // More info: https://github.com/handsontable/handsontable/issues/2973
    $(this).blur();
    ex_obj.perAreaManager($(this).val(), $(this).context.id);
    if ($(this).val() != 'none') {
        ex_obj.o.find('#structural_costs_units_div').show();
        ex_obj.o.find('#retrofittingSelect').show();
        ex_obj.o.find('#limitDiv').show();
        ex_obj.o.find('#deductibleDiv').show();
    } else {
        ex_obj.o.find('#structural_costs_units_div').hide();
        ex_obj.o.find('#retrofittingSelect').hide();
        ex_obj.o.find('#limitDiv').hide();
        ex_obj.o.find('#deductibleDiv').hide();
        // Uncheck retrofitting
        ex_obj.o.find('#retroChbx').attr('checked', false);
        // Unselect the limit & deductible
        ex_obj.o.find('#limitSelect').val('0');
        ex_obj.o.find('#deductibleSelect').val('0');
    }
});

ex_obj.o.find('#costNonStruc').change(function() {
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();

    if ($(this).val() != 'none') {
        ex_obj.o.find('#nonstructural_costs_units_div').show();
    }
    else {
        ex_obj.o.find('#nonstructural_costs_units_div').hide();
    }
    ex_obj.perAreaManager($(this).val(), $(this).context.id);
});

ex_obj.o.find('#costContent').change(function() {
    if ($(this).val() != 'none') {
        ex_obj.o.find('#contents_costs_units_div').show();
    }
    else {
        ex_obj.o.find('#contents_costs_units_div').hide();
    }
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    ex_obj.perAreaManager($(this).val(), $(this).context.id);
});

ex_obj.o.find('#costBusiness').change(function() {
    if ($(this).val() != 'none') {
        ex_obj.o.find('#busi_inter_costs_units_div').show();
    }
    else {
        ex_obj.o.find('#busi_inter_costs_units_div').hide();
    }

    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    ex_obj.perAreaManager($(this).val(), $(this).context.id);
});

ex_obj.o.find('#form').change(function() {
    // unfocus the selection menu, see the note at the costStruc change event
    $(this).blur();
    ex_updateTable();
    ex_obj.o.find('#outputDiv').hide();
});

function checkForValueInHeader(header, argument) {
    var inx = ex_obj.header.indexOf(argument);
    return inx;
}

function ex_updateTableTags(delta) {
    var tags = ex_obj.o.find('#tags').tagsinput('items');
    var tbl = ex_obj.o.find('#table').handsontable('getInstance');
    var cols_cur = tbl.countCols();
    var cols_headers = tbl.getColHeader();

    for (var i = ex_obj.headerbase_len, ti = 0 ; i < cols_cur ; i++, ti++) {
        if (cols_headers[i] != "tag_" + tags[ti]) {
            if (delta > 0)
                gem_ipt.error_msg("WARNING: tag [" + tags[ti] + "] not found");
            break;
        }
    }
    if (delta > 0) {
        ex_obj.tbl.alter('insert_col', i);
        cols_headers.push("tag_" + tags[ti]);
        ex_obj.tbl.updateSettings({'colHeaders': false});
        ex_obj.tbl.updateSettings({'colHeaders': cols_headers});
    }
    else {
        if (i == cols_cur) {
            gem_ipt.error_msg("WARNING: tag column to delete not found");
        }
        else {
            ex_obj.tbl.alter('remove_col', i);
            return true;
        }
    }
}

function ex_updateTable() {
    ex_obj.o.find('#table_file').val("");
    ex_obj.tbl_file = null;

    // Remove any existing table, if already exists
    if (ex_obj.o.find('#table').handsontable('getInstance') !== undefined) {
        ex_obj.o.find('#table').handsontable('destroy');
    }

    // Default columns
    ex_obj.header = ['id', 'longitude', 'latitude', 'taxonomy', 'number'];

    function checkForValue (argument, valueArg) {
        // Modify the table header only when the menu is altered
        // This constraint will allow Limit, Deductible and Occupant elements to be
        // added to the header
        if (argument != 'none' && valueArg === undefined) {
            if (checkForValueInHeader(ex_obj.header, argument) == -1) {
                ex_obj.header.push(argument);
            }
        // This constraint will allow structural, non-structural, contents and business
        // costs to be added to the header
        } else if (argument != 'none' && valueArg !== undefined) {
            if (checkForValueInHeader(ex_obj.header, valueArg) == -1) {
                ex_obj.header.push(valueArg);
            }
        }
    }

    // Get info from the expsure form and use it to build the table header
    ex_obj.o.find('#costStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'structural');
    });

    ex_obj.o.find('#costNonStruc option:selected').each(function() {
        checkForValue($(this).attr('value'), 'non-structural');
    });

    ex_obj.o.find('#costContent option:selected').each(function() {
        checkForValue($(this).attr('value'), 'contents');
    });

    ex_obj.o.find('#costBusiness option:selected').each(function() {
        checkForValue($(this).attr('value'), 'business');
    });

    ex_obj.o.find('#limitSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'limit');
    });

    ex_obj.o.find('#deductibleSelect option:selected').each(function() {
        checkForValue($(this).attr('value'), 'deductible');
    });

    var perAreaVisible = ex_obj.o.find('#perArea:visible').length;
    if (perAreaVisible === 1) {
        ex_obj.header.push('area');
    }

    ex_obj.o.find('#occupantsCheckBoxes input:checked').each(function() {
        ex_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    ex_obj.o.find('#retrofittingSelect input:checked').each(function() {
        ex_obj.header.push($(this).attr('value'));
        // unfocus the selection menu, see the note at the exposure costStruc change event
        $(this).blur();
    });

    ex_obj.headerbase_len = ex_obj.header.length;

    // manage tags
    var tags = ex_obj.o.find('#tags').tagsinput('items');
    for (i = 0 ; i < tags.length ; i++) {
        ex_obj.header.push("tag_" + tags[i]);
    }

    var headerLength = ex_obj.header.length;

    // Create the table
    ///////////////////////////////
    /// Exposure Table Settings ///
    ///////////////////////////////
    ex_obj.o.find('#table').handsontable({
        colHeaders: ex_obj.header,
        rowHeaders: true,
        contextMenu: true,
        startRows: 3,
        startCols: headerLength,
        maxCols: headerLength + 50,
        stretchH: 'all',
        className: "htRight"
    });
    ex_obj.tbl = ex_obj.o.find('#table').handsontable('getInstance');
    setTimeout(function() {
        return gem_tableHeightUpdate(ex_obj.o.find('#table'));
    }, 0);

    ex_obj.tbl.addHook('afterCreateRow', function() {
        return gem_tableHeightUpdate(ex_obj.o.find('#table'));
    });

    ex_obj.tbl.addHook('afterRemoveRow', function() {
        return gem_tableHeightUpdate(ex_obj.o.find('#table'));
    });
    ex_obj.tbl.addHook('afterChange', function(changes, source) {
        // when loadData is used, for performace reasons, changes are 'null'
        if (changes != null || source != 'loadData') {
            ex_obj.o.find('#table_file').val("");
            ex_obj.tbl_file = null;
        }
    });

    ex_obj.o.find('#outputText').empty();
    ex_obj.o.find('#convertBtn').show();
}

ex_obj.o.find('#downloadBtn').click(function() {
    sendbackNRML(ex_obj.nrml, 'ex');
});

if (typeof gem_api != 'undefined') {
    ex_obj.o.find('#delegateDownloadBtn').click(function() {
        delegate_downloadNRML(ex_obj.nrml, 'ex');
    });
}

ex_obj.o.find('#convertBtn').click(function() {
    var data = null;

    if (ex_obj.o.find('input#table_file')[0].files.length > 0) {
        data = ex_obj.tbl_file;
    }
    else {
        // Get the values from the table
        data = ex_obj.tbl.getData();
    }

    var not_empty_rows = not_empty_rows_get(data);

    // Check for null values
    for (var i = 0; i < not_empty_rows ; i++) {
        // tags columns can be empty
        var no_tags_col = (data[i].length < ex_obj.headerbase_len ? data[i].length : ex_obj.headerbase_len);
        for (var j = 0; j < no_tags_col ; j++) {
            var s = data[i][j] + " ";
            if (data[i][j] === null || data[i][j].toString().trim() == "") {
                output_manager('ex', "empty cell at coords (" + (i+1) + ", " + (j+1) + ")", null, null);
                return;
            }
        }
    }

    // Check for header match
    function checkHeaderMatch (argument) {
        return ex_obj.header.indexOf(argument);
    }

    var description = ex_obj.o.find('#description').val();

    var asset = '';
    var latitude = 'latitude';
    var longitude = 'longitude';
    var taxonomy = 'taxonomy';
    var number = 'number';
    var area = 'area';
    var structural = 'structural';
    var non_structural = 'non-structural';
    var contents = 'contents';
    var business = 'business';
    var day = 'day';
    var night = 'night';
    var transit = 'transit';
    var insuranceLimit = '';
    var deductible = '';
    var retrofitting = '';
    var limit = '';
    var assetId = 'id';

    // list of tags
    var asset_tags;
    var tags = ex_obj.o.find('#tags').tagsinput('items');

    // Get the the index for each header element
    var latitudeInx = checkHeaderMatch(latitude);
    var longitudeInx = checkHeaderMatch(longitude);
    var taxonomyInx = checkHeaderMatch(taxonomy);
    var numberInx = checkHeaderMatch(number);
    var areaInx = checkHeaderMatch(area);
    var structuralInx = checkHeaderMatch(structural);
    var non_structuralInx = checkHeaderMatch(non_structural);
    var contentsInx = checkHeaderMatch(contents);
    var businessInx = checkHeaderMatch(business);
    var dayInx = checkHeaderMatch(day);
    var nightInx = checkHeaderMatch(night);
    var transitInx = checkHeaderMatch(transit);
    var retrofittingInx = checkHeaderMatch('retrofitting');
    var limitInx = checkHeaderMatch('limit');
    var deductibleInx = checkHeaderMatch('deductible');
    var assetIdInx = checkHeaderMatch(assetId);

    // Pre area selection
    var areaType = "";
    var areaTypeSelected = ex_obj.o.find('#perAreaSelect').val();
    if (ex_obj.o.find('#perArea').is(":visible")) {
        areaType += '\t\t\t<area type="'+areaTypeSelected+'" unit="' + ex_obj.o.find('#area_units').val() + '" />\n';
    }

    // Cost Type
    var costType= '';
    var costTypeStruc = ex_obj.o.find('#costStruc option:selected').val();
    if (costTypeStruc !== 'none') {
        costType += '\t\t\t\t<costType name="structural" type="'+costTypeStruc+'" unit="' + ex_obj.o.find('#structural_costs_units').val() + '"/>\n';
    }

    var costTypeNonStruc = ex_obj.o.find('#costNonStruc option:selected').val();
    if (costTypeNonStruc !== 'none') {
        costType += '\t\t\t\t<costType name="nonstructural" type="'+costTypeNonStruc+'" unit="' + ex_obj.o.find('#nonstructural_costs_units').val() + '"/>\n';
    }

    var costTypeContent = ex_obj.o.find('#costContent option:selected').val();
    if (costTypeContent !== 'none') {
        costType += '\t\t\t\t<costType name="contents" type="'+costTypeContent+'" unit="' + ex_obj.o.find('#contents_costs_units').val() + '"/>\n';
    }

    var costTypeBusiness = ex_obj.o.find('#costBusiness option:selected').val();
    if (costTypeBusiness !== 'none') {
        costType += '\t\t\t\t<costType name="business_interruption" type="'+costTypeBusiness+'" unit="' + ex_obj.o.find('#busi_inter_costs_units').val() + '"/>\n';
    }

    var limitState = ex_obj.o.find('#limitSelect option:selected').val();
    if (limitState == 'absolute') {
        insuranceLimit = '\t\t\t<insuranceLimit isAbsolute="true"/>\n';
    } else if (limitState == 'relative') {
        insuranceLimit = '\t\t\t<insuranceLimit isAbsolute="false"/>\n';
    }

    var deductibleState = ex_obj.o.find('#deductibleSelect option:selected').val();
    if (deductibleState == 'absolute') {
        deductible = '\t\t\t<deductible isAbsolute="true"/>\n';
    } else if (deductibleState == 'relative') {
        deductible = '\t\t\t<deductible isAbsolute="false"/>\n';
    }

    var retrofittingSelect = ex_obj.o.find('#retrofittingSelect input:checked').val();

    // Create the asset
    for (var i = 0; i < not_empty_rows ; i++) {
        var costTypes = '\t\t\t<costTypes>\n';
        var costs ='\t\t\t\t<costs>\n';
        var occupancies = "";

        if (numberInx > -1 ) {
            number = 'number="'+ data[i][numberInx]+'"';
        } else {
            number = '';
        }
        if (latitudeInx > -1 ) {
            latitude = 'lat="'+ data[i][latitudeInx]+'"';
        } else {
            latitude = '';
        }
        if (longitudeInx > -1 ) {
            longitude = 'lon="'+ data[i][longitudeInx]+'"';
        } else {
            longitude = '';
        }
        if (taxonomyInx > -1 ) {
            taxonomy = 'taxonomy="'+ data[i][taxonomyInx]+'"';
        } else {
            taxonomy = '';
        }
        if (areaInx > -1 ) {
            area = 'area="'+ data[i][areaInx]+'"';
        } else {
            area = '';
        }
        if (assetIdInx > -1 ) {
            id = data[i][assetIdInx];
        } else {
            id = '';
        }

        // Insurance Limit
        var limitValue = '';
        if (limitState == 'absolute') {
            limitValue = ' insuranceLimit="'+data[i][limitInx]+'"';
        } else if (limitState == 'relative') {
            limitValue = ' insuranceLimit="'+data[i][limitInx]+'"';
        }

        // Retrofitted
        if (retrofittingSelect == 'retrofitting') {
            retrofitting = ' retrofitted="'+data[i][retrofittingInx]+'"';
        }

        // deductibleSelect
        var deductibleValue = '';
        if (deductibleState == 'absolute') {
            deductibleValue = ' deductible="'+data[i][deductibleInx]+'"';
        } else if (deductibleState == 'relative') {
            deductibleValue = ' deductible="'+data[i][deductibleInx]+'"';
        }

        // Economic Cost
        if (structuralInx > -1 ) {
            costTypes += '\t\t\t\t<costType name="structural" type="per_asset" unit="USD" />\n';
            costs += '\t\t\t\t\t<cost type="structural" value="'+ data[i][structuralInx]+'"'+retrofitting+deductibleValue+limitValue+'/>\n';
        }
        if (non_structuralInx > -1 ) {
            costs += '\t\t\t\t\t<cost type="nonstructural" value="'+ data[i][non_structuralInx]+'"/>\n';
        }
        if (contentsInx > -1 ) {
            costs += '\t\t\t\t\t<cost type="contents" value="'+ data[i][contentsInx]+'"/>\n';
        }
        if (businessInx > -1 ) {
            costs += '\t\t\t\t\t<cost type="business_interruption" value="'+ data[i][businessInx]+'"/>\n';
        }

        // Occupancies
        if (dayInx > -1 ) {
            occupancies += '\t\t\t\t\t<occupancy occupants="'+ data[i][dayInx]+'" period="day"/>\n';
        }
        if (nightInx > -1 ) {
            occupancies += '\t\t\t\t\t<occupancy occupants="'+ data[i][nightInx]+'" period="night"/>\n';
        }
        if (transitInx > -1 ) {
            occupancies += '\t\t\t\t\t<occupancy occupants="'+ data[i][transitInx]+'" period="transit"/>\n';
        }

        costs += '\t\t\t\t</costs>\n';
        if (occupancies != "") {
            occupancies = '\t\t\t\t<occupancies>\n' + occupancies + '\t\t\t\t</occupancies>\n';
        }

        asset_tags = "";
        for (var t_id = 0, e = ex_obj.headerbase_len ; e < ex_obj.headerbase_len + tags.length ; e++, t_id++) {
            if (data[i][e] !== null && data[i][e].length != 0) {
                asset_tags += (asset_tags == "" ? "" : " ") + tags[t_id] + "=\"" + data[i][e] + "\"";
            }
        }
        if (asset_tags.length != 0) {
            asset_tags = "\t\t\t\t<tags " + asset_tags + " />\n";
        }

        asset +=
            '\t\t\t<asset id="'+id+'" '+number+' '+area+' '+taxonomy+' >\n' +
                '\t\t\t\t<location '+longitude+' '+latitude+' />\n' +
                costs +
                occupancies +
                asset_tags +
            '\t\t\t</asset>\n';
    }

    var tagNames = "";
    if (tags.length > 0) {
        tagNames = "\t\t<tagNames>";
        for (var i = 0 ; i < tags.length ; i++) {
            tagNames += (i == 0 ? "" : " ") + tags[i];
        }
        tagNames += "</tagNames>\n";
    }
    // Create a NRML element
    var nrml =
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<nrml xmlns="http://openquake.org/xmlns/nrml/0.4">\n' +
            '\t<exposureModel id="ex1" category="buildings" taxonomySource="GEM taxonomy">\n' +
                '\t\t<description>' + description + '</description>\n' +
                '\t\t<conversions>\n' +
                    areaType +
                    '\t\t\t<costTypes>\n' +
                    costType +
                    '\t\t\t</costTypes>\n' +
                    insuranceLimit +
                    deductible +
                '\t\t</conversions>\n' +
                tagNames +
                '\t\t<assets>\n' +
                    asset +
                '\t\t</assets>\n' +
            '\t</exposureModel>\n' +
        '</nrml>\n';

    validateAndDisplayNRML(nrml, 'ex', ex_obj);
});

function exposure_tags_cb(event)
{
    if (event.type == 'beforeItemAdd') {
        if (event.item.search(/^[a-zA-Z_]\w*$/g) == -1) {
            event.cancel = true;
            gem_ipt.error_msg('Tag name not valid, must start with a letter or "_", followed optionally by letters and/or digits and/or "_".\n');
        }
    }
    else if (event.type == "itemAdded")
        return ex_updateTableTags(+1);
    else if (event.type == "itemRemoved")
        return ex_updateTableTags(-1);
    else
        return false;
}

// tab initialization
$(document).ready(function () {
    /////////////////////////////////////////////////////////
    // Manage the visibility of the perArea selection menu //
    /////////////////////////////////////////////////////////
    ex_obj.o.find('#perArea').hide();

    ex_obj.o.find('input#table_file').on(
        'change', function ex_table_file_mgmt(evt) { ipt_table_file_mgmt(evt, ex_obj, 1, -180, 180); });

    ex_obj.o.find('#retrofittingSelect').hide();
    ex_obj.o.find('#limitDiv').hide();
    ex_obj.o.find('#deductibleDiv').hide();
    ex_obj.o.find('#structural_costs_units_div').hide();
    ex_obj.o.find('#nonstructural_costs_units_div').hide();
    ex_obj.o.find('#contents_costs_units_div').hide();
    ex_obj.o.find('#busi_inter_costs_units_div').hide();
    ex_updateTable();
    ex_obj.o.find('#new_row_add').click(function() {
        ex_obj.tbl.alter('insert_row');
    });
    ex_obj.o.find('#outputDiv').hide();
    $('#absoluteSpinner').hide();
    // tag events 'itemAddedOnInit', 'beforeItemAdd' and 'beforeItemRemove' are not still managed
    ex_obj.o.find('#tags').on('beforeItemAdd', exposure_tags_cb);
    ex_obj.o.find('#tags').on('itemAdded', exposure_tags_cb);
    ex_obj.o.find('#tags').on('itemRemoved', exposure_tags_cb);
});
