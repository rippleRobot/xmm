var $ = this.$;

 if ($) {
var id = location.search.replace("?", "");
var key = localStorage[id];
 } else {
var ripple = require("ripple-lib");

var env = process.env;
var id = process.argv[2];
var key = env[id];
 }

var options = {
	max_fee: 200000,
	fee_cushion: 2,
	servers: [
		"wss://s-west.ripple.com:443",
		"wss://s-east.ripple.com:443",
		"wss://s1.ripple.com:443",
		"wss://ripple.gatehub.net:443"
	],
	trusted: false
};
var remote = new ripple.Remote(options);
var account = remote.account(id);
var fee = options.max_fee / 1e6;
var pairs = {};
var paths = {};
var units = {};
var template = {};
var targets = {};
var ready = false;
var stall = 1e4;
var maxlag = 3e3;
var mincount = 3;
var ledger, saldo, ws, deposit, nassets;
var table, header, state;

function stop(socket)
{
	var finder;

	if (!socket)
		return;

	finder = socket.finder;
	if (finder) {
		finder.removeAllListeners("update");
		try {
			finder.close();
		} catch (e) {
		}
		delete socket.finder;
	}

	socket.disconnect();
	socket.zombie = true;
}

function start()
{
	var target;

	for (target in ws) {
		var socket = ws[target];

		stop(socket.twin);
		stop(socket);
	}

	ws = {};
	paths = {};

 if ($) {
	for (target in targets) {
		var head = targets[target];

		head.text(abbr(target));
		head.removeClass("active");
	}

	display();

	state.addClass("info");
 }

	remote.once("ledger_closed", getstate);
}

function abbr(unit)
{
	return unit.replace(/^(...:....).*$/, "$1\u2026");
}

function getstate(data)
{
	ledger = data.ledger_index;

	if (ledger)
		getsaldo(ledger, setsaldo);
	else
		start();
}

function setsaldo(dict)
{
	var unit;

	if (!dict)
		return start();

	saldo = dict;
	showgm();

 if ($) {
	if (!deposit) {
		var json = JSON.stringify(saldo);

		localStorage[location.href] = json;

		deposit = saldo;
	}

	show();
 }

	ready = true;
	for (unit in saldo)
		find(unit);
}

function getsaldo(index, cb)
{
	var dict = {};

	function setxrp(error, response)
	{
		if (error)
			return cb();

		dict["XRP"] = response.to_number() / 1e6;

		remote.request_account_lines({
			account: id,
			ledger: index
		}, setlines);
	}

	function setlines(error, response)
	{
		var lines, i, unit;

		if (error)
			return cb();

		lines = response.lines;
		for (i = 0; i < lines.length; i++) {
			var line = lines[i];
			var balance = parseFloat(line.balance);
			var active = line.no_ripple;
			var currency = line.currency;
			var account = line.account;

			if (active) {
				unit = currency + ":" + account;

				if (0 < balance)
					dict[unit] = balance;
			}
		}

		cb(dict);
	}

	remote.request_account_balance({
		account: id,
		ledger: index
	}, setxrp);
}

function showgm()
{
	var product = 1;
	var unit;

	nassets = 0;

	for (unit in saldo) {
		product *= saldo[unit];
		++nassets;
	}

	product = Math.pow(product, 1 / nassets);
	console.info(new Date(), id, product);
}

function trade(pair)
{
	var path = paths[pair];
	var tx = remote.transaction();

	tx.payment(id, id, path.amount);
	tx.paths(path.alt);
	tx.sendMax(path.sendmax);
	tx.secret(key);

	function check(error, response)
	{
		if (error)
			console.error(error.result);

		exit();
	}

	ready = false;
	tx.submit(check);
}

