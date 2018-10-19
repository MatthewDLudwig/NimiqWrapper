var WRAPPING_NODE = false;
if (WRAPPING_NODE) {
	console.log("Wrapping Nimiq in NodeJS mode!");
	var Nimiq = require("@nimiq/core");
} else {
	console.log("Wrapping Nimiq in JS mode!");
}

class NimiqUtils {
//Transformation Utils
	static bufferToString(ser) {
		let text = "";
		for (let i = 0; i < ser.length; i++) {
			let part = ser[i].toString(16).toUpperCase();
			if (part.length == 1) {
				text += "0";
			}

			text += part + " ";
		}
		return text;
	}

	static stringToBuffer(str) {
		let pieces = str.split(" ");
		let ser = [];
		for (let i = 0; i < pieces.length; i++) {
			ser.push(parseInt(pieces[i], 16));
		}
		return new Nimiq.SerialBuffer(ser);
	}

	static stringToData(s) {
		let bytes = [];
		for (let i = 0; i < s.length; ++i) {
			bytes.push(s.charCodeAt(i));
		}
		return new Uint8Array(bytes);
	}

	static dataToString(d) {
		let chars = "";
		for (let i = 0; i < d.length; i++) {
			chars += String.fromCharCode(d[i]);
		}
		return chars;
	}

//Message Utils

	static createMessageFromData(keyPair, data) {
		return Nimiq.Signature.create(keyPair.privateKey, keyPair.publicKey, data);
	}

	static createMessageFromString(keyPair, str) {
		return NimiqUtils.createMessageFromData(keyPair, NimiqUtils.stringToData(str));
	}

	static verifyMessageWithData(sig, key, data) {
		return sig.verify(key, data);
	}

	static verifyMessageWithString(sig, key, str) {
		return NimiqUtils.verifyMessageWithData(sig, key, NimiqUtils.stringToData(str));
	}

//Serialize Utils

	static serializeMessage(message) {
		return NimiqUtils.bufferToString(message.serialize());
	}

	static unserializeMessage(text) {
		return Nimiq.Signature.unserialize(NimiqUtils.stringToBuffer(text));
	}

	static async serializePublicKey(key) {
		return NimiqUtils.bufferToString(key.serialize());
	}

	static async unserializeEncryptedWallet(key) {
		return Nimiq.PublicKey.unserialize(NimiqUtils.stringToBuffer(key));
	}

//Wallet Utils

	static async serializeEncryptWallet(wall, pass) {
		return NimiqUtils.bufferToString(await wall.exportEncrypted(pass));
	}

	static async unserializeEncryptedWallet(seed, key) {
		return await Nimiq.Wallet.loadEncrypted(NimiqUtils.stringToBuffer(seed), key);
	}

	static async getNewEncryptedWallet(pass) {
		let wall = await Nimiq.Wallet.generate();
		return NimiqUtils.serializeEncryptWallet(wall, pass);
	}
}

class MinerWrapper {
	// instance			=	the current nimiq instance given by the wrapper.
	// host				=	host of the pool
	// port				=	port of the pool
	// minerChanged		=	function(status)
	//  			status	=	started|stopped
	// connectionState	=	function(status)
	//  			status	=	connected|failed
	//  headChanged	=	function()
	constructor(instance, initInfo, handlerFunctions) {
		this.nimiqInstance = instance;
		this.minerChangedHandler = handlerFunctions.hasOwnProperty("minerChanged") ? handlerFunctions.minerChanged : (status) => { };
		this.connectionStateHandler = handlerFunctions.hasOwnProperty("connectionState") ? handlerFunctions.connectionState : (status) => { };
		this.previousState = 2;
		this.poolPayout = 0;

		let host = initInfo.hasOwnProperty("poolHost") ? initInfo.poolHost : "us.sushipool.com";
		let port = initInfo.hasOwnProperty("poolPort") ? initInfo.poolPort : "443";
		let addr = Nimiq.Address.fromUserFriendlyAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000");

		if (initInfo.hasOwnProperty("mineToAddr")) {
			addr = Nimiq.Address.fromUserFriendlyAddress(initInfo.mineToAddr);
		} else if (typeof this.nimiqInstance.wallet != 'undefined') {
			addr = this.nimiqInstance.wallet.address;
		}

		this.wrappedMiner = this.initMiner(host, port, addr);
	}

	initMiner(host, port, addr) {
        let miner = new Nimiq.SmartPoolMiner(this.nimiqInstance.blockchain, this.nimiqInstance.accounts, this.nimiqInstance.mempool, this.nimiqInstance.network.time, addr, Nimiq.BasePoolMiner.generateDeviceId(this.nimiqInstance.network.config));
        miner.on('start', () => this.minerChangedHandler('started'));
        miner.on('stop', () => this.minerChangedHandler('stopped'));
        miner.on('confirmed-balance', balance => this.poolPayout = balance);
        miner.on('connection-state', state => this.onConnectionChange(state));
		this.nimiqInstance.miner = miner;

		console.log('Pool Miner instantiated');
		miner.connect(host, port);
        return miner;
	}

