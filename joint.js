var $ = this.$;

 if ($) {
var id = location.search.replace("?", "");
var key = localStorage[id];
var host = localStorage.bestws;
 } else {
var ripple = require("ripple-lib");

var env = process.env;
var id = env.VS_ID;
var key = env.VS_KEY;
var host = env.VS_HOST;
 }

var servers = [
	"wss://s1.ripple.com:443",
	"wss://s-east.ripple.com:443",
	"wss://s-west.ripple.com:443"
];
var options = {
	max_fee: 15000,
	fee_cushion: 1.5,
	servers: host ? servers.concat([
		host
	]) : servers,
	trusted: false
};
var remote = new ripple.Remote(options);
var account = remote.account(id);
var issuer = "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B";
var rusd = "USD:" + issuer;
var rbtc = "BTC:" + issuer;
var stake = 5;
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
var ledger, saldo, ws, deposit;
var table, header, state;

function start()
{
	var target;

	for (target in ws)
		ws[target].disconnect();

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
	ledger = data.ledger_index;
	if (!ledger) {
		console.error("Failed to get ledger");
		return start();
	}

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

	saldo = {};

	lines = response.lines;
	for (i = 0; i < lines.length; i++) {
		var line = lines[i];
		var balance = parseFloat(line.balance);
		var currency = line.currency;
		var account = line.account;
		var unit = currency + ":" + account;

		if ((rusd == unit) || (rbtc == unit))
			saldo[currency] = balance;
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
	if (!ready) {
		pending = true;
		return;
	}

	ready = false;
	pending = false;
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

		if (3e3 < since)
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
	var p0, p1, profit, count, avg, ema;

	if (!path || !back)
		return;

	p0 = path.price;
	p1 = back.price;
	profit = p0 * p1 - 1;

	if (stats) {
		avg = stats.avg;
		ema = stats.ema;
	} else {
		avg = profit;
		ema = profit;

		stats = {};
		round[orig] = stats;
	}

	count = Math.min(7, path.count, back.count);
	avg = (count * avg + profit) / (count + 1);
	ema = (ema + profit) / 2;

	stats.count = count;
	stats.avg = avg;
	stats.ema = ema;
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
	var socket = ws[dst.currency];
	var i;

	if (socket)
		socket.time = date.getTime();

	for (i = 0; i < n; i++) {
		var path = alt[i];
		var cost = path.source_amount;
		var src = convert(cost);
		var pair = src.currency + ">" + dst.currency;
		var prev = paths[pair];

 if ($) {
		if (!pairs[pair])
			continue;
 }

		paths[pair] = {
			count: prev ? prev.count + 1 : 1,
			alt: path.paths_computed,
			human: getprice(src, dst),
			price: dst.value / src.value,
			time: date.getTime(),
			cost: cost,
			amount: amount
		};

		judge(pair);

		if ("USD" == dst.currency)
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
	var path = this.pathFind(id, id, dst);

	path.on("update", update);
}

function find(target)
{
	var date = new Date();
	var socket = ws[target];
	var path = paths[target + ">USD"];
	var dst;

	function amount(value, currency)
	{
		return {
			value: value.toFixed(20),
			currency: currency,
			issuer: issuer
		};
	}

	if (socket)
		return;

	if (path)
		dst = path.cost;
	else if ("USD" == target)
		dst = amount(stake, "USD");
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
}

function listen()
{
	ready = true;

	if (pending)
		request();
	else
		find("USD");
}

function estimate(stats)
{
	var date = new Date();
	var since = date.getTime() - stats.time;
	var count = stats.count;
	var profit = stats.profit;
	var ema = stats.ema;
	var avg = stats.avg;

	if (3e3 < since)
		return -1;
	else if (count < 7)
		return -1;
	else if (profit <= 0)
		return profit;
	else if (ema <= 0)
		return ema;
	else
		return (avg + ema) / 2;
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

	for (target in ws) {
		var socket = ws[target];

		if (7e3 < now - socket.time) {
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
