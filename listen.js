var pending = true;
var ready = false;

function request()
{
	if (!ready) {
		console.info("Schedule update");
		pending = true;
		return;
	}

	console.info("Request update");
	ready = false;
	pending = false;
	process.emit("request");
}

function listen()
{
	ready = true;

	if (pending)
		request();
}

account.on("transaction", request);

process.on("ready", listen);
