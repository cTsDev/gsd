var restify = require('restify');
var exec = require('child_process').exec;


function executeCommand(command, callback){
  exec(command,
    function (error, stdout, stderr) {
      //console.log('stdout: ' + stdout);
      //console.log('stderr: ' + stderr);
      if (error !== null) {
	    console.log('executeCommand() error: ' + error);
      }
      callback();
  });
}

function mergedicts(){
    var sources = [].slice.call(arguments);
    var variables = {};

    sources.forEach(function (source) {
        for (var key in source) {
            variables[key] = source[key];
        }
    });

    return variables;
}
function merge(joinedCliCommands) {
    var sources = [].slice.call(arguments, 1);
    var variables = [];

    sources.forEach(function (source) {
        for (var key in source) {
            variables[key] = source[key];
        }
    });

    output = [];
    for (var key in variables) {
      if (joinedCliCommands.indexOf(key)==-1){
	output.push(key,variables[key]);
      }else{
	output.push(key + variables[key]);
      }

    }

    output = output.filter(function(n){return n});
    return output;
}

function saveconfig(config){
  fs.writeFile("config.json", JSON.stringify(config, null, 4), function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("JSON saved to " + outputFilename);
    }
  });
}

function savesettings(){
    var servers = require('./services').servers;
    var config = require('./config.json');
    config.servers = servers.allsettings();
    saveconfig(config);
}

function unknownMethodHandler(req, res) {
  if (req.method.toLowerCase() === 'options') {
    console.log('received an options method request');
    var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'Options', 'X-Access-Token']; // added Origin & X-Requested-With

    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', res.methods.join(', '));
    res.header('Access-Control-Allow-Origin', req.headers.origin);

    return res.send(204);
  }
  else
    return res.send(new restify.MethodNotAllowedError());
}

function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return '0.0.0.0';
}

exports.getIPAddress = getIPAddress;
exports.executeCommand = executeCommand;
exports.saveconfig = saveconfig;
exports.merge = merge;
exports.mergedicts = mergedicts;
exports.savesettings = savesettings;
exports.unknownMethodHandler = unknownMethodHandler;