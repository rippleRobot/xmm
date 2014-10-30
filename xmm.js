var account = require("./account");

function check(fee, saldo, offers)
{
	var issue = {
		dict: {},
		number: 0
	};
	var stock = {
		dict: {},
		number: 0
	};
	var unit, pair;

	console.info("Fee ratio", fee / saldo["XRP"]);

	for (unit in saldo) {
		var balance = saldo[unit];
		var group;

		console.info("Balance", balance, unit);

		if (balance < 0)
			group = issue;
		else
			group = stock;

		group.dict[unit] = balance;
		++group.number;
	}

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
