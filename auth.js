var config = require('./config.json');
var restify = require('restify');

function hasPermission(permission, key, service){

    if (config.tokens.indexOf(key) > -1){
        return true;
    }

    service = parseInt(service);
    if (key in config.servers[service].keys){

        if (config.servers[service].keys[key].indexOf(permission) >= 0){
            return true;
        }

    }

    return false;

}

exports.hasPermission = hasPermission;