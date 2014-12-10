var Gamedig = require('gamedig');
fs = require('fs');
pathlib = require('path');
glob = require('glob')
symlinkFolder = require('../create.js').symlinkFolder;
var log = require('../../log.js');


var settings = {};
settings.name = "Garry's mod"
settings.stop_command = 'stop'
settings.started_trigger = 'Connection to Steam servers successful'
settings.defaultvariables = {"+map":"gm_construct", "-game":"garrysmod"}
settings.exe = "./srcds_wrap",
settings.defaultPort = 27015;
settings.joined = [];

settings.query = function query(self){
	Gamedig.query(
	{
		type: 'garrysmod',
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

settings.preflight = function(server){

}

settings.install = function(server, callback){
	server.updatevariables({"-port":server.gameport}, false);
	symlinkFolder(server, "/mnt/gmod/", ["garrysmod/cfg/*.cfg","garrysmod/cfg/mapcycle*", "garrysmod/maps/*.nav", "garrysmod/cfg/motd*"], callback);
}

settings.maplist = function maplist(self){
	maps = [];
	mapspath = pathlib.join(self.config.path, "garrysmod/maps/*.bsp");

	if (fs.existsSync(mapspath)){
		glob("*.bsp", {'cwd':mapspath, 'sync':true}, function (er, files) {
	maps = files
		});
	}

	return maps;
};

settings.configlist = function configlist(self){
	var configs = {};
	configs['core'] = [];

	glob("garrysmod/cfg/*.cfg", {'cwd':self.config.path, 'sync':true}, function (er, files) {
	configs['core'] = configs['core'].concat(files);
	});


	return configs;
};

settings.addonlist = function addonlist(self){
	var addons = {};


	return addons;
};

module.exports = settings;
