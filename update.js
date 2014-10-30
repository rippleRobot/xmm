var ripple = require("ripple-lib");

var options = {
	max_fee: 12000,
	servers: [
		'wss://s-east.ripple.com:443',
		'wss://s-west.ripple.com:443'
	],
	trusted: false
};
var remote = new ripple.Remote(options);
var fee = options.max_fee / 1e6;
var env = process.env;
var id = env.XMM_ID;
var ledger, saldo;

function start()
{
	remote.once("ledger_closed", getsaldo);
}

function getsaldo(data)
{
	ledger = data.ledger_index;
	if (!ledger) {
		console.error("Failed to get ledger");
		return start();
	}

	remote.request_account_balance(id, ledger, setxrp);
}

function setxrp(error, response)
{
	if (error) {
		console.error("Failed to get balance");
		return start();
	}

	saldo = {};

	saldo["XRP"] = response.to_number() / 1e6;

	remote.request_account_lines(id, 0, ledger, setlines);
}

function setlines(error, response)
{
	var shares = 0;
	var lines, i;

	if (error) {
		console.error("Failed to get lines");
		return start();
	}

	lines = response.lines;
	for (i = 0; i < lines.length; i++) {
		var line = lines[i];
		var balance = parseFloat(line.balance);
		var active = line.no_ripple;
		var currency = line.currency;
		var account = line.account;

		if (active) {
			var unit = currency + ":" + account;

			saldo[unit] = balance;
		} else if (balance < 0) {
			var unit = currency + ":" + id;

			if (!saldo[unit])
				saldo[unit] = 0;

			saldo[unit] += balance;
		}
	}

	remote.request_account_offers(id, 0, ledger, update);
}

function update(error, response)
{
	var offers = {};
	var list, i;

	function getunit(amount)
	{
		var currency, issuer;

		if ("string" == typeof amount)
			return "XRP";

		currency = amount.currency;
		issuer = amount.issuer;
		return currency + ":" + issuer;
	}

	function getvalue(amount)
	{
		if ("object" == typeof amount)
			return parseFloat(amount.value);
		else
			return parseFloat(amount) / 1e6;
	}

	if (error) {
		console.error("Failed to get offers");
		return start();
	}

	list = response.offers;
	for (i = 0; i < list.length; i++) {
		var offer = list[i];
		var src = offer.taker_gets;
		var dst = offer.taker_pays;
		var base = getunit(src);
		var counter = getunit(dst);
		var pair = base + ">" + counter;

		offers[pair] = {
			seq: offer.seq,
			src: getvalue(src),
			dst: getvalue(dst),
			dup: offers[pair]
		};
	}

	process.once("request", start);
	process.once("submit", create);
	process.emit("update", fee, saldo, offers);
}

function create(offer, pair)
{
	var transaction = remote.transaction();
	var src = offer.src;
	var dst = offer.dst;
	var seq = offer.seq;
	var base, counter;

	function amount(value, unit)
	{
		var currency, issuer;

		if ("XRP" == unit)
			return Math.round(value * 1e6);

		unit = unit.split(":");
		currency = unit.shift();
		issuer = unit.shift();

		return {
			value: value.toFixed(12),
			currency: currency,
			issuer: issuer
		};
	}

	function check(error, response)
	{
		console.warn(arguments);
		process.emit("request");
	}

	pair = pair.split(">");
	base = pair.shift();
	counter = pair.shift();
	src = amount(src, base);
	dst = amount(dst, counter);

	transaction.offer_create(id, dst, src, false, seq);
	transaction.set_flags("Sell");
	transaction.submit(check);
}

remote.set_secret(id, env.XMM_KEY);
remote.connect(start);