	startMining() {
		this.wrappedMiner.startWork();
	}

	stopMining() {
		this.wrappedMiner.stopWork();
	}

	disconnectMiner() {
		this.wrappedMiner.disconnect();
	}

	get globalHashrate() {
        const nBits = this.nimiqInstance.blockchain.head.header.nBits;
        const difficulty = Nimiq.BlockUtils.compactToDifficulty(nBits);
        return difficulty * Math.pow(2, 16) / Nimiq.Policy.BLOCK_TIME;
	}

	get hashrate() {
        return this.wrappedMiner.hashrate;
	}

	get rewardPerHour() {
		let myHash = this.hashrate;
		let goHash = this.globalHashrate;
		let reward = Nimiq.Policy.satoshisToCoins(Nimiq.Policy.blockRewardAt(this.nimiqInstance.blockchain.height));
		let perBlock = (myHash / goHash) * reward;

		return perBlock * (60 / 1); //1 block per minute, 60 minutes in an hour.
	}

	get threads() {
		return this.wrappedMiner.threads;
	}

	set threads(t) {
		this.wrappedMiner.threads = t;
	}

	onConnectionChange(state) {
		if (state === Nimiq.BasePoolMiner.ConnectionState.CONNECTED) {
			this.poolPayout = this.wrappedMiner.confirmedBalance || 0;
			this.connectionStateHandler('connected')
		} else if (state === Nimiq.BasePoolMiner.ConnectionState.CLOSED && this.previousState === Nimiq.BasePoolMiner.ConnectionState.CONNECTING) {
			this.hashRate = 0;
			this.connectionStateHandler('failed')
		}

		this.previousState = state;
	}
}

class NimiqWrapper {
	// mine			=	boolean stating whether the miner should run once consensus is established.
	// minerChanged	=	function(status)
	//			See the MinerWrapper.
	// connectionState	function(status)
	//			See the MinerWrapper.

	// consensus	=	function(status)
	//  		status	=	syncing|established|lost
	// syncStatus	=	function(status)
	// 			status	=	sync-chain-proof|verify-chain-proof|sync-accounts-tree|verify-accounts-tree|sync-finalize
	// peersChanged	=	function()
	// headChanged	=	function()
	// peerJoined	=	function(peer)
	// 			peer	=	it has a peer.id value.
	// full (true | false)
	// network (0 | 1 | 2 | 3) (test | main | dev | bounty)
	constructor(mine, handlerFunctions, full = false, network = 1) {
		this.fullNode = full;
		this.whichNetwork = network;
		this.initDone = false;
		this.connectDone = false;
		let saved = this;

		this.initNimiq().then(function(result) {
			saved.nimiqInstance = result;
			saved.initDone = true;
		});

		this.usedHandlers = handlerFunctions;

		this.errorCallback = handlerFunctions.hasOwnProperty("errorHandler") ? handlerFunctions.errorHandler : (where, err) => { console.error("Error occurred at '" + where + "' with message: " + err) };
		this.consensusCallback = handlerFunctions.hasOwnProperty("consensus") ? handlerFunctions.consensus : (status) => { };
		this.syncStatusCallback = handlerFunctions.hasOwnProperty("syncStatus") ? handlerFunctions.syncStatus : (status) => { };
		this.peersChangedCallback = handlerFunctions.hasOwnProperty("peersChanged") ? handlerFunctions.peersChanged : () => { };
		this.peerJoinedCallback = handlerFunctions.hasOwnProperty("peerJoined") ? handlerFunctions.peerJoined : (peer) => { };
		this.headChangedCallback = handlerFunctions.hasOwnProperty("headChanged") ? handlerFunctions.headChanged : () => { };

		this.shouldMine = mine;
		this.wrappedBalance = 0;
	}

	async onBalanceChanged(account) {
		account = account || Nimiq.BasicAccount.INITIAL;
		this.wrappedBalance = account.balance;
	}

	async initNimiq() {
		return new Promise((resolve, reject) => {
			let saved = this;
			async function innerInit() {
				try {
					switch (saved.whichNetwork) {
						case 0:
							Nimiq.GenesisConfig.test();
							break;
						case 1:
							Nimiq.GenesisConfig.main();
							break;
						case 2:
							Nimiq.GenesisConfig.dev();
							break;
						case 3:
							Nimiq.GenesisConfig.bounty();
							break;
						default:
							reject("Unknown network requested: " + saved.whichNetwork);
					}

					let instance = {};
					if (saved.fullNode) {
						instance.consensus = await Nimiq.Consensus.full();
					} else {
						instance.consensus = await Nimiq.Consensus.light();
					}

					instance.blockchain = instance.consensus.blockchain;
					instance.accounts = instance.blockchain.accounts;
					instance.mempool = instance.consensus.mempool;
					instance.network = instance.consensus.network;

                    if (!WRAPPING_NODE) {
                            window.nimiq = instance;
                    }

					resolve(instance);
				} catch(e) {
					reject(e);
				}
			}

			if (WRAPPING_NODE) {
				innerInit();
			} else {
				Nimiq.init(innerInit, function (error) {
					if (error === Nimiq.ERR_WAIT) {
						reject("MULTIPLENODES");
					} else if (error === Nimiq.ERR_UNSUPPORTED) {
						reject("OLDBROWSER");
					} else {
						reject("UNKNOWN");
					}
				});
			}
		}).catch(async e => {
			this.errorCallback("NimiqInit", e);
		});
	}

