var WRAPPING_NODE = false;
if (WRAPPING_NODE) {
	console.log("Wrapping Nimiq in NodeJS!");
	var Nimiq = require("@nimiq/core");
} else {
	console.log("Wrapping Nimiq in JS!");
}

class KeyguardHelper {
	/*
		Variables:
			theWrapper
			wrappedClient
			appName
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
		this.wrappedClient = null;
		this.appName = "Nimiq Application";
	}

	initKeyguard(keyguardURL, appName) {
		this.wrappedClient = new AccountsClient(keyguardURL);
		this.appName = appName;
	}

	requestAddress(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", "Keyguard cannot be used in NodeJS!");
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", "Keyguard not yet initialized!");
			return;
		}

		let obj = {
			appName : this.appName
		};

		if (options.appName) obj.appName = options.appName;

		this.wrappedClient.chooseAddress(obj).then((addr) => {
			callback(addr);
		}).catch((err) => {
			if (options.onError) {
				options.onError(err);
			} else {
				this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", err);
			}
		});
	}

	requestSignature(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", "Keyguard cannot be used in NodeJS!");
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", "Keyguard not yet initialized!");
			return;
		}

		let obj = {
			appName : this.appName,
			message : "Please sign this!"
		};

		if (options.appName) obj.appName = options.appName;
		if (options.address) obj.signer = options.address;
		if (options.data) {
			if (typeof options.data == "string") {
				obj.message = options.data;
			} else if (options.data instanceof Uint8Array) {
				obj.message = options.data;
			} else {
				obj.message = JSON.stringify(options.data, null, "\t");
			}
		}

		this.wrappedClient.signMessage(obj).then((signed) => {
			callback(signed);
		}).catch((err) => {
			if (options.onError) {
				options.onError(err);
			} else {
				this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", err);
			}
		});
	}

	requestTransaction(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", "Keyguard cannot be used in NodeJS!");
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", "Keyguard not yet initialized!");
			return;
		}

		let obj = {
			appName : this.appName,
			recipient : "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
			value : 0
		};

		if (options.appName) obj.appName = options.appName;
		if (options.logoURL) obj.shopLogoUrl = options.logoURL;
		if (options.address) obj.recipient = options.address;
		if (options.addrType) obj.recipientType = options.addrType;
		if (options.amount) obj.value = options.amount;
		if (options.fee) obj.fee = options.fee;
		if (options.flags) obj.flags = options.flags;
		if (options.expiration) obj.validityDuration = options.expiration;
		if (options.data) {
			if (typeof options.data == "string") {
				if (options.data.trim().length > 0) {
					obj.extraData = new Uint8Array(options.data.length);
					for (let i = 0; i < options.data.length; ++i) {
						obj.extraData[i] = options.data.charCodeAt(i);
					}
				}
			} else {
				obj.extraData = options.data;
			}
		}

		this.wrappedClient.checkout(obj).then((result) => {
			callback(result);
		}).catch((err) => {
			if (options.onError) {
				options.onError(err);
			} else {
				this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", err);
			}
		});
	}
}

class MinerHelper {
	/*
		Variables:
			theWrapper
			wrappedMiner
			minerOptions
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
		this.wrappedMiner = null;
	}

	initMiner(options = { }) {
	  	this.minerOptions = {
			pool : true,
			addr : Nimiq.Address.fromUserFriendlyAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000"),
			data : new Uint8Array(0),
			host : "us.nimpool.io",
			port : 8444
		};

		if (options.soloMine) this.minerOptions.pool = false;
		if (options.poolHost) this.minerOptions.host = options.poolHost;
		if (options.poolPort) this.minerOptions.port = options.poolPort;
		if (options.extraData) {
			if (typeof options.extraData == "string") {
				this.minerOptions.data = Nimiq.BufferUtils.fromAscii(options.extraData);
			} else if (options.extraData instanceof Uint8Array) {
				this.minerOptions.data = options.extraData;
			} else {
				this.theWrapper.callbacks.error("MinerHelper:initMiner", "Invalid type for extraData option, using none.");
			}
		}
		if (options.address) {
			if (options.address instanceof Nimiq.Wallet) {
				this.minerOptions.addr = options.address.address;
			} else if (options.address instanceof Nimiq.Address) {
				this.minerOptions.addr = options.address;
			} else if (typeof options.address == "string") {
				this.minerOptions.addr = Nimiq.Address.fromUserFriendlyAddress(options.address);
			} else {
				this.theWrapper.callbacks.error("MinerHelper:initMiner", "Invalid type for address option, using Nimiq Burn Address.");
			}
		}

		if (this.minerOptions.pool) {
			this.wrappedMiner = new Nimiq.SmartPoolMiner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.accounts, this.theWrapper.wrappedNode.mempool, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, Nimiq.BasePoolMiner.generateDeviceId(this.theWrapper.wrappedNode.network.config), this.minerOptions.data);
			this.wrappedMiner.on('connection-state', state => {
				if (state == Nimiq.BasePoolMiner.ConnectionState.CONNECTED) {
					this.theWrapper.callbacks.connectionState("connected");
				} else if (state == Nimiq.BasePoolMiner.ConnectionState.CONNECTING) {
					this.theWrapper.callbacks.connectionState("connecting");
				} else if (state == Nimiq.BasePoolMiner.ConnectionState.CLOSED) {
					this.theWrapper.callbacks.connectionState("disconnected");
				} else {
					this.theWrapper.callbacks.error("MinerHelper:initMiner", "Unknown connection state occurred!");
				}
			});
		} else {
			this.wrappedMiner = new Nimiq.Miner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.accounts, this.theWrapper.wrappedNode.mempool, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, this.minerOptions.data);

		}

		this.theWrapper.wrappedNode.miner = this.wrappedMiner;
		this.wrappedMiner.on('start', () => this.theWrapper.callbacks.minerChanged('started'));
		this.wrappedMiner.on('stop', () => this.theWrapper.callbacks.minerChanged('stopped'));

		this.wrappedMiner.connect(this.minerOptions.host, this.minerOptions.port);
	}

	startMining() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:startMining", "Miner not yet initialized!");
			return;
		}

		this.wrappedMiner.startWork();
	}

	stopMining() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:stopMining", "Miner not yet initialized!");
			return;
		}

		this.wrappedMiner.stopWork();
	}

	estimateRewardPerHour() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:estimateRewardPerHour", "Miner not yet initialized!");
			return;
		}

		let myHash = this.wrappedMiner.hashrate;
		let goHash = this.theWrapper.globalHashrate;
		let reward = Nimiq.Policy.lunasToCoins(Nimiq.Policy.blockRewardAt(this.theWrapper.blockHeight));
		let perBlock = (myHash / goHash) * reward;

		return perBlock * (60 / 1); //1 block per minute, 60 minutes in an hour.
	}

	get hashrate() {
		return this.wrappedMiner.hashrate;
	}

	get poolBalance() {
		return this.wrappedMiner.balance;
	}

	get payoutBalance() {
		return this.wrappedMiner.confirmedBalance;
	}

	get threads() {
		return this.wrappedMiner.threads;
	}

	set threads(t) {
		this.wrappedMiner.threads = t;
	}
}

class AccountHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	getFriendlyAddress(obj) {
		if (obj instanceof Nimiq.Wallet) {
			return obj.address.toUserFriendlyAddress();
		} else if (obj instanceof Nimiq.Address) {
			return obj.toUserFriendlyAddress();
		} else {
			this.theWrapper.callbacks.error("AccountHelper:getFriendlyAddress", "Parameter type incompatible with function.");
		}
	}

	getBalance(obj, callback) {
		let lookupAddr = null;

		if (obj instanceof Nimiq.Wallet) {
			lookupAddr = obj.address;
		} else if (obj instanceof Nimiq.Address) {
			lookupAddr = obj;
		} else if (typeof obj == "string") {
			lookupAddr = Nimiq.Address.fromUserFriendlyAddress(obj);
		}

		if (lookupAddr) {
			if (this.theWrapper.wrappedNode.accounts) {
				this.theWrapper.wrappedNode.accounts.get(lookupAddr).then((account) => {
					callback(account.balance);
				});
			} else {
				this.theWrapper.wrappedNode.consensus.getAccount(lookupAddr).then((account) => {
					callback(account ? account.balance : 0);
				});
			}
		} else {
			this.theWrapper.callbacks.error("AccountHelper:getBalance", "Parameter type incompatible with function.");
		}
	}

	createWallet() {
		return Nimiq.Wallet.generate();
	}

	importWalletFromHexKey(key) {
		let privateKey = Nimiq.PrivateKey.unserialize(Nimiq.BufferUtils.fromHex(key.replace("0x", "")));
		let keypair = Nimiq.KeyPair.derive(privateKey);
		return new Nimiq.Wallet(keypair);
	}

	importWalletFromMnemonic(words) {
		let mnemonic = null;

		if (typeof words == "string") {
			mnemonic = words.split(" ");
		} else {
			mnemonic = words;
		}

		if (mnemonic == null) {
			this.theWrapper.callbacks.error("AccountHelper:importWalletFromMnemonic", "Parameter type incompatible with function.");
		} else {
			let entropy = null;
			if (Nimiq.MnemonicUtils.getMnemonicType(mnemonic) == Nimiq.MnemonicUtils.MnemonicType.LEGACY) {
				entropy = Nimiq.MnemonicUtils.legacyMnemonicToEntropy(mnemonic);
			} else {
				entropy = Nimiq.MnemonicUtils.mnemonicToEntropy(mnemonic);
			}

			let keypair = Nimiq.KeyPair.derive(entropy);
			return new Nimiq.Wallet(keypair);
		}
	}

	importWalletFromBuffer(buffer) {
		return Nimiq.Wallet.loadPlain(buffer);
	}

	importWalletFromEncryptedBuffer(buffer, password, callback, errorCallback = null) {
		Nimiq.Wallet.loadEncrypted(buffer, password).then((result) => {
			callback(result);
		}).catch((err) => {
			if (errorCallback) {
				errorCallback(err);
			} else {
				this.theWrapper.callbacks.error("AccountHelper:importWalletFromEncryptedBuffer", err);
			}
		});
	}

	exportWalletToHexKey(wallet) {
		return Nimiq.BufferUtils.toHex(wallet._keyPair.privateKey.serialize());
	}

	// Will be changed to default to false once legacy wallets are actually legacy in the mainnet.
	// Currently they're only legacy on the testnet.
	exportWalletToMnemonic(wallet, legacy = true) {
		let privateKey = wallet._keyPair.privateKey;

		if (legacy) {
			return Nimiq.MnemonicUtils.entropyToLegacyMnemonic(privateKey.serialize());
		} else {
			return Nimiq.MnemonicUtils.entropyToMnemonic(privateKey.serialize());
		}
	}

	exportWalletToBuffer(wallet) {
		return wallet.exportPlain();
	}

	exportWalletToEncryptedBuffer(wallet, password, callback) {
		wallet.exportEncrypted(password).then((result) => {
			callback(result);
		});
	}
}

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
			this.theWrapper.callbacks.error("TransactionHelper:getRemainingFreeTransactionsFor", "Parameter type incompatible with function.");
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
			this.theWrapper.callbacks.error("TransactionHelper:watchForTransactionsTo", "Parameter type incompatible with function.");
		} else {
			if (this.theWrapper.nodeType == "NANO") {
				nimiq.consenus.addSubscriptions(watchAddr);
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
			this.theWrapper.callbacks.error("TransactionHelper:watchForTransactionsFrom", "Parameter type incompatible with function.");
		} else {
			if (this.theWrapper.nodeType == "NANO") {
				nimiq.consenus.addSubscriptions(watchAddr);
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
					this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", "Fee must either be 0 or greater than 138 Luna.  Less than 138 Luna is treated as feeless.");
				} else {
					txDetails.fee = options.fee;
				}
			} else {
				this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", "Negative fee not allowed, sending transaction without a fee.");
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
			this.theWrapper.callbacks.error("TransactionHelper:sendTransaction", "Can only have 10 feeless transactions in the mempool per sender, try again later or add a fee.");
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

class SignatureHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	signMessage(wallet, message) {
		let obj = {
			private : wallet._keyPair.privateKey,
			public : wallet._keyPair.publicKey,
			data : null
		}

		if (typeof message == "string") {
			obj.data = Nimiq.BufferUtils.fromAscii(txDetails.data);
		} else if (message instanceof Uint8Array) {
			obj.data = message;
		} else {
			obj.data = Nimiq.BufferUtils.fromAscii(JSON.stringify(message, null, "\t"));
		}

		return Nimiq.Signature.create(obj.private, obj.public, obj.data);
	}

	verifyKeyguardSignature(signedMessage) {
		return this.verifyRawSignature(signedMessage.signature, signedMessage.signerPublicKey, signedMessage.message);
	}

	verifyRawSignature(signature, publicKey, message) {
		if (!(signature instanceof Nimiq.Signature)) {
			signature = new Nimiq.Signature(signature);
		}

		if (!(publicKey instanceof Nimiq.PublicKey)) {
			publicKey = new Nimiq.PublicKey(publicKey);
		}

		if (typeof message == "string") {
			message = Nimiq.BufferUtils.fromUtf8(txDetails.data);
		} else if (!(message instanceof Uint8Array)) {
			message = Nimiq.BufferUtils.fromUtf8(JSON.stringify(message, null, "\t"));
		}

		return signature.verify(publicKey, message);
	}

}

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

class NimiqWrapper {
	/*
		Variables:
			wrappedNode
			callbacks
			nodeOptions
			keyguardHelper
			minerHelper
			accountHelper
			transactionHelper
			signatureHelper
			utilHelper
	*/