function addunit(unit)
{
	var src, dst;

	if (units[unit])
		return;

	src = template.row.clone();
	dst = template.header.clone();
	dst.text(abbr(unit));
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

function convert(amount)
{
	var dict = {};

	function getunit(amount)
	{
		if ("object" == typeof amount)
			return amount.currency + ":" + amount.issuer;
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

function gethuman(json, stake)
{
	var amount = convert(json);
	var currency = abbr(amount.currency);

	stake *= 100;
	stake = stake.toFixed(3) + "%";
	return stake + " " + currency;
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

	return price.toPrecision(6) + " " + unit.replace(/:.*$/, "");
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
		var profit = path ? path.profit : -1;
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

		profit *= 1e4;
		profit = profit.toFixed(1) + "\u2031";
		cell.text(human + ", " + profit);
	}
}

function judge(pair)
{
	var path = paths[pair];
	var offer = path.offer;
	var ema = path.ema;
	var src, dst, base, counter, v0, v1, drop, profit;

	if (!offer)
		return 0;

	src = offer.src;
	dst = offer.dst;
	pair = pair.split(">");
	base = pair.shift();
	base = saldo[base];
	counter = pair.shift();
	counter = saldo[counter];

	v0 = base * counter;
	v1 = (base - src) * (counter + dst);
	drop = fee / saldo["XRP"];
	profit = (v1 / v0 - drop - 1) / nassets;

	if (ema)
		path.ema = (ema + profit) / 2;
	else
		path.ema = profit;

	path.profit = profit;
}

function abbrpair(pair)
{
	pair = pair.replace(/^(...:....)[^>]*/, "$1...");
	pair = pair.replace(/(...:....)[^>]*$/, "$1...");
	return pair;
}

function update(data)
{
	var date = new Date();
	var alt = data.alternatives;
	var amount = data.destination_amount;
	var dst = convert(amount);
	var n = alt.length;
	var socket = this.remote;
	var i, best;

	if (socket.zombie)
		return stop(socket);

	socket.time = date.getTime();

	for (i = 0; i < n; i++) {
		var path = alt[i];
		var cost = path.source_amount;
		var src = convert(cost);
		var pair = src.currency + ">" + dst.currency;
		var prev = paths[pair];
		var sendmax = src.value * 1.001;

 if ($) {
		if (!pairs[pair])
			continue;
 }

		paths[pair] = {
			stake: dst.value / saldo[dst.currency],
			socket: socket,
			count: prev ? prev.count + 1 : 1,
			alt: path.paths_computed,
			human: getprice(src, dst),
			price: dst.value / src.value,
			offer: {
				src: sendmax,
				dst: dst.value
			},
			time: date.getTime(),
			cost: cost,
			sendmax: mkamount(sendmax, src.currency),
			amount: amount
		};

		judge(pair);
	}

	best = choose();
	if (best) {
		var rank = paths[best].rank;

		rank *= 1e4;
		rank = rank.toFixed(3) + "bp";

		if (ready) {
			console.info(date, abbrpair(best), rank);

			if (key)
				trade(best);
		}
	}

 if ($) {
	targets[dst.currency].removeClass("active");
	display();
 }
}

function listsrc(dst)
{
	var list = [];
	var unit;

	function getsrc(src)
	{
		var dict = {};
		var issuer;

		src = src.split(":");
		dict.currency = src.shift();

		issuer = src.shift();
		if (issuer)
			dict.issuer = issuer;

		return dict;
	}

	dst = convert(dst);
	dst = dst.currency;

	for (unit in saldo)
		if (dst != unit)
			list.push(getsrc(unit));

	return list;
}

function setup()
{
	var dst = ripple.Amount.from_json(this.dst);
	var finder = this.pathFind({
		src_currencies: listsrc(this.dst),
		dst_amount: dst,
		dst_account: id,
		src_account: id
	});

	this.finder = finder;
	finder.on("update", update);
}

function mkamount(value, unit)
{
	var dict = {};

	if ("XRP" == unit)
		return Math.round(value * 1e6);

	unit = unit.split(":");
	dict.currency = unit.shift();
	dict.issuer = unit.shift();
	dict.value = value.toFixed(20);
	return dict;
}

function shuffle()
{
	var list = options.servers;
	var i;

	for (i = list.length - 1; 0 < i; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp;

		tmp = list[i];
		list[i] = list[j];
		list[j] = tmp;
	}

	return options;
}

function find(target)
{
	var date = new Date();
	var socket = ws[target];
	var stake = Math.sqrt(fee / saldo["XRP"]);
	var dst, twin;

	if (socket)
		return;

	dst = mkamount(stake * saldo[target], target);

 if ($) {
	targets[target].text(gethuman(dst, stake));
	targets[target].addClass("active");
 }

	socket = new ripple.Remote(shuffle());
	socket.dst = dst;
	socket.on("error", slowdown);
	socket.connect(setup);
	socket.time = date.getTime();
	socket.stake = stake;
	ws[target] = socket;

	twin = new ripple.Remote(shuffle());
	twin.dst = dst;
	twin.on("error", slowdown);
	twin.connect(setup);
	twin.time = date.getTime();
	socket.twin = twin;
}

function estimate(path)
{
	var date = new Date();
	var since = date.getTime() - path.time;
	var count = path.count;
	var profit = path.profit;

	if (maxlag < since)
		return;
	else if (count < mincount)
		return;
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

	for (pair in paths) {
		var path = paths[pair];
		var rank = estimate(path);

		path.rank = rank;
		good[pair] = rank;
	}

	return top(good);
}

function watchdog()
{
	var date = new Date();
	var now = date.getTime();
	var target;

	if (!ready)
		return;

	for (target in ws) {
		var socket = ws[target];
		var twin = socket.twin;
		var time = Math.min(socket.time, twin.time);

		if (stall < now - time) {
			var pair;

			for (pair in paths) {
				var dst = pair.split(">").pop();

				if (dst == target)
					paths[pair].count = 0;
			}

			stop(twin);
			stop(socket);
			delete ws[target];
			find(target);
			return;
		}
	}
}

function tick()
{
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

	watchdog();

 if ($) {
	display();
 }
}

function slowdown()
{
	stop(this);
}

function exit()
{
 if ($) {
	location.reload();
 } else {
	process.exit();
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
 }

	setInterval(exit, 3e5);
	setInterval(tick, 1e3);
	account.on("transaction", exit);
	remote.on("error", exit);
	remote.connect(start);
}

 if ($) {
$(main);
 } else {
main();
 }
