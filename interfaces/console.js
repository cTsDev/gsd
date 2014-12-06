var config = require('../config.json');
var io = require('socket.io').listen(config.daemon.consoleport);
var hasPermission = require('../auth.js').hasPermission;
var GameServer = require('../services/gameprocess.js');

GameServer.prototype.initconsole = function(index){
	var self = this;
	this.console = io.of('/'+index);

	this.console.use(function(socket, next){
		var socket_token = socket.handshake.query.token;
		next();
	});

	if(hasPermission("s:socket:console", self.socket_token, index)) {
		this.on('console', function(data){
			self.console.emit('console', {'l':data.toString()});
		});
	} else {
		console.log("Failed to authenticate key at s:socket:console");
	}

	this.on('statuschange', function(data) {
		self.console.emit('statuschange', {'status':self.status});
	});

	if(hasPermission("s:socket:query", self.socket_token, index)) {
		this.on('query', function(data) {
			self.console.emit('query', {"query":self.lastquery()});
		});
	} else {
		console.log("Failed to authenticate key at s:socket:query");
	}

	if(hasPermission("s:socket:stats", self.socket_token, index)) {
		this.on('processStats', function(data) {
			self.console.emit('process', {"process":self.usagestats});
		});
	} else {
		console.log("Failed to authenticate key at s:socket:stats");
	}

	if(hasPermission("s:console", self.socket_token, index)) {
		this.console.on('sendconsole', function (command) {
			self.send(command);
		});
	} else {
		console.log("Failed to authenticate key at s:console");
	}

};
