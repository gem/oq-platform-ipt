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

function table_with_headers(arr, field_idx, min_val, max_val)
{
    var spy = arr[0][field_idx];

    if (spy.match(/[^.\d]/)) {
        return true;
    }

    if (min_val !== null) {
        if (parseFloat(spy) < min_val)
            return true;
    }

    if (max_val !== null) {
        if (parseFloat(spy) > max_val)
            return true;
    }

    return false;
}

function not_empty_rows_get(data)
{
    for (var i = data.length - 1 ; i >= 0 ; i--) {
        for (var e = 0 ; e < data[i].length ; e++) {
            if (data[i][e] === null || data[i][e].toString().trim() == "")
                continue;

            if (data[i][e].toString().trim() != "") {
                return (i + 1);
            }
        }
    }
    return data.length;
}

function gem_tableHeightUpdate($box) {
    /* console.log('heightupdate'); */
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

    /* console.log('h_prev: ' + h_prev + 'h: ' + h + ' $box: ' + $box.find('div.wtHolder').find('div.wtHider').height()); */
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

function csvsplit(s, sep)
{
    var st = 0, ct = 0, cur = "";
    var ret = [];

    for (var i = 0 ; i < s.length ; i++) {
        if (st == 0) {
            if (s[i] == '"') {
                st = 1;
                continue;
            }
            if (s[i] == sep) {
                ret.push(cur);
                cur = "";
                ct += 1;
            }
            else
                cur += s[i];
        }
        if (st == 1) {
            if (s[i] == '"') {
                if (i < (s.length - 1) && s[i+1] == '"') {
                    i += 1;
                    cur += '"';
                }
                else {
                    st = 0;
                }
            }
            else {
                cur += s[i];
            }
        }
    }
    if (cur != "") {
        ret.push(cur);
    }
    return ret;
}

function separator_identify(s)
{
    var st = 0;
    var seps = ";	,";

    for (var i = 0 ; i < s.length ; i++) {
        if (st == 0) {
            if (s[i] == '"') {
                st = 1;
                continue;
            }
            var idx = seps.indexOf(s[i]);
            if (idx != -1)
                return (seps[idx]);
        }
        else if(st == 1) {
            if (s[i] == '"') {
                st = 0;
            }
        }
    }
    // fallback to comma
    return ",";
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

var ipt_table_file_mgmt = function(evt, that, field_idx, min_val, max_val) {
    if (evt.target.files.length == 0) {
        that.tbl_file = null;
        target.value = "";
        return;
    }

    var target = evt.target;
    var file = evt.target.files[0];

    if (file) {
        var cols_n = that.tbl.countCols();
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            that.tbl_file = [];
            var rows = evt.target.result.replace(/\r\n*/g, '\n').split('\n');
            var separator = null;
            for (var i = 0 ; i < rows.length ; i++) {
                if (rows[i] == "") {
                    continue;
                }
                that.tbl_file.push([]);
                if (separator == null) {
                    separator = separator_identify(rows[i]);
                }
                var cols = csvsplit(rows[i], separator);
                if (cols.length != cols_n) {
                    // row haven't correct number of columns
                    alert("row #" + (i+1) + " haven't correct number of columns, received: " + cols.length + " expected: " + cols_n + "\n[" + rows[i] + "]");
                    that.tbl_file = null;
                    target.value = "";
                    return;
                }

                for (var e = 0 ; e < cols.length ; e++) {
                    cols[e] = cols[e].toString().trim();
                    that.tbl_file[i].push(cols[e]);
                }
            }

            if (table_with_headers(that.tbl_file, field_idx, min_val, max_val)) {
                that.tbl_file = that.tbl_file.slice(1);
            }

            that.tbl.alter('remove_row', 1, 10000000);
            var data = [];
            for (var i = 0 ; i < (4 < that.tbl_file.length ? 4 : that.tbl_file.length)  ; i++) {
                if (i > 0)
                    that.tbl.alter('insert_row');
                data.push(that.tbl_file[i]);
            }

            if (4 < that.tbl_file.length) {
                that.tbl.alter('insert_row');
                var points = data.push([]);
                for (var e = 0 ; e < cols_n ; e++) {
                    data[4][e] = "...";
                }
            }

            that.tbl.loadData(data);
        }
        reader.onerror = function (evt) {
            alert('import file failed');
            that.tbl_file = null;
            target.value = "";
        }
    }
    else {
        alert('File not found.');
    }
};

var ipt_table_vect_file_mgmt = function(evt, that, field_idx, min_val, max_val) {
    var target = evt.target;
    var tbl_id = $(target).attr("data_gem_id");

    if (evt.target.files.length == 0) {
        that.tbl_file[tbl_id] = null;
        target.value = "";
        return;
    }

    var file = evt.target.files[0];

    if (file) {
        var cols_n = that.tbl[tbl_id].countCols();
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
            that.tbl_file[tbl_id] = [];
            var rows = evt.target.result.replace(/\r\n*/g, '\n').split('\n');
            var separator = null;
            for (var i = 0 ; i < rows.length ; i++) {
                if (rows[i] == "") {
                    continue;
                }
                that.tbl_file[tbl_id].push([]);
                if (separator == null) {
                    separator = separator_identify(rows[i]);
                }
                var cols = csvsplit(rows[i], separator);
                if (cols.length != cols_n) {
                    // row haven't correct number of columns
                    alert("row #" + (i+1) + " haven't correct number of columns, received: " + cols.length + " expected: " + cols_n + "\n[" + rows[i] + "]");
                    that.tbl_file[tbl_id] = null;
                    target.value = "";
                    return;
                }

                for (var e = 0 ; e < cols.length ; e++) {
                    cols[e] = cols[e].toString().trim();
                    that.tbl_file[tbl_id][i].push(cols[e]);
                }
            }

            if (table_with_headers(that.tbl_file[tbl_id], field_idx, min_val, max_val)) {
                that.tbl_file[tbl_id] = that.tbl_file[tbl_id].slice(1);
            }

            that.tbl[tbl_id].alter('remove_row', 1, 10000000);
            var data = [];
            for (var i = 0 ; i < (4 < that.tbl_file[tbl_id].length ? 4 : that.tbl_file[tbl_id].length)  ; i++) {
                if (i > 0)
                    that.tbl[tbl_id].alter('insert_row');
                data.push(that.tbl_file[tbl_id][i]);
            }

            if (4 < that.tbl_file[tbl_id].length) {
                that.tbl[tbl_id].alter('insert_row');
                var points = data.push([]);
                for (var e = 0 ; e < cols_n ; e++) {
                    data[4][e] = "...";
                }
            }

            that.tbl[tbl_id].loadData(data);
        }
        reader.onerror = function (evt) {
            alert('import file failed');
            that.tbl_file[tbl_id] = null;
            target.value = "";
        }
    }
    else {
        alert('File not found.');
    }
};


