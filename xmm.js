var util = require("util");

var options = {
	max_fee: 10000,
	fee_cushion: 1,
	servers: [
		'wss://s-east.ripple.com:443',
		'wss://s-west.ripple.com:443'
	],
	trusted: false
};
var env = process.env;

function debug(data)
{
	var options = {
		colors: true,
		depth: 10
	};
	var str = util.inspect(data, options);
 
	util.error(str);
}

function start()
{
	console.info("Account", id);
	remote.set_secret(id, env.XMM_KEY);
	process.emit("ready");
}

global.debug = debug;
global.ripple = require("ripple-lib");
global.remote = new ripple.Remote(options);
global.id = env.XMM_ID;
global.account = remote.account(id);
global.fee = options.max_fee / 1e6;

require("./listen");
require("./update");
require("./offers");
require("./choose");
require("./submit");

remote.connect(start);
