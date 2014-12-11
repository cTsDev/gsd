var spawn = require('child_process').spawn;
var pty = require('pty.js');
var util = require("util");
var events = require("events");
var merge = require("../utls.js").merge;
var plugins = require("./plugins.js").plugins;
var download = require('download');
var usage = require('usage');
var pathlib = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var createUser = require("./create.js").createUser;
var deleteUser = require("./create.js").deleteUser;
var fixperms = require("./create.js").fixperms;
var getIPAddress = require("../utls.js").getIPAddress;
var savesettings = require("../utls.js").savesettings;
var async = require('async');
var utls = require("../utls.js");
var userid = require('userid');
var targz = require('tar.gz');
var unzip = require('unzip');
var log = require('../log.js');

var OFF = 0; ON = 1; STARTING = 2; STOPPING = 3; CHANGING_GAMEMODE = 4;


function GameServer(config) {
	this.status = OFF;
	this.config = config;
	this.plugin = plugins[this.config.plugin + '.js'];

	this.variables = utls.mergedicts(this.plugin.defaultvariables, this.config.variables);
	this.keys = this.config.keys;
	this.build = this.config.build;
	this.commandline = merge(this.plugin.joined, this.variables);
	this.exe = this.plugin.exe;

	if ('gameport' in this.config && this.config.gameport != 0) {
		this.gameport = this.config.gameport
	}else{
		this.gameport = this.plugin.defaultPort;
	}


	if ('gamehost' in this.config && this.config.gamehost != "") {
		this.gamehost = this.config.gamehost
	}else{
		this.gamehost = getIPAddress();
	}
}

util.inherits(GameServer, events.EventEmitter);

GameServer.prototype.updatevariables = function(variables, replace){
	if (replace == true){
		this.variables = utls.mergedicts(this.plugin.defaultvariables, variables);
	}else{
		this.variables = utls.mergedicts(this.plugin.defaultvariables, this.variables, variables);
	}
	this.config.variables = this.variables;
	this.commandline = merge(this.plugin.joined, this.variables);
	savesettings();
};

GameServer.prototype.updatekeys = function(keys){

	this.keys = utls.mergedicts(this.keys, keys);

	var keyList = {};
	for(var i in this.keys) {
		if(this.keys[i].length !== 0) {
			keyList[i] = this.keys[i];
		}
	}

	this.config.keys = keyList;
	savesettings();

};

GameServer.prototype.updatebuild = function(build){

	this.build = utls.mergedicts(this.build, build);

	this.config.build = this.build;
	savesettings();

};

GameServer.prototype.preflight = function(callback) {
	var self = this;
	log.verbose("Running preflight for " + this.config.user);
	try{
		this.plugin.preflight(this, userid.uid(this.config.user), userid.gid(this.config.user), this.config.path);
	} catch(ex) {
		log.error("Pre-flight for server " + self.config.name +" failed!", ex.stack);
		throw Error(ex.message);
	}
	log.verbose("Completed preflight.");
	callback();
};

