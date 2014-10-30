var events = require("events");
var api = require("./api");

var account = new events.EventEmitter();

function check(fee, saldo)
{
	var unit;

	console.info("Fee ratio", fee / saldo["XRP"]);

	for (unit in saldo)
		console.info("Balance", saldo[unit], unit);

	process.exit();
}

function request()
{
	account.emit("request");
}

account.once("update", check);
account.once("connected", request);
api.connect(account);
