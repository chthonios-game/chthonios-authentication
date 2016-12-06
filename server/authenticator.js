var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var config = require("./config.js").config;

var decoratedCallback = function(fn, fncontext) {
	return function() {
		fn.apply(fncontext, arguments);
	}
};

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function(str) {
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(str) {
		return this.slice(-str.length) == str;
	};
}

function Authenticator(properties) {

	this.tokens = [];
	this.profiles = [];
	this.servers = [];
	this.server = null;

	this.toString = function() {
		return "AuthenticatorService { port: " + this.port + " }";
	}

	this.init = function() {
		this.port = config.authenticator.port;
		this.server = http.createServer(decoratedCallback(this.handleRequest, this));
		this.server.listen(this.port, decoratedCallback(function() {
			console.log(this.toString(), "listening: port", this.port);
		}, this));
	}

	this.respond = function(response, code, payload) {
		response.writeHead(code, {
			'Content-Type' : 'application/json',
			'Access-Control-Allow-Origin' : config.authenticator.security.acao
		});
		payload.status = code;
		response.end(JSON.stringify(payload));
		if (payload != undefined && payload != null && payload.message != undefined)
			console.log("server response", code, payload.message)
		else
			console.log("server response", code);
	}

	this.checkHash = function(user, keystr) {
		var ch = keystr.split(":");

		if (ch[0] != "plain") {
			var hasher = crypto.createHash(ch[0]);
			hasher.update(user);
			user = hasher.digest("hex");
		}

		return (ch[1] == user);
	}

	this.handleRequest = function(request, response) {
		var resource = request.url.toString();
		if (resource.startsWith("/"))
			resource = resource.substring(1);
		var fullpath = resource.split("/");

		if (fullpath[0] == "v1") {
			this.respond(response, 400, {
				message : 'Schema v1 has been deprecated'
			});
			return;
		}

		if (fullpath[0] == "v2" && fullpath.length >= 2) {
			if (request.method != "POST") {
				this.respond(response, 400, {
					message : 'Unsupported v1 request method'
				});
				return;
			}
			console.log("object request", fullpath);
			var payload = "";
			request.on("data", decoratedCallback(function(chunk) {
				payload += chunk.toString();
			}, this));

			request.on("end", decoratedCallback(function() {
				var data = querystring.parse(payload);
				console.log("object body", data);

				if (config.authenticator.security.accessPassword !== null) {
					if (!this.checkHash(data.secret, config.authenticator.security.accessPassword))
						return this.respond(response, 403, {
							message : 'Secret incorrect'
						});
				}

				var command = fullpath[1];

				if (command == "ping") {
					this.respond(response, 200, {
						servername : config.authenticator.servername,
						serverport : config.authenticator.port
					});
				} else if (command == "heartbeat") {
					if (config.authenticator.security.announcePassword !== null) {
						if (!this.checkHash(data.announceSecret, config.authenticator.security.announcePassword))
							return this.respond(response, 403, {
								message : 'Announce secret incorrect'
							});
					}
					if (data.token === undefined || data.token === null)
						return this.respond(response, 498, {
							message : 'Token required'
						});
					if (data.servername === undefined || data.servername === null)
						return this.respond(response, 498, {
							message : 'Server name required'
						});
					if (data.playercount === undefined || data.playercount === null)
						return this.respond(response, 498, {
							message : 'Player count required'
						});

					if (data.instance !== undefined && data.instance !== null) {
						var isvr = this.servers[parseInt(data.instance)];
						if (isvr === null)
							return this.respond(response, 498, {
								message : 'Server not registered'
							});
						if (isvr.token !== data.token)
							return this.respond(response, 498, {
								message : 'Invalid registration token'
							});
						isvr.servername = data.servername;
						isvr.playercount = data.playercount;
						isvr.serveraddr = data.serveraddr;
						isvr.serverport = data.serverport;
						isvr.lastmodify = new Date().getTime();
						this.respond(response, 200, {
							instance : isvr.instance,
							created : false,
							updated : true
						});
					} else {
						var svrdef = {
							token : data.token,
							servername : data.servername,
							playercount : data.playercount,
							serveraddr : data.serveraddr,
							serverport : data.serverport,
							lastmodify : new Date().getTime()
						};
						this.servers.push(svrdef);
						svrdef.instance = this.servers.length - 1;
						this.respond(response, 200, {
							instance : svrdef.instance,
							created : true,
							update : false
						});
					}
				} else if (command == "realms") {
					var realmlist = [];
					for (var i = 0; i < this.servers.length; i++) {
						var isvr = this.servers[i];
						if (isvr == null)
							continue;
						realmlist.push([ isvr.servername, isvr.playercount, isvr.serveraddr, isvr.serverport ]);
					}
					this.respond(response, 200, {
						live : realmlist.length,
						realms : realmlist
					});
				} else if (command == "authenticate") {
					if (data.token == undefined || data.token == null || data.username == undefined || data.username == null
							|| data.password == undefined || data.password == null) {
						this.respond(response, 498, {
							message : 'Invalid request'
						});
						return;
					}
					console.log("authentication request", data.token);

					if (this.profiles[data.username] == undefined || this.profiles[data.username] == null) {
						this.profiles[data.username] = {
							username : data.username,
							password : data.password
						}
					}

					var profile = this.profiles[data.username];
					if (data.username != profile.username || data.password != profile.password) {
						this.respond(response, 498, {
							message : 'Incorrect username + password'
						});
					} else {
						this.tokens[data.token] = {
							username : data.username,
							secret : data.password
						};

						this.respond(response, 200, {
							username : this.tokens[data.token].username,
							token : data.token,
							secret : this.tokens[data.token].secret
						});
					}
				} else if (command == "validate") {
					var profile = this.tokens[data.token];
					if (profile == undefined || profile == null) {
						this.respond(response, 498, {
							message : 'Token invalid'
						});
						return;
					}

					if (data.secret == profile.secret) {
						this.respond(response, 200, {
							username : profile.username,
							token : data.token
						});
					} else
						this.respond(response, 498, {
							message : 'Secret mismatch'
						});
				} else
					this.respond(response, 400, {
						message : 'Unsupported v1 command'
					});
			}, this));
		} else
			this.respond(response, 400, {
				message : 'Unsupported authentication scheme'
			});
	}
}

var server = new Authenticator();
server.init();