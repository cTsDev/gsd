mcping = require('mcquery');
fs = require('fs');
pathlib = require('path');
glob = require('glob')
copyFolder = require('../create.js').copyFolder;
var properties = require ("properties");

var async = require('async');
var Gamedig = require('gamedig');
var settings = {};


settings.name = "Minecraft"
settings.stop_command = 'stop'
settings.started_trigger = ')! For help, type "help" or "?"'
settings.defaultvariables = {"-Djline.terminal=":"jline.UnsupportedTerminal", "-Xmx":"512M", "-jar":"minecraft_server.jar"}
settings.exe = "java",
settings.defaultPort = 25565;
settings.joined = ["-Xmx", "-XX:PermSize=", "-Djline.terminal="];

settings.query = function query(self){
  Gamedig.query(
    {
        type: 'minecraft',
        host: self.gamehost,
	port: self.gameport
    },
    function(res) {
        if(res.error){
	  self.emit('crash');
	}else{
	  self.hostname = res['name'];	
	  self.numplayers = res['players'].length;
	  self.maxplayers = res['maxplayers'];
	  self.map        = res['map'];
	  self.players    = res['players'];
	  self.lastquerytime = new Date().getTime();
	}
    }
);
  
};
settings.commands = {
  'player':{
    'kick':'kick {{player}}',
    'ban':'ban {{player}}',
    'kill':'kill {{player}}',
    'clearinventory':'clearinventory {{player}}'
  }
};

settings.preflight = function(server){
  var jarPath = pathlib.join(server.config.path, server.variables['-jar']);

  if (!fs.existsSync(jarPath)){
    throw new Error("Jar doesn\'t exist : " + server.variables['-jar']);
  }
};

settings.install = function(server, callback){
  copyFolder(server, "/mnt/MC/CraftBukkit/", function(){
      var settingsPath = pathlib.join(server.config.path, "server.properties");

      if (!fs.existsSync(settingsPath)){
          callback();
      }

      var serverConfig = properties.parse(settingsPath, {path:true}, function (error, obj){

        obj['enable-query'] = 'true';
        obj['server-port'] = server.gameport;
        obj['snooper-enabled'] = 'false';

        properties.stringify(obj, {path:settingsPath}, function (error, obj){
          callback();
        });
    });
  })
};

settings.maplist = function maplist(self){
    maps = [];

    fs.readdirSync(self.config.path).forEach(function(directory){
      
      path = pathlib.join(self.config.path, directory); 
      
      if (fs.lstatSync(path).isDirectory()){
	if (fs.existsSync(pathlib.join(path, "level.dat"))){
	  maps.push(directory)
	}
      }
    });
    
    return maps;
};

settings.configlist = function configlist(self){
  var configs = {};
  configs['core'] = [];
  
  glob("*.txt", {'cwd':self.config.path, 'sync':true}, function (er, files) {
    configs['core'] = configs['core'].concat(files);
  });
  
  if (fs.existsSync(pathlib.join(self.config.path, "server.properties"))){
    configs['core'] = configs['core'].concat("server.properties")
  }
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*/*.yml", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      configs['plugins'] = files;
    });
  }
  
  return configs;
};

settings.addonlist = function addonlist(self){
  var addons = {};
  
  if (fs.existsSync(pathlib.join(self.config.path, "plugins"))){
    glob("plugins/*.jar", {'cwd':self.config.path, 'sync':true}, function (er, files) {
      addons['bukkit'] = files;
    });
  }
  
  return addons;
};

   var bukget = require('bukget')({
        url: 'api.bukget.org/',
        version: 3,
        https: false,
        rejectUnauthorizedSSL: false,
        userAgent: 'GameTainers-GSD',
        localAddress : false,
        pluginServer: 'bukkit'
   });

settings.pluginsGetCategories = function plugincategories(self, callback){
    bukget.listPluginsCategories(function(err, results){
        results.forEach(function(entry) {
            entry.id = entry.name;
        });

        callback(err, results)
   });
};

settings.pluginsByCategory = function pluginsByCategory(self, category, size, start, callback){
    bukget.pluginsByCategories(category, {size:size, start:start, fields:"description,plugin_name,server,website,versions.game_versions,versions.version,authors,versions.download"}, function(err, results){
        callback(err, results);
   });
};

settings.pluginsSearch = function pluginsSearch(self, name, size, start, callback){
   bukget.basicSearch({
      field: 'plugin_name',
      action: 'like',
      value: name,
      size: size,
      start:start,
      fields:"description,plugin_name,server,website,versions.game_versions,versions.version,authors,versions.download"
   }, function(err, results){
      callback(err, results);
   });
};

module.exports = settings;