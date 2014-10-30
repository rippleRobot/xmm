function show(offers, prev)
{
	var pair;

	for (pair in offers) {
		var offer = offers[pair];
		var src = offer.src;
		var dst = offer.dst;
		var old = prev[pair];

		console.info("Create", src, dst, pair);

		if (old) {
			src = old.src;
			dst = old.dst;
			console.info("Cancel", src, dst, pair);
		}
	}

	process.exit();
}

process.on("offer", show);
