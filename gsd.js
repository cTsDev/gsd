var config = require('./config.json');

require('./interfaces/console.js');
require('./interfaces/rest.js');
require('./interfaces/ftp.js');

var servers = require('./services');