var options = {
	max_fee: 12000,
	servers: [
		'wss://s-east.ripple.com:443',
		'wss://s-west.ripple.com:443'
	],
	trusted: false
};
var env = process.env;

function start()
{
	console.info("Account", id);
	remote.set_secret(id, env.XMM_KEY);
	process.emit("request");
}

global.ripple = require("ripple-lib");
global.remote = new ripple.Remote(options);
global.id = env.XMM_ID;
global.account = remote.account(id);
global.fee = options.max_fee / 1e6;

require("./compute");
require("./listen");
require("./offer");
require("./submit");
require("./update");

remote.connect(start);
