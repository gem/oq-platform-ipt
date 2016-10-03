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
    /*} catch (e) {
      console.log($box);
      debugger;
      } */

    /* console.log('gem_tableHeight');
    /  console.log(tbl);
       console.log($box);
       console.log($(tbl.container).find('div.wtHolder').find('div.wtHider')); */

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


function isInt(n){
    return !isNaN(n) && n % 1 === 0;
}

function isFloat(n) {
    return  !/^\s*$/.test(n) && !isNaN(n);
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
