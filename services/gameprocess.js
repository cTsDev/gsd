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

var OFF = 0; ON = 1; STARTING = 2; STOPPING = 3; CHANGING_GAMEMODE = 4;

function GameServer(config) {
	this.status = OFF;
	this.config = config;
	this.plugin = plugins[this.config.plugin + '.js'];

	this.variables = utls.mergedicts(this.plugin.defaultvariables, this.config.variables);
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


GameServer.prototype.turnon = function() {
	var self = this;
	// Shouldn't happen, but does on a crash after restart
	if (!this.status == OFF){
		// console.log("Tried to turn on but status is already : " + self.status);
		return;
	}

	this.plugin.preflight(this);

	this.ps = pty.spawn(this.exe, this.commandline, {cwd: this.config.path, uid: userid.uid(self.config.user), gid: userid.gid("gsdusers")});
	this.pid = this.ps.pid;

	this.setStatus(STARTING);
	console.log("Starting server for "+ self.config.user +" ("+ self.config.name +")");

	try {

		this.cpu_limit = parseInt(this.config.build.cpu);

		if(this.cpu_limit > 0) {

			exec('cpulimit -p ' + this.ps.pid + ' -l ' + this.cpu_limit + ' -z -d', function(error, stdout, stderr) {
				console.log("Beginning CPU Limiting (" + this.cpu_limit + "%) for process: " + this.ps.pid);
				console.log("Output: " + stdout);
			});

		}

	} catch(ex) {
		console.log("Assumed outdated GSD config. No CPU Limit defined for server!");
	}

	this.ps.on('data', function(data){
		output = data.toString();
		self.emit("console", output);
		if (self.status == STARTING){
			if (output.indexOf(self.plugin.eula_trigger) !=-1){
				self.setStatus(OFF);
				self.emit('crash');
				console.log("Server " + self.config.name + " needs to accept EULA");
			}
			if (output.indexOf(self.plugin.started_trigger) !=-1){
				self.setStatus(ON);
				self.queryCheck = setInterval(self.query, 10000, self);
				self.statCheck = setInterval(self.procStats, 10000, self);
				self.usagestats = {};
				self.querystats = {};
				self.emit('started');
				console.log("Started server for "+ self.config.user +" ("+ self.config.name +")");
			}
		}
	});

	this.ps.on('exit', function(){
		if (self.status == STOPPING){
			console.log("Stopping server for "+ self.config.user +" ("+ self.config.name +")");
			self.setStatus(OFF);
			self.emit('off');
	    	return;
		}

		if (self.status == ON || self.status == STARTING){
			console.log("Server appears to have crashed for "+ self.config.user +" ("+ self.config.name +")");
			self.setStatus(OFF);
			self.emit('off');
			self.emit('crash');
		}
	});

	this.on('crash', function(){
		console.log("Restarting server after crash for "+ self.config.user +" ("+ self.config.name +")");
		if (self.status == ON){
		self.restart();
		}
	});

	this.on('off', function clearup(){
		clearInterval(self.queryCheck);
		clearInterval(self.statCheck);
		self.usagestats = {};
		self.querystats = {};
		usage.clearHistory(self.pid);
		self.pid = undefined;
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

GameServer.prototype.killpid = function(){
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
		createUser(config.user, config.path, function cb(){callback(null);});
	},
	function(callback) {
		self.plugin.install(self, function cb(){callback(null);});
	},
	function(callback) {
		fixperms(config.user, config.path, function cb(){callback(null);});
	}]);
};

GameServer.prototype.delete = function(){
	deleteUser(this.config.user);
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
	this.once('off', function (stream) {this.turnon()});
	this.turnoff();
};

GameServer.prototype.kill = function(){
	this.ps.kill();
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
	console.log("   To: "+ loc);
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
	console.log("HERE");
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
