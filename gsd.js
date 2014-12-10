var config = require('./config.json');

require('./interfaces/console.js');
var rest = require('./interfaces/rest.js');
require('./interfaces/ftp.js');

var servers = require('./services');
var exec = require('child_process').exec;
var log = require('./log.js');

process.argv.forEach(function(val, index, array) {

	if(val == 'debug')
	{
		rest.debug = true;
		log.info("Now running in debug mode!");
	}

});

process.on('SIGINT', function() {

	log.info("Detected hard shutdown!");
	log.info("Killing all running java processes on the server!");

	try {

		var server = servers.servers;
		server.forEach(function(s) {
			if(s.ps) {
				run = exec('kill '+ s.ps.pid, function(error, stdout, stderr) {
					log.info("Killing server with pid of "+ s.ps.pid + "out: "+ stdout);
				});
			}
		});

	} catch (ex) {
		log.error("Exception occured trying to stop all running servers.",ex.stack);
		log.warn("Please run 'killall java -9' before restarting GSD!");
	}

	log.info("All shutdown parameters complete. Stopping...\n");
	process.exit();

});
