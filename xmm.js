var account = require("./account");

function check(ledger, saldo, offers)
{
	var unit, pair;

	console.info("Ledger", ledger);

	for (unit in saldo)
		console.info("Balance", saldo[unit], unit);

	for (pair in offers) {
		var dup;

		for (dup = offers[pair]; dup; dup = dup.dup) {
			var src = dup.src;
			var dst = dup.dst;

			console.info("Offer", src, dst, pair);
		}
	}

	if (!pair)
		console.info("No offers");

	process.exit();
}

account.once("update", check);
