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
			value: value.toFixed(20),
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

process.once("submit", create);
