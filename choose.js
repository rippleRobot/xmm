function choose(offers, prev, saldo, stake, cost)
{
	var good = {};
	var fair = {};
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

		if (base < 0)
			src *= -nassets;

		if (counter < 0)
			dst *= -nassets;

		v0 = base * counter;
		v1 = (base - src) * (counter + dst);

		if (reset)
			v1 *= 1 - cost;

		return v1 / v0 - 1;
	}

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

	for (unit in saldo)
		if (0 < saldo[unit])
			++nassets;

	for (pair in offers) {
		var old = prev[pair];
		var offer = offers[pair];
		var p0 = profit(old, pair, false);
		var p1 = profit(offer, pair, true);
		var delta = diff(offer, old);

		good[pair] = p1 - p0;
		fair[pair] = delta - 2 * stake * (Math.sqrt(2) - 1);
	}

	good = top(good);
	if (good)
		return good;

	fair = top(fair);
	if (fair)
		return fair;
}

function decide(offers, prev, saldo, stake, cost)
{
	var pair = choose(offers, prev, saldo, stake, cost);
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
