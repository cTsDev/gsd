var restify = require('restify');
var unknownMethodHandler = require('../utls.js').unknownMethodHandler;
var hasPermission = require('../auth.js').hasPermission;
var config = require('../config.json');
var plugins = require("../services/plugins.js").plugins;
var saveconfig = require('../utls.js').saveconfig;
var servers = require('../services/index.js').servers;
var initServer = require('../services/index.js').initServer;
var restserver = restify.createServer();
var path = require('path');
var async = require('async');
var mime = require('mime');
var request = require('request');

restserver.use(restify.bodyParser());
restserver.use(restify.authorizationParser());
restserver.use(restify.queryParser());
restserver.on('MethodNotAllowed', unknownMethodHandler);

restserver.use(
	function crossOrigin(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	return next();
	}
);

function restauth(req, service, permission){
	if (!('X-Access-Token' in req.headers) && 'x-access-token' in req.headers){
		req.headers['X-Access-Token'] = req.headers['x-access-token']
	}

	if (!('X-Access-Token' in req.headers)){
		return false;
	}

	if (!hasPermission(permission, req.headers['X-Access-Token'], service)){
		return false;
	}else{
		return true;
	}
}

function unauthorized(res){

	res.writeHead(403);
	res.end('HTTP/1.1 403 Forbidden. You do not have permission to access this function.');
	return res;

}

restserver.get('/gameservers/', function info(req, res, next){
	if (!restauth(req, -1, "g:list")){res = unauthorized(res); return next();}
	response = [];
	servers.forEach(
	function(service){
		response.push(service.info());
	});
	res.send(response);
});

restserver.post('/gameservers/', function info(req, res, next){
	if (!restauth(req, -1, "g:new")){res = unauthorized(res); return next();}
	id = config.servers.push(JSON.parse(req.params['settings']));
	// As push returns the array length, not the id
	id = id - 1;
	saveconfig(config);
	initServer(id);
	service = servers[id];
	service.create();
	res.send({"id":String(id)});
});

