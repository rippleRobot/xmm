function isfiat(currency)
{
	if ("USD" == currency)
		return true;
	else if ("EUR" == currency)
		return true;
	else
		return false;
}

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

	if (isfiat(src.currency) && isfiat(dst.currency))
		return false;
	if (src.issuer == dst.issuer)
		return true;
 
	return false;
}
 
function getpairs(saldo)
{
	var list = [];
	var base, unit, i;
 
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
 
	for (i = list.length - 1; 0 < i; i--) {
		var j = Math.floor(Math.random() * (i + 1));
		var tmp;

		tmp = list[i];
		list[i] = list[j];
		list[j] = tmp;
	}

	return list;
}

function compute(saldo, prev)
{
	var offers = {};
	var pairs = getpairs(saldo);
	var npairs = pairs.length;
	var stake = 2 * Math.sqrt(npairs * fee / saldo["XRP"]);
	var nassets = 0;
	var unit, i;
 
	if (stake < 0.01)
		stake = 0.01;

	for (unit in saldo)
		if (0 < saldo[unit])
			++nassets;

	for (i = 0; i < npairs; i++) {
		var offer = {};
		var pair = pairs[i];
		var units = pair.split(">");
		var base = units.shift();
		var counter = units.shift();
		var src = saldo[base];
		var dst = saldo[counter];
		var old = prev[pair];
 
		if (src < 0)
			src /= -nassets;

		if (dst < 0)
			dst /= -nassets;

		offer.src = stake * src / (1 + stake);
		offer.dst = stake * dst / (1 - stake);

		if (old)
			offer.seq = old.seq;

		offers[pair] = offer;
	}

	process.emit("offers", offers, prev, saldo, stake);
}

process.on("update", compute);
