var pending = true;
var ready = false;
var alive = false;

function update()
{
	var date = new Date();

	console.info("Update", date);
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

setInterval(request, 3e5);
setInterval(check, 6e5);
account.on("transaction", request);
process.on("update", update);

process.on("ready", listen);
