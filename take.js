var $ = this.$;

 if ($) {
var id = location.search.replace("?", "");
var key = localStorage[id];
var host = localStorage.bestws;
 } else {
var ripple = require("ripple-lib");

var env = process.env;
var id = env.ARB_ID;
var key = env.ARB_KEY;
var host = env.ARB_HOST;
 }

var servers = [
	"wss://ripple.gatehub.net:443",
	"wss://s1.ripple.com:443",
	"wss://s-east.ripple.com:443",
	"wss://s-west.ripple.com:443"
];
var options = {
	max_fee: 300000,
	fee_cushion: 3,
	servers: host ? servers.concat([
		host
	]) : servers,
	trusted: false
};
var remote = new ripple.Remote(options);
var account = remote.account(id);
var fee = options.max_fee / 1e6;
var oldsaldo = {};
var round = {};
var pairs = {};
var paths = {};
var units = {};
var template = {};
var targets = {};
var pending = true;
var ready = false;
var busy = 0;
var stall = 1e4;
var maxlag = 3e3;
var mincount = 5;
var ledger, saldo, ws, deposit, reserve;
var table, header, state;

function start()
{
	var target;

	for (target in ws) {
		var socket = ws[target];

		socket.twin.disconnect();
		socket.disconnect();
	}

	ws = {};
	round = {};
	paths = {};

 if ($) {
	for (target in targets) {
		var head = targets[target];

		head.text(target);
		head.removeClass("active");
	}

	display();

	state.addClass("info");
 }

	remote.once("ledger_closed", getsaldo);
}

function getsaldo(data)
{
	pending = false;
	ledger = data.ledger_index;
	reserve = {
		base: data.reserve_base / 1e6,
		inc: data.reserve_inc / 1e6
	};

	if (!ledger) {
		console.error("Failed to get ledger");
		return start();
	}

	remote.request_account_info({
		account: id,
		ledger: ledger
	}, setxrp);
}

function setxrp(error, response)
{
	var data, balance, count;

	if (error) {
		console.error("Failed to get balance");
		return start();
	}

	saldo = {};

	data = response.account_data;
	balance = parseInt(data.Balance) / 1e6;
	count = data.OwnerCount;
	reserve = reserve.base + count * reserve.inc;

	saldo["XRP"] = balance - reserve;

	remote.request_account_lines({
		account: id,
		ledger: ledger
	}, setlines);
}

function setlines(error, response)
{
	var lines, i, unit;

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
			if (saldo[currency])
				saldo[currency] += balance;
			else
				saldo[currency] = balance;
		}
	}

 if ($) {
	if (!deposit) {
		var json = JSON.stringify(saldo);

		localStorage[location.href] = json;

		deposit = saldo;
	}

	show();
 } else {
	console.info(new Date());
 }

	showdiff();
	oldsaldo = saldo;

	listen();
}

function showdiff()
{
	var dict = {};
	var unit;

	for (unit in saldo) {
		var last = saldo[unit];
		var prev = oldsaldo[unit];

		if (!prev)
			prev = 0;

		if (last.toPrecision(6) != prev.toPrecision(6))
			dict[unit] = last - prev;
	}

	console.info(dict);
}

function pay(path)
{
	var tx = remote.transaction();

	tx.payment(id, id, path.amount);
	tx.paths(path.alt);
	tx.sendMax(path.cost);
	tx.set_flags("PartialPayment");
	tx.secret(key);

	return tx;
}

function trade(orig)
{
	var pair = orig.split("/").join(">");
	var riap = orig.split("/").reverse().join(">");
	var path = paths[pair];
	var back = paths[riap];
	var buy = pay(path);
	var sell = pay(back);

	function log(error, response)
	{
		if (error)
			console.error(error.result);

		--busy;
		if (busy < 0)
			busy = 0;

		if (!busy) {
			ready = true;
			request();
		}
	}

	if (0 < busy)
		return;

	ready = false;
	busy += 2;
	buy.submit(log);
	sell.submit(log);
}

function addunit(unit)
{
	var src, dst;

	if (units[unit])
		return;

	src = template.row.clone();
	dst = template.header.clone();
	dst.text(unit);
	header.append(dst);
	src.append(dst.clone());
	table.append(src);

	targets[unit] = dst;

	for (dst in units) {
		var cell = template.cell.clone();
		var pair = unit + ">" + dst;

		src.append(cell);
		pairs[pair] = cell;

		if (unit != dst)
			cell.data("pair", pair);
	}

	units[unit] = src;
	for (src in units) {
		var cell = template.cell.clone();
		var pair = src + ">" + unit;

		units[src].append(cell);
		pairs[pair] = cell;

		if (unit != src)
			cell.data("pair", pair);
	}
}

