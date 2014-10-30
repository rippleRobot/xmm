var account = require("./account");

function check(fee, saldo)
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

	process.exit();
}

account.once("update", check);
