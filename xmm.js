var account = require("./account");

function check(saldo, offers)
{
	var issue = {
		dict: {},
		number: 0
	};
	var stock = {
		dict: {},
		number: 0
	};
	var empty = {
		dict: {},
		number: 0
	};
	var unit, pair;

	for (unit in saldo) {
		var balance = saldo[unit];
		var group;

		console.info("Balance", balance, unit);

		if (0 < balance)
			group = stock;
		else if (balance < 0)
			group = issue;
		else
			group = empty;

		group.dict[unit] = balance;
		++group.number;
	}

	console.info("Assets", stock.number + empty.number);

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
