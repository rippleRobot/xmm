require("./offers");
require("./update");

function compute(fee, saldo, prev)
{
	var offers = {};
	var stake = Math.pow(fee / saldo["XRP"], 1 / 3);
	var base;
 
	console.info("Stake", stake);

	for (base in saldo) {
		var src = saldo[base];
		var counter;
 
		console.info("Balance", saldo[base], base);

		if (src <= 0)
			continue;

		for (counter in saldo) {
			var dst = saldo[counter];
			var pair = base + ">" + counter;
			var old = prev[pair];
 
			if (base == counter)
				continue;
 
			if (dst < 0)
				continue;

			offers[pair] = {
				src: stake * src / (1 + stake),
				dst: stake * dst / (1 - stake),
				seq: old ? old.seq : undefined
			};
		}
	}
 
	process.emit("offers", offers, prev, saldo);
}

process.on("update", compute);
