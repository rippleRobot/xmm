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

	remote.request_account_balance({
		account: id,
		ledger: ledger
	}, setxrp);
}

function setxrp(error, response)
{
	if (error) {
		console.error("Failed to get balance");
		return start();
	}

	saldo = {};

	saldo["XRP"] = response.to_number() / 1e6;

	remote.request_account_lines({
		account: id,
		ledger: ledger
	}, setlines);
}

function setlines(error, response)
{
	var shares = 0;
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

		if (balance < 0) {
			unit = currency + ":" + id;

			if (!saldo[unit])
				saldo[unit] = 0;

			saldo[unit] += balance;
		} else if (active) {
			unit = currency + ":" + account;
			saldo[unit] = balance;
		}
	}

	remote.request_account_offers({
		account: id,
		ledger: ledger
	}, update);
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
	process.emit("update", saldo, offers);
}

process.once("request", start);
