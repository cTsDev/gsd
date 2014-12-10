var exec = require('child_process').exec;
var async = require('async');
var pathlib = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var format = require('util').format;
var executeCommand = require('../utls').executeCommand;
var userid = require('userid');

function createUser(username, home, callback){

	try {

		console.log("   Adding user "+ username );
		command = format("useradd -m -d %s -s /bin/false -G gsdusers %s", home, username);
		executeCommand(command, callback);
		console.log("   ... done");

	} catch(ex) {
		console.log("Unable to create a user on the system.");
	}

}

function deleteUser(username, callback){
	console.log("[INFO] Removing user " + username + "====");
	command = format("deluser --remove-home %s", username);
	console.log("[INFO] User Removed");
	// @TODO: Actually remove the server from config.json...
	executeCommand(command, callback)
}


function linkDir(from_path, to_path, callback){
	command = format("cp -s -u -R %s/* %s", from_path, to_path);
	executeCommand(command, callback)
}


function fixperms(user, path, callback){
	console.log("   Fixing file permissions...");
	executeCommand("chown -R "+ user +":gsdusers "+ path, callback);
	console.log("   ... done");
};

function replaceFiles(base_folder, files, backing_folder, callback){
	finalfiles = [];

	files.forEach(function(file) {
	isWildcard = (file.indexOf("*") != -1);
	if (isWildcard == true){
		glob(file, {'cwd':base_folder, 'sync':true}, function (er, files) {
	finalfiles = finalfiles.concat(files);
		});
	};
	})

	async.each(finalfiles, function( file, icallback) {
		var fileTo = pathlib.join(base_folder, file);
		var fileFrom = pathlib.join(backing_folder, file);

		fs.exists(fileTo, function (exists) {
	if (exists){
	  fs.unlink(fileTo, function(err){
	    if (err) icallback();
	    ncp(fileFrom, fileTo, function(err){
		if (err) throw err;
		console.log('success!');
		icallback();
	      });
	  });

	}else{
	  icallback();
	}
		});
	}, function(err){
		// if any of the saves produced an error, err would equal that error
		if( err ) {
	// One of the iterations produced an error.
	// All processing will now stop.
	console.log('A file failed to process');
		} else {
	console.log('All files have been processed successfully');
		}
	});
	callback();
}

function symlinkFolder(gameserver, from_path, replacements, parentcallback){
	async.series([
	function(callback) {
		linkDir(from_path, gameserver.config.path, function(){callback(null)});

	},
	function(callback) {
		replaceFiles(gameserver.config.path, replacements, from_path, function cb(){callback(null); });
	}

	], function(err, results){parentcallback();});
}

function copyFolder(gameserver, from_path, parentcallback){
	ncp(from_path, gameserver.config.path, function (err) {
	if (err) {
		return console.error(err);
	}
	parentcallback();
	});
}

exports.copyFolder = copyFolder;
exports.symlinkFolder = symlinkFolder;
exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.fixperms = fixperms;
exports.linkDir = linkDir;