	constructor(options = { }) {
		this.wrappedNode = null;
		this.callbacks = {
			error : (where, err) => {
				console.log("Error at '" + where + "' occured with message: '" + err + "'");
			},
			consensus : (status) => { },
			syncStatus : (status) => { },
			peersChanged : () => { },
			peerJoined : (peer) => { },
			headChanged : () => { },
			minerChanged : (status) => { },
			connectionState : (status) => { }
		};

		if (options.errorCallback) this.callbacks.error = options.errorCallback;
		if (options.consensusCallback) this.callbacks.consensus = options.consensusCallback;
		if (options.syncStatusCallback) this.callbacks.syncStatus = options.syncStatusCallback;
		if (options.peersChangedCallback) this.callbacks.peersChanged = options.peersChangedCallback;
		if (options.peerJoinedCallback) this.callbacks.peerJoined = options.peerJoinedCallback;
		if (options.headChangedCallback) this.callbacks.headChanged = options.headChangedCallback;
		if (options.minerChangedCallback) this.callbacks.minerChanged = options.minerChangedCallback;
		if (options.connectionStateCallback) this.callbacks.connectionState = options.connectionStateCallback;

		this.keyguardHelper = new KeyguardHelper(this);
		this.minerHelper = new MinerHelper(this);
		this.accountHelper = new AccountHelper(this);
		this.transactionHelper = new TransactionHelper(this);
		this.signatureHelper = new SignatureHelper(this);
		this.utilHelper = new UtilHelper(this);
	}

