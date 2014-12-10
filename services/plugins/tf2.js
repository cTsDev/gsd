var Gamedig = require('gamedig');
fs = require('fs');
pathlib = require('path');
glob = require('glob')
symlinkFolder = require('../create.js').symlinkFolder;
var log = require('../log.js');

var settings = {};
settings.name = "Team Fortress 2"
settings.stop_command = 'stop'
settings.started_trigger = 'Connection to Steam servers successful'
settings.defaultvariables = {"+map":"ctf_2fort", "-game":"tf"}
settings.exe = "./srcds_wrap",
settings.defaultPort = 27015;
settings.joined = [];

settings.query = function query(self){
	Gamedig.query(
	{
		type: 'tf2',
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
	symlinkFolder(server, "/mnt/tf2/", ["tf/cfg/*.cfg","tf/cfg/mapcycle*", "tf/cfg/motd*","tf/cfg/replay*"], callback);
}

settings.maplist = function maplist(self){
	maps = [];
	mapspath = pathlib.join(self.config.path, "tf/maps/*.bsp");

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

	glob("tf/cfg/*.cfg", {'cwd':self.config.path, 'sync':true}, function (er, files) {
	configs['core'] = configs['core'].concat(files);
	});


	return configs;
};

settings.addonlist = function addonlist(self){
	var addons = {};


	return addons;
};

module.exports = settings;
