function choose(offers, prev, saldo)
{
	var pair;

	for (pair in offers) {
		var offer = offers[pair];
		var src = offer.src;
		var dst = offer.dst;
		var old = prev[pair];

		console.info("Computed", src, dst, pair);

		if (old) {
			src = old.src;
			dst = old.dst;
			console.info("Existing", src, dst, pair);
		} else {
			process.emit("submit", offer, pair);
			return;
		}
	}

	process.exit();
}

process.on("offer", choose);