GameServer.prototype.turnon = function(callback) {
	var self = this;
	// Shouldn't happen, but does on a crash after restart
	if (!this.status == OFF){
		return;
	}

	log.verbose("Fixing Permissions before server boot.");
	fixperms(config.user, config.path, function cb(){});
	log.verbose("Permissions Fixed before server boot.");

	this.ps = pty.spawn(this.exe, this.commandline, {cwd: this.config.path, uid: userid.uid(self.config.user), gid: userid.gid("gsdusers")});
	this.pid = this.ps.pid;

	this.setStatus(STARTING);
	log.verbose("Starting server for "+ self.config.user +" ("+ self.config.name +")");

	try {

		this.cpu_limit = parseInt(this.config.build.cpu);

		if(this.cpu_limit > 0) {

			log.verbose("Starting CPU Limit for process " + this.pid);
			this.cpu = pty.spawn('cpulimit',  ['-p', this.ps.pid, '-z', '-l', this.cpu_limit]);
			log.verbose("CPULimit set to " + this.cpu_limit);

			this.cpu.on('close', function(code) {
				log.warn("Child process 'cpulimit' for process " + this.ps.pid, code);
			});

		}

	} catch(ex) {
		log.warn("No CPU Limit defined for server. Running process with unlimited CPU time.", ex);
	}

	callback();

	this.ps.on('data', function(data){
		output = data.toString();
		self.emit("console", output);
		if (self.status == STARTING){
			if (output.indexOf(self.plugin.eula_trigger) !=-1){
				log.warn("Server " + self.config.name + " needs to accept EULA");
				self.setStatus(OFF);
				self.emit('off');
				self.emit('crash');
			}
			if (output.indexOf(self.plugin.started_trigger) !=-1){

				self.setStatus(ON);
				self.queryCheck = setInterval(self.query, 10000, self);
				self.statCheck = setInterval(self.procStats, 10000, self);
				self.usagestats = {};
				self.querystats = {};
				self.emit('started');
				log.verbose("Started server for "+ self.config.user +" ("+ self.config.name +")");

			}
		}
	});

	this.ps.on('exit', function(){
		if (self.status == STOPPING){
			log.verbose("Stopping server for "+ self.config.user +" ("+ self.config.name +")");
			self.setStatus(OFF);
			self.emit('off');
	    	return;
		}

		if (self.status == ON || self.status == STARTING){
			log.warn("Server appears to have crashed for "+ self.config.user +" ("+ self.config.name +")");
			self.setStatus(OFF);
			self.emit('off');
			self.emit('crash');
		}
	});

	this.on('crash', function(){
		log.warn("Restarting server after crash for "+ self.config.user +" ("+ self.config.name +")");
		if (self.status != ON){
			self.restart();
		}
	});

	this.on('off', function clearup(){
		log.verbose("Stopping Server " + self.config.name);
		clearInterval(self.queryCheck);
		clearInterval(self.statCheck);
		self.usagestats = {};
		self.querystats = {};
		usage.clearHistory(self.pid);
		self.pid = undefined;
		self.cpu = undefined;
		log.verbose("Sever Stopped");
	});
};

GameServer.prototype.turnoff = function(){
	var self = this;
	clearTimeout(self.queryCheck);
	if (!self.status == OFF){
		self.setStatus(STOPPING);
		self.ps.write('stop\r');
	}else{
		self.emit('off');
	}
};

GameServer.prototype.kill = function(){
	var self = this;
	clearTimeout(self.queryCheck);
	if (!self.status == OFF){
		self.setStatus(STOPPING);
		self.ps.kill();
	}else{
		self.emit('off');
	}
};

GameServer.prototype.create = function(){
	var config = this.config;
	var self = this;

	async.series([
	function(callback) {
		log.verbose("Creating user " + config.user);
		createUser(config.user, config.path, function cb(){callback(null);});
		log.verbose("User Created");
	},
	function(callback) {
		log.verbose("Installing Plugin");
		self.plugin.install(self, function cb(){callback(null);});
		log.verbose("Plugin Installed");
	},
	function(callback) {
		log.verbose("Fixing Permissions");
		fixperms(config.user, config.path, function cb(){callback(null);});
		log.verbose("Permissions Fixed");
	}]);
};

GameServer.prototype.delete = function(){
	log.verbose("Deleting Server " + this.config.name);
	this.kill();
	deleteUser(this.config.user, function cb(){callback(null);});
	log.verbose("Server Deleted")
};

GameServer.prototype.setStatus = function(status){
	this.status = status;
	this.emit('statuschange');
	return this.status;
};


GameServer.prototype.query = function(self){
	r = self.plugin.query(self);
	self.emit('query');
	return r;
};

GameServer.prototype.taillog = function(lines){
	return this.plugin.getTail(this.config, lines);
};

GameServer.prototype.procStats = function(self){
	usage.lookup(self.pid, {keepHistory: true}, function(err, result) {
		// TODO : Return as % of os.totalmem() (optional)
		// TODO : Return as % of ram max setting
		self.usagestats = {"memory": result.memory, "cpu": Math.round(result.cpu)};
		self.emit('processStats');
	});
};

GameServer.prototype.lastquery = function(self){
	return {"type":this.type, "name":this.hostname, "version":this.version, "plugins":this.plugins, "numplayers":this.numplayers, "maxplayers":this.maxplayers, "players":this.players}
};

GameServer.prototype.configlist = function(){
	return this.plugin.configlist(this);
};

GameServer.prototype.maplist = function(){
	return this.plugin.maplist(this);
};

GameServer.prototype.addonlist = function(){
	return this.plugin.addonlist(this);
};

