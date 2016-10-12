function basename(filename)
{
    return filename.split(/[\\/]/).pop();
}

function uniqueness_add(files_list, label, fname)
{
    files_list.push({label: label, filename: basename(fname) });
}

function uniqueness_check(files_list)
{
    for (var i = 0 ; i < files_list.length - 1; i++) {
        for (var e = i+1 ; e < files_list.length ; e++) {
            // empty filename case already managed
            if (files_list[i].filename == '')
                continue;
            if (files_list[i].filename == files_list[e].filename) {
                return "Selected '" + files_list[i].label + "' and '" +
                    files_list[e].label + "' have the same name.\n";
            }
        }
    }
    return "";
}


function gem_tableHeightUpdate($box) {
    /* try { */
    var tbl = $box.handsontable('getInstance');
    tbl.render();
    /* } catch (e) { */
    /* console.log($box); */
    /* debugger; */
    /* } */

    var h_min = 100, h_max = 300;
    var h_prev = $box.height();
    var h = $box.find('div.wtHolder').find('div.wtHider').height() + 30;

    /* console.log('h_prev: ' + h_prev + 'h: ' + h); */
    if (h_prev <= h_min && h > h_min ||
        h_prev > h_min && h_prev < h_max ||
        h_prev >= h_max && h < h_max) {
        $box.css('height', (h > h_max ? h_max : (h < h_min ? h_min : h)) + 'px');
        tbl.render();
        /* console.log('recomputed'); */
    }
}

function gem_capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var gem_ipt = {
    exception: function(message) {
        this.message = message;
        this.name = "IPTException";
    },

    isInt: function(n) {
        return !isNaN(n) && n % 1 === 0 && !(n === null);
    },

    isFloat: function(n) {
        return  !/^\s*$/.test(n) && !isNaN(n) && !(n === null);
    },

    check_val: function (name, val, oper)  {
        // inspection if needed with: console.log("Name: " + name + "  Val: " + val + " Oper: " + oper);
        /* is empty ? */
        if (val === "")
            throw new this.exception("'" + name + "' field is empty.");

        /* type check */
        if (oper.substr(0,6) == "float-") {
            if (!this.isFloat(val))
                throw new this.exception("'" + name + "' field isn't a float number (" + val + ").");
        }
        else if (oper.substr(0,4) == "int-") {
            if (!this.isInt(val))
                throw new this.exception("'" + name + "' field isn't an integer number (" + val + ").");
        }

        if (oper == "float-eq") {
            var second = parseFloat(arguments[3]);

            val = parseFloat(val);
            if (!(val == second))
                throw new this.exception("'" + name + "' field not equal to " + second + " (" + val + ").");
            return val;
        }
        if (oper == "float-ge") {
            var second = parseFloat(arguments[3]);

            val = parseFloat(val);
            if (!(val >= second))
                throw new this.exception("'" + name + "' field is less than " + second + " (" + val + ").");
            return val;
        }
        else if (oper == "float-gt") {
            var second = parseFloat(arguments[3]);

            val = parseFloat(val);
            if (!(val > second))
                throw new this.exception("'" + name + "' field isn't great than " + second + " (" + val + ").");
            return val;
        }
        else if (oper == "float-range-in-in") {
            var second = parseFloat(arguments[3]);
            var third = parseFloat(arguments[4]);
            if (!(second <= val && val <= third))
                throw new this.exception("'" + name + "' field not in [" + second + ", " + third + "] range (" + val + ").");
            return val;
        }
        else if (oper == "float-range-out-in") {
            var second = parseFloat(arguments[3]);
            var third = parseFloat(arguments[4]);
            if (!(second < val && val <= third))
                throw new this.exception("'" + name + "' field not in (" + second + ", " + third + "] range (" + val + ").");
            return val;
        }
        else if (oper == "tab-check") {
            var descr_cols = arguments[3], descr_rows = null;
            if (arguments.length > 4) {
                var descr_rows = arguments[4];
            }
            for (var i = 0 ; i < (descr_rows == null ? val.length : descr_rows.length) ; i++) {
                if (val[i].length != descr_cols.length)
                    throw new this.exception("Wrong number of columns in '" + name + "' at line " +
                                             (i + 1) +". Expected " +
                                             descr_cols.length + " received " + val[i].length);
                for (e = 0 ; e < val[i].length ; e++) {
                    try {
                        var args = [ descr_cols[e][0], val[i][e] ].concat(descr_cols[e].slice(1));
                        var ret = this.check_val.apply(this, args);
                    } catch(exc) {
                        throw new this.exception("Error in '" + name + "' at row "
                                                 + (descr_rows == null ? (i + 1) : "'" + descr_rows[i] + "'")
                                                 + " with message:\n" + exc.message);
                    }
                }
            }
            if (descr_rows != null) {
                if (i != descr_rows.length) {
                    throw new this.exception("Error in '" + name + "': the number of rows isn't " +
                                             descr_rows.length + ".");
                }
            }
        }
        else {
            throw new this.exception("Operator '" + oper + "' not yet implemented.");
        }
    },

    error_msg: function(msg) {
        $( "#dialog-message" ).html(msg.replace(/\n/g, "<br/>"));
        $( "#dialog-message" ).dialog({
            dialogClass: 'gem-jqueryui-dialog',
            modal: true,
            width: '600px',
            buttons: {
                Ok: function() {
                    $(this).dialog( "close" );
                }
            }
        });
    }
}

var ipt_table_file_mgmt = function(evt, that) {
    if (evt.target.files.length == 0)
        return;

    var file = evt.target.files[0];

    if (file) {
        var cols_n = that.tbl.countCols();
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            that.tbl_file = [];
            var rows = evt.target.result.split('\n');
            for (var i = 0 ; i < rows.length ; i++) {
                if (rows[i] == "") {
                    continue;
                }
                that.tbl_file.push([]);
                var cols = rows[i].split(',');
                if (cols.length != cols_n) {
                    // row haven't correct number of columns
                    alert("row #" + (i+1) + " haven't correct number of columns, received: " + cols.length + " expected: " + cols_n + "\n[" + rows[i] + "]");
                    continue;
                }

                for (var e = 0 ; e < cols.length ; e++) {
                    that.tbl_file[i].push(cols[e]);
                }
            }
            that.tbl.alter('remove_row', 3, 10000000);
            var data = [];
            for (var i = 0 ; i < 3 ; i++) {
                data.push([]);
                for (var e = 0 ; e < cols_n ; e++) {
                    data[i].push("");
                }
            }
            that.tbl.loadData(data);
        }
        reader.onerror = function (evt) {
            alert('import file failed');
        }
    }
    else {
        alert('File not found.');
    }
}
