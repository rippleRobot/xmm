function choose(offers, prev, saldo)
{
	var pending = {};
	var pair;

	function worth(offer, old, pair)
	{
		return !old;
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
		if (worth(pending[pair], prev[pair], pair))
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
