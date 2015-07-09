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
	"wss://s-east.ripple.com:443",
	"wss://s-west.ripple.com:443",
	"wss://s1.ripple.com:443",
	"wss://ripple.gatehub.net:443"
];
var options = {
	max_fee: 30000,
	fee_cushion: 1,
	servers: host ? servers.concat([
		host
	]) : servers,
	trusted: false
};
var remote = new ripple.Remote(options);
var account = remote.account(id);
var fee = options.max_fee / 1e6;
var oldsaldo = {};
var pairs = {};
var paths = {};
var units = {};
var template = {};
var targets = {};
var pending = true;
var ready = false;
var busy = 0;
var stall = 1e4;
var maxlag = 5e3;
var mincount = 5;
var ledger, saldo, ws, deposit, offers, noffers, stake;
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
	pending = false;
	ledger = data.ledger_index;

	if (ledger)
		getsaldo(ledger, setsaldo);
	else
		start();
}

function setsaldo(dict)
{
	if (!dict)
		return start();

	saldo = dict;

	remote.request_account_offers({
		account: id,
		ledger: ledger
	}, setstate);
}

function setstate(error, response)
{
	var n = 0;
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

	if (error)
		return start();

	offers = {};

	list = response.offers;
	noffers = list.length;
	stake = 0;

	for (i = 0; i < noffers; i++) {
		var offer = list[i];
		var src = offer.taker_gets;
		var dst = offer.taker_pays;
		var base = getunit(src);
		var counter = getunit(dst);
		var pair = base + ">" + counter;

		src = getvalue(src);
		dst = getvalue(dst);

		offers[pair] = {
			seq: offer.seq,
			src: src,
			dst: dst,
			dup: offers[pair]
		};

		base = saldo[base];
		counter = saldo[counter];

		if ((0 < base) && (0 < counter)) {
			stake += src / base;
			++n;

			stake += dst / counter;
			++n;
		}
	}

	if (n)
		stake /= n;
	else
		stake = 0.05;

	if (!noffers)
		noffers = 2;

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

function showdiff()
{
	var dict = {};
	var unit;

	for (unit in saldo) {
		var last = saldo[unit];
		var prev = oldsaldo[unit];

		if (!prev)
			prev = 0;

		if (last.toPrecision(5) != prev.toPrecision(5))
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

		balance = change + " " + balance.toPrecision(5);
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

	return price.toPrecision(5) + " " + unit.replace(/:.*$/, "");
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
	var src, dst, base, counter, v0, v1, drop;

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
	drop = noffers * fee / (2 * saldo["XRP"]);

	path.profit = v1 / v0 - drop - 1;
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
			socket: socket,
			count: prev ? prev.count + 1 : 1,
			alt: path.paths_computed,
			human: getprice(src, dst),
			price: dst.value / src.value,
			offer: {
				src: src.value,
				dst: dst.value
			},
			time: date.getTime(),
			cost: cost,
			amount: amount
		};

		judge(pair);
	}

	best = choose();
	if (best) {
		var rank = paths[best].rank;

		rank *= 1e4;
		rank = rank.toFixed(3) + "bp";
		console.info(best, rank);

		if (key)
			trade(best);
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
	var path = this.pathFind({
		src_currencies: listsrc(this.dst),
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

	function amount(value, unit)
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

	if (socket)
		return;

	dst = amount(stake * saldo[target], target);

 if ($)
	targets[target].addClass("active");

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
	var unit;

	ready = true;

	if (pending)
		request();
	else
		for (unit in saldo)
			find(unit);
}

function estimate(path)
{
	var date = new Date();
	var since = date.getTime() - path.time;
	var count = path.count;
	var profit = path.profit;

	if (maxlag < since)
		return -1;
	else if (count < mincount)
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

				if (dst == target)
					paths[pair].count = 0;
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
