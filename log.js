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

log.debug = function(l, data) {

	logger.transports.file.level = 'debug';
	logger.debug(l, { meta: data });
	if(rest.debug) {

		console.log("[DEBUG] " + l);

	}

}

log.error = function(l, data) {

	logger.error(l, { meta: data });
	console.error("[ERROR] " + l);

}

log.verbose = function(l, data) {

	logger.transports.file.level = 'verbose';
	logger.verbose(l, { meta: data });
	console.log("[VERBOSE] " + l);

}

log.info = function(l, data) {

	logger.info(l, { meta: data });
	console.info("[INFO] " + l);

}

log.warn = function(l, data) {
	logger.warn(l, { meta: data });
	console.info("[WARN] " + l);
}

module.exports = log;
