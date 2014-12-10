var exec = require('child_process').exec;
var async = require('async');
var pathlib = require('path');
var fs = require('fs');
var ncp = require('ncp').ncp;
var format = require('util').format;
var executeCommand = require('../utls').executeCommand;
var userid = require('userid');
var log = require('../log.js');

function createUser(username, home, callback){

	try {

		command = format("useradd -m -d %s -s /bin/false -G gsdusers %s", home, username);
		executeCommand(command, callback);

	} catch(ex) {
		log.error("Unable to create a user on the system.", ex);
	}

}

function deleteUser(username, callback){
	log.debug("Removing user " + username);
	command = format("deluser --remove-home %s", username);
	log.debug("User Removed");
	// @TODO: Actually remove the server from config.json...
	executeCommand(command, callback)
}


function linkDir(from_path, to_path, callback){
	command = format("cp -s -u -R %s/* %s", from_path, to_path);
	executeCommand(command, callback)
}


function fixperms(user, path, callback){
	log.debug("Fixing file permissions");
	executeCommand("chown -R "+ user +":gsdusers "+ path, callback);
	log.debug("Permissions fixed");
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
			if(exists) {
				fs.unlink(fileTo, function(err){
					if (err) icallback();
					ncp(fileFrom, fileTo, function(err){
						if (err) throw err;
						icallback();
					});
				});

			} else {
				icallback();
			}
		});
	}, function(err){
		if( err ) {
			log.error('A file failed to process');
		} else {
			log.info('All files have been processed successfully');
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
