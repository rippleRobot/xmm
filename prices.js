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

	if (prev)
		prev = prev.seq;

	if (!prev)
		prev = 0;
	
	if (prev < seq)
		save(entry);

	process.emit("ready");
}

process.on("steady", log);
