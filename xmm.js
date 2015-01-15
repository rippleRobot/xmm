var assert = require("assert");
var fs = require("fs");
var util = require("util");

var env = process.env;
var host = env.XMM_HOST;
var servers = [
	"wss://s-east.ripple.com:443",
	"wss://s-west.ripple.com:443"
];
var options = {
	max_fee: 10000,
	fee_cushion: 1,
	servers: host ? [
		host
	] : servers,
	trusted: false
};
var filename = "history.json";
var history;

function save(entry)
{
	var data;

	history.push(entry);

	data = JSON.stringify(history);
	fs.writeFileSync(filename, data);
}

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

try {
	history = fs.readFileSync(filename);
	history = JSON.parse(history);
	assert(history instanceof Array);
	assert(history.length);
} catch (error) {
	console.info("History unavailable");
	history = [];
}

global.history = history;
global.save = save;
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
require("./prices");

remote.connect(start);
