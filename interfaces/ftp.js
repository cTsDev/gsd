var ftpd = require('ftpd');
var config = require('../config.json');
var ftpconfig = config.interfaces.ftp;
var request = require('request');
var hasPermission = require('../auth.js').hasPermission;

String.prototype.rsplit = function(sep, maxsplit) {
    var split = this.split(sep);
    return maxsplit ? [ split.slice(0, -maxsplit).join(sep) ].concat(split.slice(-maxsplit)) : split;
};

var options = {
  //pasvPortRangeStart: 4000,
  //pasvPortRangeEnd: 5000,
  getInitialCwd: function(user) {
    return "/"
  },
  getRoot: function(connection) {
    split = connection.username.rsplit("-",1);
    username = split[0];
    serverId =  split[1];
    return config.servers[serverId].path;
  }
};

var server = new ftpd.FtpServer(ftpconfig.host, options);

server.on('client:connected', function(conn) {
  var username;
  var serverId;
  var fullUsername;
  console.log('Client connected from ' + conn.socket.remoteAddress);

  conn.on('command:user', function(user, success, failure) {
    if (user.indexOf("-") == -1){
        failure()
    }

    split = user.rsplit("-",1);
    username = split[0];
    serverId =  split[1];

    try {
        serverId = parseInt(serverId);
    }catch(ex){
        failure();
    }

    fullUsername = user;

    success()
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
                              failure();
                          }
                      }else{
                          failure();
                      }
                  } catch (ex) {
                      failure();
                  }
              }else{
                  failure();
              }
          });
      }else{
          if (hasPermission("ftp", username, serverId)){
              success(username + "-" + serverId);
          }else{
              failure();
          }
      }
  });

});

server.listen(ftpconfig.port);
