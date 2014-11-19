function choose(offers, prev, saldo, stake)
{
	var issued = {};
	var pending = {};
	var nassets = 0;
	var pair, unit;

	function diff(offer, old)
	{
		var p0, p1;

		if (!old)
			return 1;

		p0 = old.src / old.dst;
		p1 = offer.src / offer.dst;
		return Math.abs(p1 - p0) / p0;
	}

	function profit(offer, pair, reset)
	{
		var src, dst, base, counter, v0, v1;

		if (!offer)
			return 0;

		src = offer.src;
		dst = offer.dst;
		pair = pair.split(">");
		base = pair.shift();
		base = saldo[base];
		counter = pair.shift();
		counter = saldo[counter];

		if (base < 0) {
			src = -src;
			dst /= nassets;
		}

		if (counter < 0) {
			src /= nassets;
			dst = -dst;
		}

		v0 = base * counter;
		v1 = (base - src) * (counter + dst);

		if (reset)
			v1 *= 1 - Math.pow(stake / 2, 2);

		return v1 / v0 - 1;
	}

	function worth(offer, old, pair)
	{
		var p0 = profit(old, pair, false);
		var p1 = profit(offer, pair, true);
		var delta = diff(offer, old);

		return (stake < delta) || (p0 < p1);
	}

	for (unit in saldo)
		if (0 < saldo[unit])
			++nassets;

	for (pair in offers) {
		var offer = offers[pair];
		var units = pair.split(">");
		var base = units.shift();
		var counter = units.shift();

		if ((saldo[base] < 0) || (saldo[counter] < 0))
			issued[pair] = offer;
		else if (0 < profit(prev[pair], pair, false))
			pending[pair] = offer;
		else
			return pair;
	}

	for (pair in pending)
		if (worth(pending[pair], prev[pair], pair))
			return pair;

	for (pair in issued)
		if (worth(issued[pair], prev[pair], pair))
			return pair;
}

function decide(offers, prev, saldo, stake)
{
	var pair = choose(offers, prev, saldo, stake);
	var unit;

	if (!pair) {
		process.emit("steady", saldo, prev);
		return;
	}

	console.info("Stake", stake);
	for (unit in saldo)
		console.info("Balance", saldo[unit], unit);

	process.emit("submit", offers[pair], pair);
}

process.on("offers", decide);
