// Order - 1

var WRAPPING_NODE = false;
if (WRAPPING_NODE) {
	console.log("Wrapping Nimiq in NodeJS!");
	var Nimiq = require("@nimiq/core");
} else {
	console.log("Wrapping Nimiq in JS!");
	if (!Nimiq) {
		alert("Nimiq.js library isn't loaded!  Is your ad blocker blocking it?");
	}
}
// After

if (WRAPPING_NODE) {
	module.exports = {
		AccountHelper,
		HubHelper,
		MinerHelper,
		SignatureHelper,
		TransactionHelper,
		UtilHelper,
		NimiqWrapper
	};
}
