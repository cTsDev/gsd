var config = require('./config.json');

require('./interfaces/console.js');
require('./interfaces/rest.js');
require('./interfaces/ftp.js');

var servers = require('./services');
var exec = require('child_process').exec;

process.on('SIGINT', function() {

	console.log("Detected hard shutdown!");
	console.log("Killing all running java processes on the server!");

	try {

		var server = servers.servers;
		server.forEach(function(s) {
			if(s.ps) {
				run = exec('kill '+ s.ps.pid, function(error, stdout, stderr) {
					console.log("Killing server with pid of "+ s.ps.pid + "out: "+ stdout);
				});
			}
		});

	} catch (ex) {
		console.log(ex.stack);
		console.log("Exception occured trying to stop all running servers.");
		console.log("Please run 'killall java -9' before restarting GSD!");
	}

	console.log("All shutdown parameters complete. Stopping...\n");
	process.exit();

});