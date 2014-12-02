var fs = require("fs");
var file = "gsd.db";
var exists = fs.existsSync(file);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(file);

db.serialize(
	function() {
		if(!exists) {
			db.run("CREATE TABLE servers (name TEXT, user TEXT, override_command_line TEXT, path TEXT, jar TEXT, ram INT, port INT, gamehost TEXT, plugin TEXT, autoon INT)");
		}
	}
);


function addServer(data) {
	var stmt = db.prepare("INSERT INTO servers VALUES (?,?,?,?,?,?,?,?,?,?)");


}
