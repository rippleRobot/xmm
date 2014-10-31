function request()
{
	console.info("Relevant transaction");
	process.emit("request");
}

function listen()
{
	console.info("Watching account");
	account.once("transaction", request);
}

process.on("ready", listen);