	initNode(options = { }) {
		this.nodeOptions = {
			network : "MAIN",
			type : "LIGHT",
			debug : false,
			ready : () => {

			}
		};

		if (options.network) this.nodeOptions.network = options.network.toUpperCase();
		if (options.type) this.nodeOptions.type = options.type.toUpperCase();
		if (options.debug) this.nodeOptions.debug = options.debug;

		if (options.whenReady) this.nodeOptions.ready = options.whenReady;

		if (WRAPPING_NODE) {
			this.innerInit();
		} else {
			Nimiq.init(async () => {
				await this.innerInit();
			}, (error) => {
				if (error === Nimiq.ERR_WAIT) {
					this.callbacks.error("NimiqWrapper:initNode", "Nimiq node is already open in another tab or window with same origin.");
				} else if (error === Nimiq.ERR_UNSUPPORTED) {
					this.callbacks.error("NimiqWrapper:initNode", "Browser does not support features required for Nimiq.");
				} else {
					this.callbacks.error("NimiqWrapper:initNode", "Uknown error occurred during initialization.");
				}
			});
		}
	}

	async innerInit() {
		let instance = {};

		if (this.nodeOptions.network == "TEST") {
			Nimiq.GenesisConfig.test();
		} else if (this.nodeOptions.network == "MAIN") {
			Nimiq.GenesisConfig.main();
		} else if (this.nodeOptions.network == "DEV") {
			Nimiq.GenesisConfig.dev();
		} else if (this.nodeOptions.network == "BOUNTY") {
			Nimiq.GenesisConfig.bounty();
		} else {
			this.callbacks.error("NimiqWrapper:innerInit", "Unknown network requested: " + this.nodeOptions.network);
			return;
		}

		if (this.nodeOptions.type == "NANO") {
			instance.consensus = await Nimiq.Consensus.nano();
		} else if (this.nodeOptions.type == "LIGHT") {
			instance.consensus = await Nimiq.Consensus.light();
		} else if (this.nodeOptions.type == "FULL") {
			instance.consensus = await Nimiq.Consensus.full();
		} else {
			this.callbacks.error("NimiqWrapper:innerInit", "Unknown node type requested: " + this.nodeOptions.type);
			return;
		}

		instance.blockchain = instance.consensus.blockchain;
		instance.mempool = instance.consensus.mempool;
		instance.network = instance.consensus.network;
		instance.accounts = instance.blockchain.accounts;

		this.wrappedNode = instance;
		if (!WRAPPING_NODE && this.nodeOptions.debug) {
			window.nimiq = this.wrappedNode;
		}

		this.wrappedNode.consensus.on('lost', () => this.callbacks.consensus("lost"));
		this.wrappedNode.consensus.on('syncing', () => this.callbacks.consensus("syncing"));
		this.wrappedNode.consensus.on('established', () => this.callbacks.consensus("established"));

		this.wrappedNode.consensus.on('sync-chain-proof', () => this.callbacks.syncStatus('sync-chain-proof'));
		this.wrappedNode.consensus.on('verify-chain-proof', () => this.callbacks.syncStatus('verify-chain-proof'));
		this.wrappedNode.consensus.on('sync-accounts-tree', () => this.callbacks.syncStatus('sync-accounts-tree'));
		this.wrappedNode.consensus.on('verify-accounts-tree', () => this.callbacks.syncStatus('verify-accounts-tree'));
		this.wrappedNode.consensus.on('sync-finalize', () => this.callbacks.syncStatus('sync-finalize'));

		this.wrappedNode.network.on('peers-changed', () => this.callbacks.peersChanged());
		this.wrappedNode.network.on('peer-joined', (peer) => this.callbacks.peerJoined(peer));
		this.wrappedNode.blockchain.on('head-changed', () => this.callbacks.headChanged());

		this.wrappedNode.network.connect();
		this.nodeOptions.ready();
	}