function appear()
{
	var cell = $(this);

	cell.removeClass();
	cell.addClass(cell.data("class"));
	cell.text(cell.data("update"));
	cell.fadeIn();
}

function replace(cell)
{
	var src = cell.text();
	var dst = cell.data("update");

	if (src == dst)
		return;

	if (src)
		cell.addClass("update").delay(2e3).fadeOut(appear);
	else
		appear.call(cell);
}

function show()
{
	var date = new Date();
	var unit;

	for (unit in saldo) {
		var balance = saldo[unit];
		var prev = deposit[unit];
		var diff = 100 * (balance / prev - 1);
		var cell, change;

		addunit(unit);

		cell = pairs[unit + ">" + unit];

		if (prev < balance) {
			cell.data("class", "text-success");
			change = "\u25B2";
		} else if (balance < prev) {
			cell.data("class", "text-danger");
			change = "\u25BC";
		} else {
			cell.data("class", "text-warning");
			change = "\u25CF";
		}

		balance = change + " " + balance.toPrecision(6);
		diff = diff.toFixed(1) + "%";
		cell.data("update", balance + ", " + diff);
		replace(cell);
	}

	state.removeClass();
	state.data("time", date.getTime());
	table.removeClass("hidden");
}

function request()
{
	if (busy)
		return;

	if (!ready) {
		pending = true;
		return;
	}

	ready = false;
	start();
}

function convert(amount)
{
	var dict = {};

	function getunit(amount)
	{
		if ("object" == typeof amount)
			return amount.currency;
		else
			return "XRP";
	}

	function getvalue(amount)
	{
		if ("object" == typeof amount)
			return parseFloat(amount.value);
		else
			return parseFloat(amount) / 1e6;
	}

	dict.currency = getunit(amount);
	dict.value = getvalue(amount);
	return dict;
}

function gethuman(json)
{
	var amount = convert(json);
	var value = amount.value;
	var currency = amount.currency;
	var balance = saldo[currency];
	var part = value / balance;

	amount = value.toPrecision(6) + " " + currency;
	part *= 100;
	part = part.toFixed(0) + "%";
	return amount + " (" + part + ")";
}

function getprice(src, dst)
{
	var base = src.currency;
	var counter = dst.currency;
	var price, unit;

	src = src.value;
	dst = dst.value;

	if (src < dst) {
		price = dst / src;
		unit = counter;
	} else {
		price = src / dst;
		unit = base;
	}

	return price.toPrecision(6) + " " + unit;
}

function getround(pair)
{
	var orig = pair.split(">").sort().join("/");

	return round[orig];
}

function display()
{
	var date = new Date();
	var pair;

	for (pair in pairs) {
		var src = pair.split(">").pop();
		var dst = pair.split(">").shift();
		var cell = pairs[pair];
		var path = paths[pair];
		var stats = getround(pair);
		var profit = stats ? stats.profit : -1;
		var since, human;

		if (src == dst)
			continue;

		cell.removeClass();

		if (!path) {
			cell.text("");
			continue;
		}

		human = path.human;
		since = date.getTime() - path.time;

		if (maxlag < since)
			cell.addClass("warning");
		else if (0 < profit)
			cell.addClass("success");
		else
			cell.addClass("danger");

		profit *= 100;
		profit = profit.toFixed(1) + "%";
		cell.text(human + ", " + profit);
	}
}

function judge(pair)
{
	var orig = pair.split(">").sort().join("/");
	var riap = pair.split(">").reverse().join(">");
	var path = paths[pair];
	var back = paths[riap];
	var stats = round[orig];
	var drop = 1 - 2e-6 * options.max_fee / saldo["XRP"];
	var p0, p1, profit;

	if (!path || !back)
		return;

	p0 = drop * path.price;
	p1 = drop * back.price;
	profit = p0 * p1 - 1;

	if (!stats) {
		stats = {
			ema: profit
		};
		round[orig] = stats;
	}

	stats.count = Math.min(mincount, path.count, back.count);
	stats.ema = (stats.ema + profit) / 2;
	stats.profit = profit;
	stats.time = Math.min(path.time, back.time);
}

