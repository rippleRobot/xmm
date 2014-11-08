var pending = true;
var ready = false;
var alive = false;

function tick()
{
	var date = new Date();

	console.info("Alive", date);
	alive = true;
}

function check()
{
	if (alive)
		alive = false;
	else
		process.exit();
}

function request()
{
	if (!ready) {
		pending = true;
		return;
	}

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

setInterval(check, 6e5);
setInterval(request, 3e5);
process.on("update", tick);
account.on("transaction", request);

process.on("ready", listen);