var _gem_api_ctx_index = 10000;
function gem_api_ctx_get_object_id(object)
{
    window['_gem_api_ctx_' + _gem_api_ctx_index] = object;
    var object_id = _gem_api_ctx_index.toString();
    _gem_api_ctx_index += 1;

    return object_id;
}

function gem_api_ctx_get_object(object_id)
{
    return window['_gem_api_ctx_' + object_id];
}

function gem_api_ctx_del(object_id)
{
    delete(window['_gem_api_ctx_' + object_id])
}

function ipt_cookie_builder(cookies)
{
    var ret = {'name': 'Cookie', 'value': ''};
    var pre = '';

    for (i in cookies) {
        ret.value += pre + cookies[i].name + "=" + cookies[i].value;
        pre = "; ";
    }
    return ret;
}

var gl_wrapping4load_counter = 0;

function wrapping4load(match, is_wrapping) {
    var $items = $(match);

    for (var id = 0 ; id < $items.length ; id++) {
        var events = $._data($items[id], 'events');
        if (events !== undefined) {
            // console.log($items[id]);
            // console.log(events);

            // console.log('find one');
            for (event_id in events) {
                event_list = events[event_id];
                for (var i = 0 ; i < event_list.length ; i++) {
                    if (is_wrapping) {
                        // console.log('set wrapper');
                        if ('is_wrapper' in event_list[i].handler) {
                            // console.log('already wrapped');
                            continue;
                        }
                        function pre_wrapper() {
                            var orig_handler = event_list[i].handler;
                            function wrapper(ev) {
                                gl_wrapping4load_counter++;
                                // console.log('fired!');
                                // console.log(this);
                                orig_handler.call(this, ev);
                                // console.log(orig_handler);
                            }
                            wrapper.is_wrapper = true;
                            wrapper.orig_handler = event_list[i].handler;
                            event_list[i].handler = wrapper;
                        };
                        pre_wrapper();
                    }
                    else {
                        if ('is_wrapper' in event_list[i].handler) {
                            // console.log('removed wrapper');
                            event_list[i].handler = event_list[i].handler.orig_handler;
                        }
                    }
                }
            }
        }
    }
}