restserver.del('/gameservers/:id', function info(req, res, next){
	if (!restauth(req, req.params.id, "g:delete")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	// TODO: if on, turn off
	service.delete();
	id = config.servers.splice(req.params.id,1);
	saveconfig(config);
	res.send("ok");
});

restserver.get('/gameservers/:id', function (req, res, next){
	if (!restauth(req, req.params.id, "s:get")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	res.send(service.info());
});


restserver.put('/gameservers/:id', function info(req, res, next){
	if (!restauth(req, req.params.id, "g:update")){res = unauthorized(res); return next();}

	if(req.params['variables']) {

		try {

			service = servers[req.params.id];
			service.updatevariables(JSON.parse(req.params['variables']), true);
			saveconfig(config);
			res.send(service.info());

		} catch(err){

			console.log("Error encountered when trying to update server variables.");
			console.log(err.stack);
			res.send(service.info());

		}

	}

	if(req.params['keys']) {

		try {

			service = servers[req.params.id];
			service.updatekeys(JSON.parse(req.params['keys']), false);
			saveconfig(config);
			res.send(service.info());

		} catch(err){

			console.log("Error encountered when trying to update server permission keys.");
			console.log(err.stack);
			res.send(service.info());

		}

	}
});


restserver.get('/gameservers/:id/on', function on(req, res, next){
	if (!restauth(req, req.params.id, "s:power")){res = unauthorized(res); return next();}
	service = servers[req.params.id];


	async.series([
		function(callback) {
			service.preflight(function(){callback(null);});
		},
		function(callback) {
			service.turnon(function(){callback(null);});
		}
	]);
	res.send('ok')
});

restserver.get('/gameservers/:id/off', function off(req, res, next){
	if (!restauth(req, req.params.id, "s:power")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.turnoff();
	res.send('ok')
});

restserver.get('/gameservers/:id/kill', function off(req, res, next){
	if (!restauth(req, req.params.id, "s:power")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.kill();
	res.send('ok')
});

restserver.get('/gameservers/:id/restart', function restart(req, res, next){
	if (!restauth(req, req.params.id, "s:power")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.restart();
	res.send('ok')
});
restserver.get('/gameservers/:id/configlist', function configlist(req, res, next){
	if (!restauth(req, req.params.id, "s:files:get")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	res.send(service.configlist());
});
restserver.get('/gameservers/:id/maplist', function maplist(req, res, next){
	if (!restauth(req, req.params.id, "s:files:get")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	res.send(service.maplist());
});
restserver.get('/gameservers/:id/query', function query(req, res, next){
	if (!restauth(req, req.params.id, "s:query")){res = unauthorized(res); return next();}
	service = servers[req.params.id]; res.send(service.lastquery());

});

restserver.post('/gameservers/:id/console', function command(req, res, next){
	if (!restauth(req, req.params.id, "s:console:send")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	res.send(service.send(req.params.command))

});

restserver.get('/gameservers/:id/addonsinstalled', function command(req, res, next){
	if (!restauth(req, req.params.id, "s:addons")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	res.send(service.addonlist());
});

restserver.get(/^\/gameservers\/(\d+)\/file\/(.+)/, function(req, res, next) {
	if (!restauth(req, req.params[0], "s:files:get")){res = unauthorized(res); return next();}
	service = servers[req.params[0]];
	res.send({'contents':service.readfile(req.params[1])});
});

restserver.get(/^\/gameservers\/(\d+)\/download\/(\w+)/, function(req, res, next) {

	service = servers[req.params[0]];
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	if (config.interfaces.rest.authurl != null){
		request.post(config.interfaces.rest.authurl, {form: { token: req.params[1], server: req.params[0]}}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				try {
					json = JSON.parse(body);
					if (json.path && json.path != null){

						var filename = path.basename(json.path);
						var mimetype = mime.lookup(json.path);
						var file = service.returnFilePath(json.path);
						var stat = fs.statSync(file);
						res.writeHead(200, {
							'Content-Type': mimetype,
							'Content-Length': stat.size,
							'Content-Disposition': 'attachment; filename=' + filename
						});
						var filestream = fs.createReadStream(file);
						filestream.pipe(res);

					}else{
						console.log("[WARN] Downloader failed to authenticate: server did not respond with valid download path.");
						res.send({'error': 'Server did not respond with a valid download path.'});
					}
				} catch (ex) {
					console.log("[WARN] Downloader failed to authenticate die to a GSD error:");
					console.log(ex.stack);
					res.send({'error': 'Server was unable to authenticate this request.'});
				}
			}else{
				console.log("[WARN] Downloader failed to authenticate: Server returned error code [HTTP/1.1 " + response.statusCode + "].");
				res.send({'error': 'Server responded with an error code. [HTTP/1.1 ' + response.statusCode + ']'});
			}
		});
	}else{
		console.log("[WARN] Downloader failed to authenticate: no authentication URL provided.");
		res.send({'error': 'This action is not configured correctly in the configuration.'});
	}

});

restserver.get(/^\/gameservers\/(\d+)\/folder\/(.+)/, function(req, res, next) {
	if (!restauth(req, req.params[0], "s:files")) {res = unauthorized(res); return next();}
	service = servers[req.params[0]];
	res.send(service.dir(req.params[1]));
});

restserver.put(/^\/gameservers\/(\d+)\/file\/(.+)/, function(req, res, next) {
	if ('contents' in req.params) {
		if (!restauth(req, req.params[0], "s:files:put")) {
			res = unauthorized(res);
			return next();
		}
		service = servers[req.params[0]];
		res.send(service.writefile(req.params[1], req.params['contents']));
	}
	if ('url' in req.params) {
		if (!restauth(req, req.params[0], "s:files:put")) {
			res = unauthorized(res);
			return next();
		}
		service = servers[req.params[0]];
		res.send(service.downloadfile(req.params['url'], req.params[1]));
	}
	if ('zip' in req.params) {
		if (!restauth(req, req.params[0], "s:files:zip")) {
			res = unauthorized(res);
			return next();
		}
		service = servers[req.params[0]];
		res.send(service.zipfile(req.params[1]));
	}
	if ('unzip' in req.params) {
		if (!restauth(req, req.params[0], "s:files:zip")) {
			res = unauthorized(res);
			return next();
		}
		service = servers[req.params[0]];
		ext = path.extname(req.params[1]);
		res.send(service.unzipfile(ext, req.params[1]));
	}
});

restserver.get('/gameservers/:id/gamemodes', function command(req, res, next){
	if (!restauth(req, req.params.id, "gamemodes:get")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.getgamemodes(res);
});

restserver.put('/gameservers/:id/gamemodes', function command(req, res, next){
	if (!restauth(req, req.params.id, "gamemodes:edit")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.installgamemode(req.params['gamemode']);
	res.send("ok");
});
restserver.del('/gameservers/:id/gamemodes', function command(req, res, next){
	if (!restauth(req, req.params.id, "gamemodes:edit")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.getgamemode(res);
});

restserver.get('/gameservers/:id/plugins/categories/:category', function command(req, res, next){
	if (!restauth(req, req.params.id, "plugins:list")){res = unauthorized(res); return next();}
	service = servers[req.params.id];

	service.pluginsByCategory(req.params['category'], req.query.size, req.query.start, function(err, results){res.send(results)});
});

restserver.get('/gameservers/:id/plugins/categories', function command(req, res, next){
	if (!restauth(req, req.params.id, "plugins:list")){res = unauthorized(res); return next();}

	service = servers[req.params.id];
	service.plugincategories(function(err, results){res.send(results)});
});

restserver.post('/gameservers/:id/plugins/search', function command(req, res, next){
	if (!restauth(req, req.params.id, "plugins:list")){res = unauthorized(res); return next();}
	service = servers[req.params.id];
	service.pluginSearch(req.params['name'], req.query.size, req.query.start, function(err, results){res.send(results)});
});

restserver.listen(config.daemon.listenport, function() {
	console.log('%s listening at %s', restserver.name, restserver.url);
});
