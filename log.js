var date = new Date();
var fs = require('fs');
var rest = require('./interfaces/rest.js');
var winston = require('winston');
var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({ filename: 'logs/'+date.getDay() + "-" + date.getMonth() + "-" + date.getFullYear() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds(), level: 'error' })
	]
	});

function log(){
}

log.debug = function(l) {
	logger.transports.file.level = 'debug';
	logger.debug(l);
	if(rest.debug)
	{
		console.info(l);
	}
}

log.error = function(l) {
	logger.error(l);
	console.error(l);
}

log.verbose = function(l) {
	logger.transports.file.level = 'verbose';
	logger.verbose(l);
}

log.info = function(l) {
	logger.info(l);
	console.error(l);
}

module.exports = log;