function update(data)
{
	var date = new Date();
	var alt = data.alternatives;
	var amount = data.destination_amount;
	var dst = convert(amount);
	var n = alt.length;
	var socket = this.remote;
	var i;

	socket.time = date.getTime();

	for (i = 0; i < n; i++) {
		var path = alt[i];
		var cost = path.source_amount;
		var src = convert(cost);
		var pair = src.currency + ">" + dst.currency;
		var prev = paths[pair];

		if ("XRP" != src.currency)
			if ("XRP" != dst.currency)
				continue;

 if ($) {
		if (!pairs[pair])
			continue;
 }

		paths[pair] = {
			socket: socket,
			count: prev ? prev.count + 1 : 1,
			alt: path.paths_computed,
			human: getprice(src, dst),
			price: dst.value / src.value,
			time: date.getTime(),
			cost: cost,
			amount: amount
		};

		judge(pair);

		if ("XRP" == dst.currency)
			find(src.currency);
	}

 if ($) {
	targets[dst.currency].removeClass("active");
	display();
 }
}

function setup()
{
	var dst = ripple.Amount.from_json(this.dst);
	var path = this.pathFind({
		dst_amount: dst,
		dst_account: id,
		src_account: id
	});

	path.on("update", update);
}

function find(target)
{
	var date = new Date();
	var socket = ws[target];
	var path = paths[target + ">XRP"];
	var dst, twin;

	function amount(value, currency)
	{
		if ("XRP" == currency)
			return Math.round(value * 1e6);

		return {
			value: value.toFixed(20),
			currency: currency,
			issuer: id
		};
	}

	if (socket)
		return;

	if (path)
		dst = path.cost;
	else if ("XRP" == target)
		dst = amount(saldo["XRP"] / 2, "XRP");
	else
		return;

 if ($) {
	targets[target].text(gethuman(dst));
	targets[target].addClass("active");
 }

	socket = new ripple.Remote(options);
	socket.dst = dst;
	socket.connect(setup);
	socket.time = date.getTime();
	ws[target] = socket;

	twin = new ripple.Remote(options);
	twin.dst = dst;
	twin.connect(setup);
	twin.time = date.getTime();
	socket.twin = twin;
}

function listen()
{
	ready = true;

	if (pending)
		request();
	else
		find("XRP");
}

function estimate(stats)
{
	var date = new Date();
	var since = date.getTime() - stats.time;
	var count = stats.count;
	var profit = stats.profit;
	var ema = stats.ema;

	if (maxlag < since)
		return -1;
	else
		return profit;
}

function choose()
{
	var good = {};
	var pair;

	function top(dict)
	{
		var high = 0;
		var pair, best;

		for (pair in dict) {
			var rating = dict[pair];

			if (high < rating) {
				high = rating;
				best = pair;
			}
		}

		return best;
	}

	for (pair in round) {
		var stats = round[pair];
		var rank = estimate(stats);

		stats.rank = rank;
		good[pair] = rank;
	}

	return top(good);
}

function watchdog()
{
	var date = new Date();
	var now = date.getTime();
	var target;

	if (busy)
		return;

	for (target in ws) {
		var socket = ws[target];
		var twin = socket.twin;
		var time = Math.min(socket.time, twin.time);

		if (stall < now - time) {
			var pair;

			for (pair in paths) {
				var dst = pair.split(">").pop();
				var stats = getround(pair);

				if (dst == target) {
					if (stats)
						stats.count = 0;

					paths[pair].count = 0;
				}
			}

			twin.disconnect();
			socket.disconnect();
			delete ws[target];
			find(target);
			return;
		}
	}
}

function tick()
{
	var best = choose();
 if ($) {
	var last = state.data("time");

	if (last) {
		var date = new Date();
		var since = date.getTime() - last;

		since = new Date(since);
		since = since.toISOString();
		since = since.replace(/^.*T(..:..:..).*$/, "$1");
		state.text(since);
	}
 }

	if (best) {
		var rank = round[best].rank;

		rank *= 100;
		rank = rank.toFixed(3) + "%";
		console.info(best, rank);

		if (key)
			trade(best);
	}

	watchdog();

 if ($) {
	display();
 }
}

function main()
{
 if ($) {
	var old = new Date(0);
	var now = new Date();

	$("h1").text(id);

	table = $("table");
	header = $("tr");
	state = $("td");
	state.click(request);

	template.header = header.children("th").detach();
	template.row = header.clone();
	template.cell = template.row.children("td").detach();

	try {
		var json = localStorage[location.href];

		deposit = JSON.parse(json);
	} catch (e) {
		deposit = undefined;

		console.log("Initial balance unknown");
	}
 } else {
	console.info(id);
 }

	setInterval(tick, 1e3);
	account.on("transaction", request);
	remote.connect(listen);
}

 if ($) {
$(main);
 } else {
main();
 }
