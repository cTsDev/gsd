var date = new Date();
var fs = require('fs');
var winston = require('winston');
var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.File)({ filename: 'logs/' + date.getDay() + "-" + date.getMonth() + "-" + date.getFullYear() + "-" + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds(), level: 'info' })
	]
	});
var l = {};

l.d = false;
l.v = false;

l.debug = function(l, data) {

	var self = this;
	logger.transports.file.level = 'debug';
	logger.debug(l, { meta: data });
	if(self.d) {

		console.log("[DEBUG] " + l);

	}

};

l.error = function(l, data) {

	logger.error(l, { meta: data });
	console.error("[ERROR] " + l);

};

l.verbose = function(l, data) {

	var self = this;
	logger.transports.file.level = 'verbose';
	logger.verbose(l, { meta: data });
	if(self.v) {
		console.log("[VERBOSE] " + l);
	}

};

l.info = function(l, data) {

	logger.info(l, { meta: data });
	console.info("[INFO] " + l);

};

l.warn = function(l, data) {
	logger.warn(l, { meta: data });
	console.info("[WARN] " + l);
};
module.exports = l;
