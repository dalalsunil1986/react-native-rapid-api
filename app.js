
"use strict";

import Base64 from './Base64'

export default function RapidAPI(e, t)
{
	this.project = e, this.key = t, this.getBaseURL = function ()
	{
		return "https://rapidapi.io/connect"
	}, this.blockURLBuilder = function (e, t)
	{
		return this.getBaseURL() + "/" + e + "/" + t
	}, this.callbackBaseURL = function ()
	{
		return "https://webhooks.rapidapi.com"
	}, this.call = function (e, t, o)
	{
		var n, s                   = {},
		    r = new XMLHttpRequest,
		    a = this.blockURLBuilder(e, t);
		r.open("POST", a, !0), r.setRequestHeader("Authorization", "Basic " + Base64.btoa(this.project + ":" + this.key)), r.setRequestHeader("User-Agent", "JavascriptSDK"), Object.keys(o).reduce(function (e, t)
		{
			return e || o[t] instanceof File
		}, !1) ? (n = new FormData, Object.keys(o).forEach(function (e)
		{
			n.append(e, o[e])
		})) : (n = JSON.stringify(o) ||
		{}, r.setRequestHeader("Content-Type", "application/json"), r.setRequestHeader("Accept", "application/json")), r.onload = function ()
		{
			var e;
			try
			{
				e = JSON.parse(this.response)
			}
			catch (t)
			{
				e = this.response
			}
			200 === this.status && e.hasOwnProperty("outcome") ? s.hasOwnProperty(e.outcome) && s[e.outcome](e.payload): s.hasOwnProperty("error") && s.error(e)
		}, r.send(n);
		var i = {
			on: function (e, t)
			{
				if ("function" != typeof t || "string" != typeof e) throw "Invalid event key and callback. Event key should be a string and callback should be a function.";
				return s[e] = t, i
			}
		};
		return i
	}, this.listen = function (e, t, o)
	{
		var n = {},
		    s = function (e)
			{
				return n[e] || function () {}
			},
			       r             = e + "." + t + "_" + this.project + ":" + this.key,
			       a             = new XMLHttpRequest,
			       i             = this.callbackBaseURL() + "/api/get_token?user_id=" + r;
			a.open("GET", i, !0), a.setRequestHeader("Content-Type", "application/json"), a.setRequestHeader("Authentication", "Basic " +Base64.btoa(this.project + ":" + this.key)), a.onload = function ()
		{
			var e;
			if (200 === this.status) try
			{
				"object" != typeof this.response && (e = JSON.parse(this.response))
			}
			catch (e)
			{
				return
			}
			var t        = e.token,
			    n        = "wss://webhooks.rapidapi.com/socket/websocket?token=" + t,
			    r        = new WebSocket(n);
			    r.onopen = function (e)
			{
				var n = {
					topic  : "users_socket:" + t,
					event  : "phx_join",
					ref    : "1",
					payload: o
				};
				r.send(JSON.stringify(n))
			}, r.onerror = s("error"), r.onclose = s("close"), r.onmessage = function (e)
			{
				try
				{
					var t = JSON.parse(e.data);
					if ("phx_reply" === t.event && "ok" === t.payload.status) return void s("join")();
					t.payload.body && t.payload.body.msg && "error" === t.payload.body.msg.status ? s("error")(t.payload.body.msg): s("message")(t.payload.body.text)
				}
				catch (e)
				{
					s("error")()
				}
			}, setInterval(function ()
			{
				var e = {
					topic  : "phoenix",
					event  : "heartbeat",
					ref    : "1",
					payload: 
					{}
				};
				r.send(JSON.stringify(e))
			}, 3e4)
		}, a.send();
		var c = {
			on: function (e, t)
			{
				if ("function" != typeof t) throw "Callback must be a function.";
				if ("string" != typeof e) throw "Event must be a string.";
				return n[e] = t, c
			}
		};
		return c
	}
}