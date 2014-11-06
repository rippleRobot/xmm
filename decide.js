function choose(offers, prev, saldo)
{
	var pending = {};
	var pair;

	function spread(offer, pair)
	{
		var src, dst, base, counter, p0, p1;

		if (!offer)
			return 0;

		src = offer.src;
		dst = offer.dst;
		pair = pair.split(">");
		base = pair.shift();
		base = saldo[base];
		counter = pair.shift();
		counter = saldo[counter];
		p0 = base / counter;
		p1 = src / dst;
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

		if ((base < 0) || (counter < 0))
			return 0;

		v0 = base * counter;
		v1 = (base - src) * (counter + dst);

		if (reset)
			v1 *= 1 - 3 * fee / saldo["XRP"];

		return (v1 - v0) / v0;
	}

	function worth(offer, old, pair)
	{
		s0 = spread(old, pair);
		s1 = spread(offer, pair);
		p0 = profit(old, pair, false);
		p1 = profit(offer, pair, true);

		if (Math.sqrt(2) < s0 / s1)
			return true;
		else if (p0 < p1)
			return true;
		else
			return false;
	}

	function obsolete(offer, prev, pair)
	{
		var src, dst, stake, base, counter, p0, p1;

		if (!prev)
			return true;

		src = offer.src;
		dst = offer.dst;
		p0 = src / dst;
		p1 = prev.src / prev.dst;

		pair = pair.split(">");
		base = pair.shift();
		base = saldo[base];
		counter = pair.shift();
		counter = saldo[counter];

		if (0 < base)
			stake = src / base;
		else
			stake = dst / counter;

		return stake < Math.abs(p1 - p0) / p0;
	}

	for (pair in offers) {
		var offer = offers[pair];
		var units = pair.split(">");
		var base = units.shift();
		var counter = units.shift();

		if ((saldo[base] < 0) || (saldo[counter] < 0)) {
			pending[pair] = offer;
			continue;
		}

		if (worth(offer, prev[pair], pair))
			return pair;
	}

	for (pair in pending)
		if (obsolete(pending[pair], prev[pair], pair))
			return pair;
}

function decide(offers, prev, saldo)
{
	var pair = choose(offers, prev, saldo);

	if (pair)
		process.emit("submit", offers[pair], pair);
	else
		process.emit("ready");
}

process.on("offers", decide);
