require("./update");
require("./offers");

function compute(fee, saldo)
{
	var offers = {};
	var stake = Math.pow(fee / saldo["XRP"], 1 / 3);
	var base;
 
	console.info("Stake", stake);

	for (base in saldo) {
		var src = saldo[base];
		var counter;
 
		console.info("Balance", saldo[base], base);

		for (counter in saldo) {
			var dst = saldo[counter];
			var pair = base.concat(">", counter);
 
			if (base == counter)
				continue;
 
			offers[pair] = {
				src: stake * src / (1 + stake),
				dst: stake * dst / (1 - stake)
			};
		}
	}
 
	process.emit("offer", offers);
}

process.once("update", compute);
