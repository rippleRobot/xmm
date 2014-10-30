require("./update");

function check(fee, saldo)
{
	var unit;

	console.info("Fee ratio", fee / saldo["XRP"]);

	for (unit in saldo)
		console.info("Balance", saldo[unit], unit);

	process.exit();
}

process.once("update", check);
