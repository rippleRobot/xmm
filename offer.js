function choose(offers, prev, saldo)
{
	var pending = {};
	var pair;

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
		p0 = profit(old, pair, false);
		p1 = profit(offer, pair, true);

		return (p0 < p1);
	}

	function obsolete(offer, pair)
	{
		return !offer;
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
		if (obsolete(prev[pair], pair))
			return pair;
}

function decide(offers, prev, saldo)
{
	var pair = choose(offers, prev, saldo);

	debug({
		existing: prev,
		computed: offers,
		selected: pair
	});

	if (pair)
		process.emit("submit", offers[pair], pair);
	else
		process.emit("ready");
}

process.on("offer", decide);
