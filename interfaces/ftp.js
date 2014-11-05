var fs = require('fs');
var path = require('path');
var ftpd = require('ftpd');
var config = require('../config.json');
var ftpconfig = config.interfaces.ftp;
var request = require('request');
var hasPermission = require('../auth.js').hasPermission;

String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
};

if(!fs.existsSync('../ftps.key') || !fs.existsSync('../ftps.pem')){
    console.log(' ** WARNING: NO KEY OR CERT FILE DETECTED! **');
}

var options = {
    pasvPortRangeStart: 4000,
    pasvPortRangeEnd: 5000,
    getInitialCwd: function(user) {
        return "/"
    },
    tlsOptions: {
        key: fs.readFileSync('../ftps.key'),
        cert: fs.readFileSync('../ftps.pem')
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
    console.log("Exception occured trying to start FTP server.");
    cosole.log(ex);
    failure();
}

server.on('error', function (error) {
    console.log('FTP Server error:', error);
});

server.on('client:connected', function(conn) {
    var username;
    var serverId;
    var fullUsername;

    console.log('Client connected from ' + conn.socket.remoteAddress);

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

    conn.on('command:pass', function(pass, success, failure) {
        if (ftpconfig.authurl != null){
            request.post(ftpconfig.authurl, {form:{username:fullUsername, password:pass}}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    try {
                        res = JSON.parse(body);
                        if (res.authkey != null){
                            if (hasPermission("ftp", res.authkey, serverId)){
                                success(username + "-" + serverId);
                            }else{
                                console.log("Failed to authenticate: authenticate key does not have permission for this action.");
                                failure();
                            }
                        }else{
                            console.log("Failed to authenticate: missing authentication key.");
                            failure();
                        }
                    } catch (ex) {
                        console.log("Failed to authenticate: "+ ex);
                        failure();
                    }
                }else{
                    console.log("Failed to authenticate: Server returned error code ("+ response.statusCode +").");
                    failure();
                }
            });
        }else{
            console.log("Failed to authenticate: no authentication URL provided.");
            failure();
        }
    });

});

server.listen(ftpconfig.port);