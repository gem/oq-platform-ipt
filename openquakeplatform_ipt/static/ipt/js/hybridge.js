/**
 *
 * @source: hybridge (chrome) hybridge.js
 * @author: Matteo Nastasi <nastasi@alternativeoutout.it>
 * @link: https://github.com/nastasi/hybridge
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2018-2019 Matteo Nastasi
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

function HyBridge(app, on_msg_cb)
{
    this.app = app;
    app.register(this);
    this.on_msg_cb = on_msg_cb;
    this.connect();
}

var _hybridge_id = null;

try {
    _hybridge_id = hybridge_id;
} catch {
    console.log('no hybridge_id found');
}

HyBridge.prototype = {
    retry_time: 5000,
    abort_time: 5000,
    hybridge_id: _hybridge_id,
    app: null,
    name: null,
    port: null,
    tosend: [],
    pending: {},
    ws_status_cbs: {},
    port_close_cbs: {},

    // connect to hybridge
    connect: function() {
        clearTimeout(this.retry_tout);
        this.retry_tout = null;

        var _this = this;
        if (this.port != null) {
            this.port.close();
            this.port = null;
        }
        console.log('NAME: ' + this.app.name);
        this.url = 'ws://127.0.0.1:8040/svir/ipt';

        this.port = new WebSocket(this.url);
        this.retry_tout = null;
        this.close_tout = setTimeout(function() { console.log('TIMEOUT TRIGGERED'); _this.port.close(); },
                                     this.abort_time);
        this.port.onopen = function(event) { console.log('onopen');
                                             clearTimeout(_this.close_tout);
                                             _this.close_tout = null;
                                             _this.tosend_flush();
                                             for (var key in _this.ws_status_cbs) {
                                                 var ws_status_cb = _this.ws_status_cbs[key];
                                                 ws_status_cb(true);
                                             }
                                           };

        this.port.onmessage = function(msg) {
            console.log('onmsg: ' + msg.data);
            var hyb_msg = JSON.parse(msg.data);
            if (hyb_msg.app != 'ipt')
                return;
            return _this.receive(hyb_msg.msg)
        };

        this.port.onclose = function(msg) {
            console.log('onclose');
            for (var key in _this.ws_status_cbs) {
                console.log('update status loop');
                var ws_status_cb = _this.ws_status_cbs[key];
                ws_status_cb(false);
            }
            _this.ws_appstatus_cbs = {};
            clearTimeout(_this.close_tout);
            _this.close_tout = null;
            _this.port = null;
            _this.retry_tout = setTimeout(
                function() {
                    console.log('delayed retry to connect');
                    _this.connect();
                },
                _this.retry_time);
        }


        /*
        this.port = chrome.runtime.connect(
            this.hybridge_id, {name: this.app.name});
        this.port.onMessage.addListener(function(msg) { return _this.receive(msg)});
        */
    },

    // receive from hybridge
    receive: function(api_msg) {
        console.log("receive");
        console.log(api_msg);
        if ('uuid' in api_msg) {
            if (api_msg['uuid'] in this.pending &&
                'reply' in api_msg) {

                // reply from a command

                console.log('Reply received!');
                var uu = api_msg['uuid'];
                var reply = api_msg['reply'];
                if (this.pending[uu].cb) {
                    console.log('reply cb fired!');
                    this.pending[uu].cb(uu, reply);
                }
                if (reply.complete === undefined || reply['complete']) {
                    console.log('pending removed!');
                    delete this.pending[uu];
                }
            }
            else if ('msg' in api_msg) {
                var app_msg = api_msg['msg'];

                if (!('command' in app_msg) || !('args' in app_msg)) {
                    // FIXME reply error properly
                    return false;
                }

                // special case to manage early disconnection
                if (app_msg['command'] == 'conn_status') {
                    this.app['conn_status'].apply(
                    this.app, app_msg.args);
                    return (false);
                }

                if (this.app.allowed_meths.indexOf(
                    app_msg.command) == -1) {
                       // FIXME reply error properly2
                    return false;
                }
                console.log('pre_call');
                console.log(app_msg);
                var app_reply = this.app[app_msg.command].apply(
                    this.app, app_msg.args);

                var api_reply = {'reply': app_reply, 'uuid': api_msg.uuid};
                if (this.port == null) {
                    return false;
                }
                console.log('reply');
                console.log(api_reply);
                this.port.postMessage(api_reply);
            }
        }
        else {
            // not a reply or malformed msg, use user defined cb
            if ('on_notstd_msg_cb' in this.app) {
                this.app.on_notstd_msg_cb(api_msg);
            }
        }
    },

    _real_send: function(uu, msg, on_reply_cb) {
        this.pending[uu] = { 'msg': msg, 'cb': on_reply_cb };
        console.log('Pending[' + uu + '] = ' + this.pending[uu]);
        if (msg.msg != undefined && msg.msg.command == 'hybridge_track_status') {
            console.log('RECEIVED hybridge_track_status');
            this.hybridge_track_status({'app': 'ipt', 'msg': msg});
            return;
        }

        this.port.send(JSON.stringify({'app': 'ipt' , 'frm': 'web', 'msg':msg}));
    },

    tosend_flush: function() {
        console.log('tosend_flush: ' + this.tosend.length);
        var tosend_l = this.tosend.length;
        for (var i = 0 ; i < tosend_l ;  i++) {
            var cur_cmd = this.tosend.shift();
            this._real_send(cur_cmd.msg.uuid, cur_cmd.msg, cur_cmd.cb);
        }
    },

    hybridge_track_status: function (hyb_msg) {
        console.log('HTS');
        console.log(hyb_msg);
        var _this = this;
        console.log("TRACK_STATUS: from hybridge");
        function track_status_cb(is_conn) {
            console.log("TRACK_STATUS: " + _this.port.readyState);
            if (_this.port.readyState == WebSocket.CONNECTING) {
                return;
            }
            var is_conn = _this.port.readyState == WebSocket.OPEN;
            var api_rep = {
                    'uuid': hyb_msg.msg.uuid,
                'reply': {'success': is_conn, 'complete': false}};
            _this.receive(api_rep);
        }
        this.ws_status_cbs[hyb_msg.msg.uuid] = track_status_cb;

        this.port_close_cbs[hyb_msg.msg.uuid] = function ws_status_cbs_cleaner(uuid) {
            delete _this.ws_status_cbs[uuid];
        };
        track_status_cb(this.ws_is_connect);
    },

    // send to hybridge
    // { 'msg': {'command', 'args', [ ]}, uuid: <UUID> }
    send: function(msg, on_reply_cb) {
        console.log('send: begin');
        var uu = uuid();
        var api_msg = { 'msg': msg,
                        'uuid': uu
                        // maybe the time
                      };
        console.log(api_msg);

        // commands to manage internal status
        if (api_msg.msg.command == 'hybridge_track_status') {
            this._real_send(uu, api_msg, on_reply_cb);
            return true;
        }

        if (this.port == null)
            return false;

        var st = this.port.readyState;

        if (st == WebSocket.CLOSING || st == WebSocket.CLOSED)
            return false;

        if (st == WebSocket.OPEN) {
            console.log('send, it is open');
            this._real_send(uu, api_msg, on_reply_cb);
        }
        else if (st == WebSocket.CONNECTING) {
            console.log('send but connecting');
            this.tosend.push({ 'msg': api_msg, 'cb': on_reply_cb });
        }
        else {
            console.log('unknown status ' % st);
            return false;
        }

        return uu;
    }
}