	get nodeType() {
		if (this.wrappedNode.consensus instanceof Nimiq.NanoConsensus) {
			return "NANO";
		} else if (this.wrappedNode.consensus instanceof Nimiq.LightConsensus) {
			return "LIGHT";
		} else if (this.wrappedNode.consensus instanceof Nimiq.FullConsensus) {
			return "FULL";
		} else {
			return "UNKNOWN";
		}
	}

	get nodeReady() {
		return this.wrappedNode != null;
	}

	get keyguardReady() {
		return this.keyguardHelper.wrappedClient != null;
	}

	get minerReady() {
		return this.minerHelper.wrappedMiner != null;
	}

	get peerCount() {
		return this.wrappedNode.network.peerCount;
	}

	get globalHashrate() {
		const nBits = this.wrappedNode.blockchain.head.header.nBits;
		const difficulty = Nimiq.BlockUtils.compactToDifficulty(nBits);
		return difficulty * Math.pow(2, 16) / Nimiq.Policy.BLOCK_TIME;
	}

	get blockReward() {
		return Nimiq.Policy.blockRewardAt(this.wrappedNode.blockchain.height);
	}

	get blockHeight() {
		return this.wrappedNode.blockchain.height;
	}
}

if (WRAPPING_NODE) {
	module.exports = {
		AccountHelper,
		KeyguardHelper,
		MinerHelper,
		SignatureHelper,
		TransactionHelper,
		UtilHelper,
		NimiqWrapper
	};
}
