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

class HubHelper {
	/*
		Variables:
			theWrapper
			wrappedClient
			keyguardOptions
	*/


	constructor(wrapper) {
		this.theWrapper = wrapper;
		this.wrappedClient = null;
	  	this.keyguardOptions = {
			name : "Nimiq Application",
			url : "https://hub.nimiq.com",
			redirect : null
		};

		this.redirectSuccessHandler = (r, d) => { };
		this.redirectErrorHandler = (e, d) => { };
		this.defaultErrorHandler = (e, d) => { this.theWrapper.callbacks.error("HubHelper:getRedirectResponse", e); };
	}

	redirectSuccess(result, data) {
		this.redirectSuccessHandler(result, data);
	}

	redirectError(error, data) {
		this.redirectErrorHandler(error, data);
	}

	initKeyguard(options = { }) {
		this.initHub(options);
	}
	
	initHub(options = { }) {
		if (options.appName) this.keyguardOptions.name = options.appName;
		if (options.keyguardURL) this.keyguardOptions.url = options.keyguardURL;
		if (options.redirectBehavior) {
			let behavior = {
				popup : false, //Use the redirects.
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.popup) behavior.popup = options.redirectBehavior.popup;
			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;

			if (behavior.popup) {
				this.keyguardOptions.redirect = null;
			} else {
				if (behavior.data) {
					this.keyguardOptions.redirect = new HubApi.RedirectRequestBehavior(behavior.url, behavior.data);
				} else {
					this.keyguardOptions.redirect = new HubApi.RedirectRequestBehavior(behavior.url);
				}
			}
		}


		let onSuccess = (r, d) => this.redirectSuccess(r, d);
		let onError = (e, d) => this.redirectError(e, d);
		this.wrappedClient = new HubApi(this.keyguardOptions.url);
		this.wrappedClient.on(HubApi.RequestType.CHOOSE_ADDRESS, onSuccess, onError);
		this.wrappedClient.on(HubApi.RequestType.SIGN_MESSAGE, onSuccess, onError);
		this.wrappedClient.on(HubApi.RequestType.CHECKOUT, onSuccess, onError);
	}

	getRedirectResponse(onSuccess, onError = this.defaultErrorHandler) {
		this.redirectSuccessHandler = onSuccess;
		this.redirectErrorHandler = onError;
		this.wrappedClient.checkRedirectResponse();
	}

