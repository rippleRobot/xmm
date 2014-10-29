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
	var empty = {
		dict: {},
		number: 0
	};
	var missing = {};
	var unit, pair, nassets;

	console.info("Fee ratio", fee / saldo["XRP"]);

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

	nassets = stock.number + empty.number;
	console.info("Number of assets", nassets);

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

	if (stock.number < nassets) {
		for (unit in stock.dict) {
			var src = stock.dict[unit] / nassets;
			var target;

			for (target in empty.dict) {
				missing[unit + ">" + target] = {
					src: src,
					dst: 0
				};
			}
		}

	}

	for (pair in missing) {
		var offer = missing[pair];
		var src = offer.src;
		var dst = offer.dst;

		console.info("Create", src, dst, pair);
	}

	process.exit();
}

account.once("update", check);
