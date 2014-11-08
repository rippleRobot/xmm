var pending = true;
var ready = false;

function update()
{
	var date = new Date();

	console.info("Update", date);
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
account.on("transaction", request);
process.on("update", update);

process.on("ready", listen);
