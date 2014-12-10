var fs = require('fs');
var path = require('path');
var ftpd = require('ftpd');
var config = require('../config.json');
var ftpconfig = config.interfaces.ftp;
var request = require('request');
var hasPermission = require('../auth.js').hasPermission;
var log = require('../log.js');

var tlsConfig = [];

String.prototype.rsplit = function(sep, maxsplit) {
	var split = this.split(sep);
	return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
};

if(fs.existsSync('ftps.pem') && fs.existsSync('ftps.key')){

	try {
		tlsConfig['key'] = fs.readFileSync('ftps.key')
	} catch(ex) {
		log.error('Unable to read ftps.key file', ex);
		process.exit()
	}

	try {
		tlsConfig['pem'] = fs.readFileSync('ftps.pem')
	} catch(ex) {
		log.error('Unable to read ftps.pem file', ex);
		process.exit()
	}

}else{
	log.error(' ** WARNING: Missing ftps.pem and/or ftps.key **');
	process.exit();
}

if(typeof ftpconfig.use_ssl == null) {
	ftpconfig.use_ssl = true;
}

var options = {
	pasvPortRangeStart: 4000,
	pasvPortRangeEnd: 5000,
	getInitialCwd: function(user) {
		return "/"
	},
	logLevel: -1,
	tlsOnly: ftpconfig.use_ssl,
	tlsOptions: {
		key: tlsConfig.key,
		cert: tlsConfig.pem
	},
	allowUnauthorizedTls: true,
	getRoot: function(connection) {
		split = connection.username.rsplit("-",1);
		username = split[0];
		serverId =  split[1];
		return config.servers[serverId].path;
	}
};

try {
	var server = new ftpd.FtpServer(ftpconfig.host, options);
} catch(ex) {
	log.error("Exception occured trying to start FTP server.", ex);
	process.exit()
}

process.on('uncaughtException', function (err) {
	return;
});

server.on('error', function (error) {
	log.error('FTP Server error', error);
});

server.on('client:connected', function(conn) {
	var username;
	var serverId;
	var fullUsername;

	conn.on('command:user', function(user, success, failure) {
		if (user.indexOf("-") == -1){
			failure()
		}

		fullUsername = user;
		split = user.rsplit("-",1);
		username = split[0];
		serverId =  split[1];

		try {
			serverId = parseInt(serverId);
		}catch(ex){
			failure();
		}

		success();
	});

	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	conn.on('command:pass', function(pass, success, failure) {
		if (ftpconfig.authurl != null){
			request.post(ftpconfig.authurl, {form:{username:fullUsername, password:pass}}, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					try {
						res = JSON.parse(body);
						if (res.authkey != null){
							if (hasPermission("s:ftp", res.authkey, serverId)){
								success(username + "-" + serverId);
							}else{
								log.error("(FTP) Failed to authenticate: authentication key does not have permission for this action.");
								failure();
							}
						}else{
							log.error("(FTP) Failed to authenticate: missing authentication key.");
							failure();
						}
					} catch (ex) {
						log.error("(FTP) Failed to authenticate", ex);
						failure();
					}
				}else{
					log.error("(FTP) Failed to authenticate", error);
					failure();
				}
			});
		}else{
			log.error("(FTP) Failed to authenticate: no authentication URL provided.");
			failure();
		}
	});

});

server.listen(ftpconfig.port);
