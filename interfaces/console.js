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

	this.on('console', function(data){

		if(hasPermission("s:socket:console", self.socket_token, index)) {
			self.console.emit('console', {'l':data.toString()});
		} else {
			console.log("Failed to authenticate key at s:socket:console");
		}

	});

	this.on('statuschange', function(data) {
		self.console.emit('statuschange', {'status':self.status});
	});

	this.on('query', function(data) {

		if(hasPermission("s:socket:query", self.socket_token, index)) {
			self.console.emit('query', {"query":self.lastquery()});
		} else {
			console.log("Failed to authenticate key at s:socket:query");
		}

	});

	this.on('processStats', function(data) {

		if(hasPermission("s:socket:stats", self.socket_token, index)) {
			self.console.emit('process', {"process":self.usagestats});
		} else {
			console.log("Failed to authenticate key at s:socket:stats");
		}

	});

	this.console.on('sendconsole', function (command) {

		if(hasPermission("s:console", self.socket_token, index)) {
			self.send(command);
		} else {
			console.log("Failed to authenticate key at s:console");
		}

	});

};
