function log(saldo)
{
	var date = new Date();
	var entry = {
		time: date.getTime(),
		saldo: saldo
	};

	save(entry);
	process.emit("ready");
}

process.on("steady", log);
