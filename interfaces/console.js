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

		if(hasPermission("s:socket:console", socket_token, index)) {
			self.console.emit('console', {'l':data.toString()});
		}

	});

	this.on('statuschange', function(data) {
		self.console.emit('statuschange', {'status':self.status});
	});

	this.on('query', function(data) {

		if(hasPermission("s:socket:query", socket_token, index)) {
			self.console.emit('query', {"query":self.lastquery()});
		}

	});

	this.on('processStats', function(data) {

		if(hasPermission("s:socket:stats", socket_token, index)) {
			self.console.emit('process', {"process":self.usagestats});
		}

	});

	this.console.on('sendconsole', function (command) {

		if(hasPermission("s:console", socket_token, index)) {
			self.send(command);
		}

	});
};
