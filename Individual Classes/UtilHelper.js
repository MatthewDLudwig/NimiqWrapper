// Order - 7

class UtilHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	convertLunaToNIM(value) {
		return Nimiq.Policy.lunasToCoins(value);
	}

	convertNIMToLuna(value) {
		return Nimiq.Policy.coinsToLunas(value);
	}

	getTransactionByHash(hash, callback) {
		if (this.theWrapper.nodeType == "FULL") {
			let finalHash = null;
			if (hash instanceof Nimiq.Hash) {
				finalHash = hash;
			} else if (typeof hash == "string") {
				finalHash = Nimiq.Hash.fromHex(hash.replace("0x", ""));
			}

			if (finalHash == null) {
				this.theWrapper.callbacks.error("UtilHelper:getTransactionByHash", "Parameter type incompatible with function.");
			} else {
				this.theWrapper.wrappedNode.blockchain.getTransactionInfoByHash(finalHash).then((tx) => {
					let obj = {
						txHash : tx.transactionHash,
						blockHash : tx.blockHash,
						height : tx.blockHeight,
						index : tx.index,
						sender : tx.sender,
						recipient : tx.recipient
					};

					callback(obj);
				});
			}
		} else {
			this.theWrapper.callbacks.error("UtilHelper:getTransactionByHash", "Can only retrieve txs by hash on full node.");
		}
	}

	getBlockByHash(hash, callback) {
		if (this.theWrapper.nodeType == "FULL") {
			let finalHash = null;
			if (hash instanceof Nimiq.Hash) {
				finalHash = hash;
			} else if (typeof hash == "string") {
				finalHash = Nimiq.Hash.fromHex(hash.replace("0x", ""));
			}

			if (finalHash == null) {
				this.theWrapper.callbacks.error("UtilHelper:getBlockByHash", "Parameter type incompatible with function.");
			} else {
				this.theWrapper.wrappedNode.blockchain.getBlock(finalHash).then((block) => {
					let obj = {
						version : block.version,
						time : block.timestamp,
						height : block.height,
						nonce : block.nonce,
						hash : block.header._hash,
						lastHash : block.prevHash
					};

					callback(obj);
				});
			}
		} else {
			this.theWrapper.callbacks.error("UtilHelper:getBlockByHash", "Can only retrieve blocks by hash on full node.");
		}
	}

	getBlockByHeight(height, callback) {
		if (this.theWrapper.nodeType == "FULL") {
			this.theWrapper.wrappedNode.blockchain.getBlockAt(height).then((block) => {
				let obj = {
					version : block.version,
					time : block.timestamp,
					height : block.height,
					nonce : block.nonce,
					hash : block.header._hash,
					lastHash : block.prevHash
				};

				callback(obj);
			});
		} else {
			this.theWrapper.callbacks.error("UtilHelper:getBlockByHeight", "Can only retrieve blocks by height on full node.");
		}
	}

	getIqonURLFor(obj, png = false, size = 0) {
		let address = null;
		if (obj instanceof Nimiq.Wallet) {
			address = obj.address.toUserFriendlyAddress().split(" ").join("");
		} else if (obj instanceof Nimiq.Address) {
			address = obj.toUserFriendlyAddress().split(" ").join("");
		} else if (typeof obj == "string") {
			address = obj.split(" ").join("");
		}

		if (address == null) {
			this.theWrapper.callbacks.error("UtilHelper:getIqonURLFor", "Parameter type incompatible with function.");
		} else {
			if (png) {
				if (size > 0) {
					return "https://icons.mopsus.com/icon/" + address + "." + size + ".png"
				} else {
					return "https://icons.mopsus.com/icon/" + address + ".png";
				}
			} else {
				return "https://icons.mopsus.com/icon/" + address + ".svg";
			}
		}
	}

	getTransactionRequestURL(obj, amount = 0, message = null) {
		let address = null;
		if (obj instanceof Nimiq.Wallet) {
			address = obj.address.toUserFriendlyAddress().split(" ").join("-");
		} else if (obj instanceof Nimiq.Address) {
			address = obj.toUserFriendlyAddress().split(" ").join("-");
		} else if (typeof obj == "string") {
			address = obj.split(" ").join("-");
		}

		if (address == null) {
			this.theWrapper.callbacks.error("UtilHelper:getTransactionRequestURL", "Parameter type incompatible with function.");
		} else {
			let url = "https://safe.nimiq.com/#/_new-transaction/" + address;
			url = url + "/recipient/" + amount;

			if (message) {
				url = url + message.split(" ").join("%20");
			}

			return url + "_";
		}
	}

	getHTMLSymbol(whichSymbol = true) {
		if (whichSymbol) {
			//NIM Symbol
			return "&#x2B23;";
		} else {
			//Luna Symbol
			return "&#x263E;";
		}
	}
}
