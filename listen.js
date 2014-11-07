var pending = true;
var ready = false;
var alive = false;

function tick()
{
	alive = true;
}

function check()
{
	if (alive) {
		console.info("Alive");
		alive = false;
	} else {
		console.info("Stuck");
		process.exit();
	}
}

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

setInterval(check, 3e5);
setInterval(request, 6e4);
process.on("update", tick);
account.on("transaction", request);

process.on("ready", listen);
