/**
 *
 * @source: hybridge (chrome) ipt.js
 * @author: Matteo Nastasi <nastasi@alternativeoutout.it>
 * @link: https://github.com/nastasi/hybridge
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018 Matteo Nastasi
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

/* callback fired when when a web-app generated command is finished */
function on_cmd_cb(uu, msg)
{
    console.log('MSG rec: ');
    console.log(uu);
    console.log(msg);
}


var track_status_ct = 0;
function track_status_cb(uuid, msg)
{
    console.log('track_status of QGIS connection (no UI at the moment): ' + (msg.success ? '' : 'NOT ') + 'CONNECTED');
    track_status_ct++;

    if (msg.success) {
        if (typeof gem_api != 'undefined') {
            // set folders to save collected files
            function init_ls_cb(uuid, msg) {
                if (msg.success != true) {
                    console.log("FIXME PUT A PROPER MSG:");
                    console.log(msg);
                    return;
                }
                for (var i = 0 ; i < allowed_dirs.length ; i++) {
                    all_dir = allowed_dirs[i];

                    if (msg.content.indexOf(all_dir + '/') == -1) {
                        // folder not found, create it
                        function init_mkdir_cb(uuid, msg)
                        {
                            var new_dir = all_dir;
                            console.log(msg);
                        }
                        gem_api.mkdir(init_mkdir_cb, all_dir);
                    }
                }
            }
            gem_api.ls(init_ls_cb);
        }

        console.log("msg_close ...");
        gem_ipt.qgis_msg_close();
    }
    else {
        console.log("msg_open ...");
        gem_ipt.qgis_msg_open('The web-application was required by a browser with an enabled OpenQuake extension but no QGIS application is currently running, please:\nLaunch QGIS - OR - disable the OpenQuake extension clicking its icon on the browser and reloading the page.');
    }
}

function AppWeb(name)
{
    this.name = name;
    this.hybridge = new HyBridge(this);

    // TODO: add to hybridge push pop of things to do on ext_app connect/disconnect

    console.log('before');

    this.track_uuid = this.hybridge.send(
        {'command': 'hybridge_track_status'}, track_status_cb);

    // bg-side it register cb in on_open, on_close and fire back the current
    // connection status

    console.log('after');
}

AppWeb.prototype = {
    name: null,
    hybridge: null,
    track_uuid: null,
    allowed_meths: ['set_cells'],

    register: function (hybridge) {
        this.hybridge = hybridge;
    },

    /* this function is called when a malformed message is received */
    on_notstd_msg_cb: function(msg) {
        console.log("client ipt received:");
        console.log(msg);
    },

    set_cells: function(arg_a, arg_b) {
        document.getElementById("arg-a").innerHTML = arg_a;
        document.getElementById("arg-b").innerHTML = arg_b;

        return {'success': true};
    },

    send: function(msg, cmd_cb) {
        return this.hybridge.send(msg, cmd_cb);
    },

    delegate_download: function(cb, url, action, headers, data)
    {
        var uu = this.send({'command': 'delegate_download',
                            'args': [url, action, headers, data]}, cb);
        return uu;
    },

    ls: function(cb) {
        var uu = this.send({'command': 'ls_ipt_dir',
                            'args': []}, cb);
        return uu;
    },

    mkdir: function(cb, dirname) {
        var uu = this.send({'command': 'mkdir_in_ipt_dir',
                            'args': [dirname]}, cb);
        return uu;
    },

    select_file: function(cb) {
        var args = [];
        for (var i = 1 ; i < arguments.length ; i++) {
            args.push(arguments[i]);
        }
        var uu = this.send({'command': 'select_file',
                            'args': args}, cb);
        return uu;
    },

    select_and_copy_file_to_ipt_dir: function(cb) {
        var args = [];
        for (var i = 1 ; i < arguments.length ; i++) {
            args.push(arguments[i]);
        }
        var uu = this.send({'command': 'select_and_copy_file_to_ipt_dir',
                            'args': args}, cb);
        return uu;
    }
}
