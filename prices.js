function getseq(offers)
{
	var latest = 0;
	var pair;

	for (pair in offers) {
		var seq = offers[pair].seq;

		if (latest < seq)
			latest = seq;
	}

	return latest;
}

function nassets(saldo)
{
	var n = 0;
	var unit;

	for (unit in saldo)
		if (0 < saldo[unit])
			++n;

	return n;
}

function log(saldo, offers)
{
	var date = new Date();
	var prev = history[history.length - 1];
	var seq = getseq(offers);
	var entry = {
		time: date.getTime(),
		saldo: saldo,
		seq: seq
	};
	var n = nassets(saldo);
	var prices = {};
	var unit, iou;

	for (unit in saldo) {
		var balance = saldo[unit];

		if (0 < balance)
			prices[unit] = balance;
		else
			iou = -balance;
	}

	for (unit in prices)
		prices[unit] *= n / iou;

	entry.prices = prices;
	entry.iou = iou;

	if (prev)
		prev = prev.seq;

	if (!prev)
		prev = 0;
	
	if (prev < seq)
		save(entry);

	process.emit("ready");
}

process.on("steady", log);
