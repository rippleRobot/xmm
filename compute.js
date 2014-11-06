function ispair(src, dst)
{
	if (src.unit == dst.unit)
		return false;
 
	if ("XRP" == src.currency)
		return true;
	if ("XRP" == dst.currency)
		return true;

	if (id == src.issuer)
		return false;
	if (id == dst.issuer)
		return false;

	if (src.currency == dst.currency)
		return true;
	if (src.issuer == dst.issuer)
		return true;
 
	return false;
}
 
function getpairs(saldo)
{
	var list = [];
	var base, unit;
 
	for (base in saldo) {
		var src = {};
		var counter;
 
		unit = base.split(":");
		src.currency = unit.shift();
		src.issuer = unit.shift();
		src.unit = base;
 
		for (counter in saldo) {
			var dst = {};
			var pair = base.concat(">", counter);
 
			unit = counter.split(":");
			dst.currency = unit.shift();
			dst.issuer = unit.shift();
			dst.unit = counter;
 
			if (ispair(src, dst))
				list.push(pair);
		}
	}
 
	return list;
}

function compute(saldo, prev, reserve)
{
	var offers = {};
	var pairs = getpairs(saldo);
	var npairs = pairs.length;
	var stake = Math.sqrt(3 * npairs * fee / saldo["XRP"]);
	var nassets = 0;
	var unit, i, nitems, spare;
 
	console.info("Stake", stake);

	for (unit in saldo)
		if (0 < saldo[unit])
			++nassets;

	nitems = nassets + npairs;
	spare = (reserve.base + nitems * reserve.inc) / nassets;

	for (i = 0; i < npairs; i++) {
		var offer = {};
		var pair = pairs[i];
		var units = pair.split(">");
		var base = units.shift();
		var counter = units.shift();
		var src = saldo[base];
		var dst = saldo[counter];
		var old = offers[pair];
 
		if (src < 0) {
			offer.src = -stake * src / nassets;
			offer.dst = stake * dst;
		} else if (dst < 0) {
			offer.src = stake * (src - spare);
			offer.dst = -stake * dst / nassets;
		} else {
			offer.src = stake * src / (1 + stake);
			offer.dst = stake * dst / (1 - stake);
		}

		if (old)
			offer.seq = old.seq;

		offers[pair] = offer;
	}

	process.emit("offer", offers, prev, saldo);
}

process.on("update", compute);