	requestAddress(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("HubHelper:requestAddress", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("HubHelper:requestAddress", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
			return;
		}

		let obj = {
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				popup : false, //Use the redirects.
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.popup) behavior.popup = options.redirectBehavior.popup;
			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;

			if (behavior.popup) {
				obj.redirect = null;
			} else {
				if (behavior.data) {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url, behavior.data);
				} else {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url);
				}
			}
		}

		if (obj.redirect) {
			this.wrappedClient.chooseAddress(obj, obj.redirect);
		} else {
			this.wrappedClient.chooseAddress(obj).then((addr) => {
				callback(addr);
			}).catch((err) => {
				if (options.onError) {
					options.onError(err);
				} else {
					this.theWrapper.callbacks.error("HubHelper:requestAddress", err);
				}
			});
		}
	}

	requestSignature(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("HubHelper:requestSignature", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("HubHelper:requestSignature", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
			return;
		}

		let obj = {
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect,
			message : "Please sign this!"
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				popup : false, //Use the redirects.
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.popup) behavior.popup = options.redirectBehavior.popup;
			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;

			if (behavior.popup) {
				obj.redirect = null;
			} else {
				if (behavior.data) {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url, behavior.data);
				} else {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url);
				}
			}
		}
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

		if (obj.redirect) {
			this.wrappedClient.signMessage(obj, obj.redirect);
		} else {
			this.wrappedClient.signMessage(obj).then((signed) => {
				callback(signed);
			}).catch((err) => {
				if (options.onError) {
					options.onError(err);
				} else {
					this.theWrapper.callbacks.error("HubHelper:requestSignature", err);
				}
			});
		}
	}

	requestTransaction(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("HubHelper:requestTransaction", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("HubHelper:requestTransaction", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
			return;
		}

		let obj = {
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect,
			recipient : "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
			value : 0
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				popup : false, //Use the redirects.
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.popup) behavior.popup = options.redirectBehavior.popup;
			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;

			if (behavior.popup) {
				obj.redirect = null;
			} else {
				if (behavior.data) {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url, behavior.data);
				} else {
					obj.redirect = new HubApi.RedirectRequestBehavior(behavior.url);
				}
			}
		}
		if (options.logoURL) obj.shopLogoUrl = options.logoURL;
		if (options.sendFrom) obj.sender = options.sendFrom;
		if (options.forceFrom) obj.forceSender = options.forceFrom;
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

		if (obj.redirect) {
			this.wrappedClient.checkout(obj, obj.redirect);
		} else {
			this.wrappedClient.checkout(obj).then((result) => {
				callback(result);
			}).catch((err) => {
				if (options.onError) {
					options.onError(err);
				} else {
					this.theWrapper.callbacks.error("HubHelper:requestTransaction", err);
				}
			});
		}
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
				this.theWrapper.callbacks.error("MinerHelper:initMiner", NimiqWrapper.ERROR_MESSAGES.BAD_DATA);
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
				this.theWrapper.callbacks.error("MinerHelper:initMiner", NimiqWrapper.ERROR_MESSAGES.BAD_ADDRESS);
			}
		}

		if (this.minerOptions.pool) {
			if (this.theWrapper.nodeType == "NANO") {
				this.wrappedMiner = new Nimiq.NanoPoolMiner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, Nimiq.BasePoolMiner.generateDeviceId(this.theWrapper.wrappedNode.network.config), this.minerOptions.data);
			} else {
				this.wrappedMiner = new Nimiq.SmartPoolMiner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.accounts, this.theWrapper.wrappedNode.mempool, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, Nimiq.BasePoolMiner.generateDeviceId(this.theWrapper.wrappedNode.network.config), this.minerOptions.data);
			}
		} else {
			this.wrappedMiner = new Nimiq.Miner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.accounts, this.theWrapper.wrappedNode.mempool, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, this.minerOptions.data);

		}

		this.theWrapper.wrappedNode.miner = this.wrappedMiner;
		this.wrappedMiner.on('start', () => this.theWrapper.callbacks.minerChanged('started'));
		this.wrappedMiner.on('stop', () => this.theWrapper.callbacks.minerChanged('stopped'));

		if (this.minerOptions.pool) {
			this.wrappedMiner.on('connection-state', state => {
				if (state == Nimiq.BasePoolMiner.ConnectionState.CONNECTED) {
					this.theWrapper.callbacks.connectionState("connected");
				} else if (state == Nimiq.BasePoolMiner.ConnectionState.CONNECTING) {
					this.theWrapper.callbacks.connectionState("connecting");
				} else if (state == Nimiq.BasePoolMiner.ConnectionState.CLOSED) {
					this.theWrapper.callbacks.connectionState("disconnected");
				} else {
					this.theWrapper.callbacks.error("MinerHelper:initMiner", NimiqWrapper.ERROR_MESSAGES.UNKNOWN_STATE);
				}
			});

			this.wrappedMiner.connect(this.minerOptions.host, this.minerOptions.port);
		}
	}

	startMining() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:startMining", NimiqWrapper.ERROR_MESSAGES.NO_MINER_YET);
			return;
		}

		this.wrappedMiner.startWork();
	}

	stopMining() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:stopMining", NimiqWrapper.ERROR_MESSAGES.NO_MINER_YET);
			return;
		}

		this.wrappedMiner.stopWork();
	}

	estimateRewardPerHour() {
		if (!this.wrappedMiner) {
			this.theWrapper.callbacks.error("MinerHelper:estimateRewardPerHour", NimiqWrapper.ERROR_MESSAGES.NO_MINER_YET);
			return;
		}

		let myHash = this.wrappedMiner.hashrate;
		let goHash = this.theWrapper.globalHashrate;
		let reward = Nimiq.Policy.lunasToCoins(Nimiq.Policy.blockRewardAt(this.theWrapper.blockHeight));
		let perBlock = (myHash / goHash) * reward;

		return perBlock * (60 / 1); //1 block per minute, 60 minutes in an hour.
	}

	get isMining() {
		return this.wrappedMiner.working;
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

	get maxThreads() {
		if (WRAPPING_NODE) {
			return require('os').cpus().length;
		} else {
			return window.navigator.hardwareConcurrency;
		}
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

	isValidFriendlyAddress(addr) {
		try {
			Nimiq.Address.fromUserFriendlyAddress(addr)
			return true;
		} catch (e) { }

		return false;
	}

	getFriendlyAddress(obj) {
		if (obj instanceof Nimiq.Wallet) {
			return obj.address.toUserFriendlyAddress();
		} else if (obj instanceof Nimiq.Address) {
			return obj.toUserFriendlyAddress();
		} else if (obj instanceof Nimiq.PublicKey) {
			return obj.toAddress().toUserFriendlyAddress();
		} else {
			this.theWrapper.callbacks.error("AccountHelper:getFriendlyAddress", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
			this.theWrapper.callbacks.error("AccountHelper:getBalance", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
			this.theWrapper.callbacks.error("AccountHelper:importWalletFromMnemonic", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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

	exportWalletToMnemonic(wallet, legacy = false) {
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

	verifyKeyguardSignature(signedMessage, rawMessage) {
		const signature = signedMessage.signature instanceof Nimiq.Signature ? signedMessage.signature : new Nimiq.Signature(signedMessage.signature);
		const publicKey = signedMessage.signerPublicKey instanceof Nimiq.PublicKey ? signedMessage.signerPublicKey : new Nimiq.PublicKey(signedMessage.signerPublicKey);

		const data = HubApi.MSG_PREFIX + rawMessage.length + rawMessage;
		const dataBytes = Nimiq.BufferUtils.fromUtf8(data);
		const hash = Nimiq.Hash.computeSha256(dataBytes);

		return signature.verify(publicKey, hash);
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
				this.theWrapper.callbacks.error("UtilHelper:getTransactionByHash", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
				this.theWrapper.callbacks.error("UtilHelper:getBlockByHash", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
			this.theWrapper.callbacks.error("UtilHelper:getIqonURLFor", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
			this.theWrapper.callbacks.error("UtilHelper:getTransactionRequestURL", NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE);
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
	static get ERROR_MESSAGES() {
		return {
			BAD_PARAM_TYPE : "Parameter type incompatible with function.",
			ANOTHER_NODE : "Nimiq node is already open in another tab or window with same origin.",
			NODE_NOT_SUPPORTED : "Browser does not support features required for Nimiq.",
			UNKNOWN_INIT :  "Uknown error occurred during initialization.",
			BAD_FEE : "Fee must either be 0 or greater than 138 Luna.  Less than 138 Luna is treated as feeless.",
			FREE_TX_LIMIT : "Can only have 10 feeless transactions in the mempool per sender, try again later or add a fee.",
			KEYGUARD_NOT_SUPPORTED : "Keyguard cannot be used in NodeJS!",
			KEYGUARD_NOT_READY : "Keyguard not yet initialized!",
			BAD_DATA : "Invalid type for extraData option, using none.",
			BAD_ADDRESS : "Invalid type for address option, using Nimiq Burn Address.",
			UNKNOWN_STATE : "Unknown connection state occurred!",
			NO_MINER_YET : "Miner not yet initialized!"
		};
	}

	/*
		Variables:
			wrappedNode
			callbacks
			nodeOptions
			hubHelper
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

		this.hubHelper = new HubHelper(this);
		this.minerHelper = new MinerHelper(this);
		this.accountHelper = new AccountHelper(this);
		this.transactionHelper = new TransactionHelper(this);
		this.signatureHelper = new SignatureHelper(this);
		this.utilHelper = new UtilHelper(this);
	}

	get keyguardHelper() {
		console.warn("keyguardHelper is deprecated terminology, please use hubHelper");
		return this.hubHelper;
	}

	initNode(options = { }) {
		this.nodeOptions = {
			network : "MAIN",
			type : "LIGHT",
			debug : false,
			connect : true,
			classes : false,
			loaded : () => {

			},
			ready : () => {

			}
		};

		if (options.network) this.nodeOptions.network = options.network.toUpperCase();
		if (options.type) this.nodeOptions.type = options.type.toUpperCase();
		if (options.debug) this.nodeOptions.debug = options.debug;
		
		if (options.dontConnect) this.nodeOptions.connect = !options.dontConnect;
		if (options.justClasses) this.nodeOptions.classes = options.justClasses;
		if (options.whenLoaded) this.nodeOptions.loaded = options.whenLoaded;
		if (options.whenReady) this.nodeOptions.ready = options.whenReady;

		if (WRAPPING_NODE) {
			this.nodeOptions.loaded();
			this.innerInit();
		} else {
			Nimiq.init(async () => {
				this.nodeOptions.loaded();
				if (!this.nodeOptions.classes) {
					await this.innerInit();
				}
			}, (error) => {
				if (error === Nimiq.ERR_WAIT) {
					this.callbacks.error("NimiqWrapper:initNode", NimiqWrapper.ERROR_MESSAGES.ANOTHER_NODE);
				} else if (error === Nimiq.ERR_UNSUPPORTED) {
					this.callbacks.error("NimiqWrapper:initNode", NimiqWrapper.ERROR_MESSAGES.NODE_NOT_SUPPORTED);
				} else {
					this.callbacks.error("NimiqWrapper:initNode", NimiqWrapper.ERROR_MESSAGES.UNKNOWN_INIT);
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
		} else if (this.nodeOptions.type == "DUMB-FULL") {
			instance.consensus = await Nimiq.Consensus.full(new Nimiq.DumbNetworkConfig());
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

		if (this.nodeOptions.connect) {
			this.wrappedNode.network.connect();
		}
		
		this.nodeOptions.ready();
	}

	getSupplyAt(block) {
		return Nimiq.Policy.supplyAfter(block);
	}

	getBlockRewardAt(block) {
		return Nimiq.Policy.blockRewardAt(block);
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

	get hubReady() {
		return this.hubHelper.wrappedClient != null;
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

	get currentSupply() {
		return getSupplyAt(this.wrappedNode.blockchain.height);
	}

	get blockReward() {
		return getBlockRewardAt(this.wrappedNode.blockchain.height);
	}

	get blockHeight() {
		return this.wrappedNode.blockchain.height;
	}
}

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