GameServer.prototype.info = function(){
	return {"query":this.querystats, "config":this.config, "status":this.status, "pid":this.pid, "process":this.usagestats, "variables":this.variables}
};


GameServer.prototype.restart = function(){
		this.once('crash', function (stream) {this.turnon()});
		this.turnoff();
};

GameServer.prototype.send = function(data){
	if (this.status == ON || this.status == STARTING){
		this.ps.write(data + '\n');
	}else{
		throw new Error('Server turned off');
	}
};

GameServer.prototype.console = function Console(){
	//TODO : Remove?
};


GameServer.prototype.readfile = function readfile(f){
	file = pathlib.join(this.config.path, pathlib.normalize(f));
	return fs.readFileSync(file, "utf8");
};

GameServer.prototype.returnFilePath = function returnFilePath(f){
	file = pathlib.join(this.config.path, pathlib.normalize(f));
	return file;
};

GameServer.prototype.dir = function dir(f){
	var self = this;
	folder = pathlib.join(this.config.path, pathlib.normalize(f));
	listing = fs.readdirSync(folder);
	files = [];

	listing.forEach(function (fileName){
		if (fileName[0] == ".") return;

		stat = fs.statSync(pathlib.join(folder, fileName));

		if (stat.isFile())
			filetype = "file";
		else if (stat.isDirectory())
			filetype = "folder";
		else if (stat.isSymbolicLink())
			filetype = "symlink";
		else
			filetype = "other";

		file = {"name":fileName, "ctime":stat.ctime, "mtime":stat.mtime, "size":stat.size, "filetype":filetype};
		files.push(file);
	});

	return files;

};

GameServer.prototype.writefile = function writefile(f, contents) {

	file = pathlib.join(this.config.path, pathlib.normalize(f));
	fs.writeFile(file, contents);

};

GameServer.prototype.downloadfile = function downloadfile(url, path) {

	path = pathlib.join(this.config.path, pathlib.normalize(path));
	download(url, path);
	return 'ok';

};

GameServer.prototype.zipfile = function zipfile(file) {

	path = pathlib.join(this.config.path, pathlib.normalize(file));
	loc = pathlib.join(this.config.path, pathlib.normalize(file+".tar.gz"));
	compress = new targz().compress(path, loc, function(err) {if(err) console.log(err); } );

};

GameServer.prototype.unzipfile = function unzipfile(style, file) {

	path = pathlib.join(this.config.path, pathlib.normalize(file));

	if(style == ".zip") {

		fs.createReadStream(path).pipe(unzip.Extract({ path: path.slice(0,-file.length) }));

	}else if(style == ".gz") {

		decompress = new targz().extract(path, path.slice(0,-7), function(err){
			if(err)
				console.log(err);
		});

	}

};

GameServer.prototype.deletefile = function Console(){
	//TODO : Remove?
};

GameServer.prototype.plugincategories = function(callback){
	this.plugin.pluginsGetCategories(this, callback);
};

GameServer.prototype.pluginsByCategory = function(category, size, start, callback){
	this.plugin.pluginsByCategory(this, category, size, start, callback);
};

GameServer.prototype.pluginsSearch = function(name, size, start, callback){
	this.plugin.pluginsSearch(this, name, size, start, callback);
};

GameServer.prototype.getgamemodes = function getgamemode(res){
	managerlocation = pathlib.join(__dirname,"gamemodes",self.config.plugin,"gamemodemanager");
	child = exec(managerlocation + ' getlist',
	function (error, stdout, stderr) {
	res.send(JSON.parse(stdout));
	});
};

GameServer.prototype.installgamemode = function installgamemode(){
	managerlocation = pathlib.join(__dirname,"gamemodes",self.config.plugin,"gamemodemanager");
	if (self.status == ON){
		self.turnoff();
	}
	self.setStatus(CHANGING_GAMEMODE);
	console.log(self.config.path)
	installer = spawn(managerlocation, ["install", "craftbukkit", self.config.path], {cwd: self.config.path});

	console.log(managerlocation);

	installer.stdout.on('data', function(data){
	if (data == "\r\n"){return}
		console.log(data);
		self.emit('console',data);
	});

	installer.on('exit', function(){
		self.setStatus(OFF);
	});
};

GameServer.prototype.removegamemode = function Console(){
	self.ps = spawn(self.exe, [self.config.path], {cwd: self.config.path});
};
module.exports = GameServer;