	connect(initInfo) {
		let saved = this;

		if (this.initDone && !this.connectDone) {
			try {
				this.usedInfo = initInfo;

				if (initInfo.hasOwnProperty("walletSeed") && initInfo.hasOwnProperty("walletKey")) {
					Nimiq.Wallet.loadEncrypted(NimiqUtils.stringToBuffer(initInfo.walletSeed), initInfo.walletKey).then(function(result) {
						saved.nimiqInstance.wallet = result;
						saved.minerInstance = new MinerWrapper(saved.nimiqInstance, saved.usedInfo, saved.usedHandlers);
						saved.connectDone = true;
					});
				} else {
					console.log("Connecting to Nimiq network without an attached wallet!");
					saved.minerInstance = new MinerWrapper(saved.nimiqInstance, saved.usedInfo, saved.usedHandlers);
					saved.connectDone = true;
				}

				this.nimiqInstance.consensus.on('lost', () => this.onConsensusLost());
				this.nimiqInstance.consensus.on('syncing', () => this.consensusCallback("syncing"));
				this.nimiqInstance.consensus.on('established', () => this.onConsensusEstablished());

				this.nimiqInstance.consensus.on('sync-chain-proof', () => this.syncStatusCallback('sync-chain-proof'));
				this.nimiqInstance.consensus.on('verify-chain-proof', () => this.syncStatusCallback('verify-chain-proof'));
				this.nimiqInstance.consensus.on('sync-accounts-tree', () => this.syncStatusCallback('sync-accounts-tree'));
				this.nimiqInstance.consensus.on('verify-accounts-tree', () => this.syncStatusCallback('verify-accounts-tree'));
				this.nimiqInstance.consensus.on('sync-finalize', () => this.syncStatusCallback('sync-finalize'));

				this.nimiqInstance.blockchain.on('head-changed', () => this.onHeadChanged());
				this.nimiqInstance.network.on('peers-changed', () => this.peersChangedCallback());
				this.nimiqInstance.network.on('peer-joined', peer => this.peerJoinedCallback(peer));

				this.nimiqInstance.network.connect();
				this.onHeadChanged();
				return true;
			} catch (err) {
				this.errorCallback("NimiqConnect", err.message);
			}
		}

		return false;
	}

	get ready() {
		return this.connectDone;
	}

	get friendlyAddress() {
		return this.nimiqInstance.wallet.address.toUserFriendlyAddress();
	}

	get peerCount() {
		return this.nimiqInstance.network.peerCount;
	}

    get globalHashrate() {
        const nBits = this.nimiqInstance.blockchain.head.header.nBits;
        const difficulty = Nimiq.BlockUtils.compactToDifficulty(nBits);
        return difficulty * Math.pow(2, 16) / Nimiq.Policy.BLOCK_TIME;
    }

	get blockReward() {
		return Nimiq.Policy.blockRewardAt(this.nimiqInstance.blockchain.height);
	}

	get blockHeight() {
		return this.nimiqInstance.blockchain.height;
	}

	get accountBalance() {
		return this.wrappedBalance;
	}

	get poolBalance() {
		return this.wrappedMiner.poolPayout;
	}

	get miner() {
		return this.minerInstance;
	}

	get wrappedInstance() {
		return this.nimiqInstance;
	}

	get wrappedMiner() {
		return this.minerInstance.wrappedMiner;
	}

	get hasWallet() {
		return (typeof this.nimiqInstance.wallet != 'undefined');
	}

	onConsensusEstablished() {
		this.consensusCallback("established");

		if (this.hasWallet) {
			this.nimiqInstance.accounts.get(this.nimiqInstance.wallet.address).then(account => this.onBalanceChanged(account));
		}

		if (this.shouldMine) {
			this.minerInstance.startMining();
		}
	}

	onConsensusLost() {
		this.consensusCallback("lost");
		this.minerInstance.stopMining();
		this.minerInstance.disconnectMiner();
	}

	onHeadChanged() {
		if (this.hasWallet) {
			this.nimiqInstance.accounts.get(this.nimiqInstance.wallet.address).then(account => this.onBalanceChanged(account));
		}

		this.headChangedCallback();
	}
}

if (WRAPPING_NODE) {
	module.exports = {
		NimiqUtils,
		MinerWrapper,
		NimiqWrapper
	}
}
