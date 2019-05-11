// Order - 5

class TransactionHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	getRemainingFreeTransactionsFor(obj) {
		let watchAddr = null;
		if (obj instanceof Nimiq.Wallet) {
			watchAddr = obj.address;
		} else if (obj instanceof Nimiq.Address) {
			watchAddr = obj;
		} else if (typeof obj == "string") {
			watchAddr = Nimiq.Address.fromUserFriendlyAddress(obj);
		}

		if (watchAddr == null) {
			this.theWrapper.callbacks.error("TransactionHelper:getRemainingFreeTransactionsFor", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
			return 0;
		} else {
			return Math.max(0, 10 - this.theWrapper.wrappedNode.mempool.getTransactionsBySender(watchAddr).filter((tx) => {
				return tx.fee == 0;
			}).length);
		}
	}

	watchForTransactionsTo(obj, callback) {
		let watchAddr = null;
		if (obj instanceof Nimiq.Wallet) {
			watchAddr = obj.address;
		} else if (obj instanceof Nimiq.Address) {
			watchAddr = obj;
		} else if (typeof obj == "string") {
			watchAddr = Nimiq.Address.fromUserFriendlyAddress(obj);
		}

		if (watchAddr == null) {
			this.theWrapper.callbacks.error("TransactionHelper:watchForTransactionsTo", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
		} else {
			if (this.theWrapper.nodeType == "NANO") {
				this.theWrapper.wrappedNode.consensus.addSubscriptions(watchAddr);
			}

			let trackID = this.theWrapper.wrappedNode.mempool.on("transaction-added", (tx) => {
				if (tx.recipient.equals(watchAddr)) {
					callback(tx);
				}
			});

			return {
				type : "to",
				watching : watchAddr.toUserFriendlyAddress(),
				stopWatching : () => {
					this.theWrapper.wrappedNode.mempool.off("transaction-added", trackID);
				}
			}
		}
	}

	watchForTransactionsFrom(obj, callback) {
		let watchAddr = null;
		if (obj instanceof Nimiq.Wallet) {
			watchAddr = obj.address;
		} else if (obj instanceof Nimiq.Address) {
			watchAddr = obj;
		} else if (typeof obj == "string") {
			watchAddr = Nimiq.Address.fromUserFriendlyAddress(obj);
		}

		if (watchAddr == null) {
			this.theWrapper.callbacks.error("TransactionHelper:watchForTransactionsFrom", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
		} else {
			if (this.theWrapper.nodeType == "NANO") {
				this.theWrapper.wrappedNode.consensus.addSubscriptions(watchAddr);
			}

			let trackID = this.theWrapper.wrappedNode.mempool.on("transaction-added", (tx) => {
				if (tx.sender.equals(watchAddr)) {
					callback(tx);
				}
			});

			return {
				type : "from",
				watching : watchAddr.toUserFriendlyAddress(),
				stopWatching : () => {
					this.theWrapper.wrappedNode.mempool.off("transaction-added", trackID);
				}
			}
		}
	}

	watchForTransactionsInvolving(obj, callback) {
		let watchAddr = null;
		if (obj instanceof Nimiq.Wallet) {
			watchAddr = obj.address;
		} else if (obj instanceof Nimiq.Address) {
			watchAddr = obj;
		} else if (typeof obj == "string") {
			watchAddr = Nimiq.Address.fromUserFriendlyAddress(obj);
		}

		if (watchAddr == null) {
			this.theWrapper.callbacks.error("TransactionHelper:watchForTransactionsTo", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
		} else {
			if (this.theWrapper.nodeType == "NANO") {
				this.theWrapper.wrappedNode.consensus.addSubscriptions(watchAddr);
			}

			let trackID = this.theWrapper.wrappedNode.mempool.on("transaction-added", (tx) => {
				if (tx.sender.equals(watchAddr) || tx.recipient.equals(watchAddr)) {
					callback(tx);
				}
			});

			return {
				type : "all",
				watching : watchAddr.toUserFriendlyAddress(),
				stopWatching : () => {
					this.theWrapper.wrappedNode.mempool.off("transaction-added", trackID);
				}
			}
		}
	}

	sendTransaction(fromWallet, options = { }, callback = (receipt) => { }) {
		let txDetails = {
			sender : fromWallet,
			recipient : Nimiq.Address.fromUserFriendlyAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000"),
			value : 0,
			fee : 0,
			validity : this.theWrapper.blockHeight,
			extraData : null
		};

		if (options.amount) txDetails.value = options.amount;
		if (options.expiration) txDetails.validity = options.expiration;

		if (options.address) {
			if (typeof options.address == "string") {
				txDetails.recipient = Nimiq.Address.fromUserFriendlyAddress(options.address);
			} else {
				txDetails.recipient = options.address;
			}
		}

		if (options.fee) {
			if (options.fee > 0) {
				if (options.fee < 138) {
					this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", NimiqWrapper.ERROR_MESSAGES.BAD_FEE);
				} else {
					txDetails.fee = options.fee;
				}
			} else {
				this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", NimiqWrapper.ERROR_MESSAGES.BAD_FEE);
			}
		}

		if (options.data) {
			if (typeof options.data == "string") {
				if (options.data.trim().length > 0) {
					txDetails.extraData = Nimiq.BufferUtils.fromAscii(options.data.trim());
				}
			} else {
				txDetails.extraData = options.data;
			}
		}

		if (txDetails.fee == 0 && this.getRemainingFreeTransactionsFor(txDetails.sender) == 0) {
			this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", NimiqWrapper.ERROR_MESSAGES.FREE_TX_LIMIT);
		} else {
			let tx = null;
			if (txDetails.extraData) {
				tx = new Nimiq.ExtendedTransaction(
					txDetails.sender.address,
					Nimiq.Account.Type.BASIC,
					txDetails.recipient,
					Nimiq.Account.Type.BASIC,
					txDetails.value,
					txDetails.fee,
					txDetails.validity,
					Nimiq.Transaction.Flag.NONE,
					txDetails.extraData
				);

				let keyPair = txDetails.sender._keyPair;
				let signature = Nimiq.Signature.create(
					keyPair.privateKey,
					keyPair.publicKey,
					tx.serializeContent()
				);
				let proof = Nimiq.SignatureProof.singleSig(keyPair.publicKey, signature);
				tx.proof = proof.serialize();
			} else {
				tx = txDetails.sender.createTransaction(
					txDetails.recipient,
					txDetails.value,
					txDetails.fee,
					txDetails.validity
				);
			}

			if (this.theWrapper.nodeType == "NANO") {
				this.theWrapper.wrappedNode.consensus.relayTransaction(tx);
			} else {
				this.theWrapper.wrappedNode.mempool.pushTransaction(tx);
			}

			this.theWrapper.wrappedNode.mempool.on("transaction-added", (receipt) => {
				if (receipt._hash.equals(tx._hash)) {
					callback(receipt);
				}
			});
		}
	}
}
