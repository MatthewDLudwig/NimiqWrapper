class NimiqUtils {
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

	static createMessage(sender, nonceA, nonceB, nonceC, data) {
		return new Nimiq.ExtendedTransaction(
					sender, 0,
					Nimiq.Address.fromUserFriendlyAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000"), 0,
					nonceA, nonceB, nonceC,
					0, NimiqUtils.stringToData(data), new Uint8Array(0), 0);
	}

	static signMessage(message, signer) {
		if (message.sender.equals(signer.address)) {
			return signer.signTransaction(message);
		} else {
			return null;
		}
	}

	static confirmMessage(message, proof, a, b, c) {
		let sender = message.sender;
		let nonceA = message.value;
		let nonceB = message.fee;
		let nonceC = message.validityStartHeight;

		if (proof.isSignedBy(sender) && nonceA == a && nonceB == b && nonceC == c) {
			return NimiqUtils.dataToString(message.data);
		} else {
			return null;
		}
	}

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

	static serializeMessage(message) {
		return NimiqUtils.bufferToString(message.serialize());
	}

	static unserializeMessage(text) {
		return Nimiq.ExtendedTransaction.unserialize(NimiqUtils.stringToBuffer(text));
	}

	static serializeProof(proof) {
		return NimiqUtils.bufferToString(proof.serialize());
	}

	static unserializeProof(text) {
		return Nimiq.SignatureProof.unserialize(NimiqUtils.stringToBuffer(text));
	}

	static async serializeEncryptWallet(wall, pass) {
		return NimiqUtils.bufferToString(await wall.exportEncrypted(pass));
	}

	static async unserializeEncryptedWallet(seed, key) {
		return await Nimiq.Wallet.loadEncrypted(NimiqUtils.stringToBuffer(seed), key);
	}

	static async getNewWallet(pass) {
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
	constructor(instance, host, port, minerChanged, connectionState) {
		this.nimiqInstance = instance;
		this.minerChangedHandler = minerChanged;
		this.connectionStateHandler = connectionState;
		this.previousState = 2;
		this.poolPayout = 0;

		this.wrappedMiner = this.initMiner(host, port);
	}

	initMiner(host, port) {
        if (this.wrappedMiner) return this.wrappedMiner;

        this.wrappedMiner = new Nimiq.SmartPoolMiner(this.nimiqInstance.blockchain, this.nimiqInstance.accounts, this.nimiqInstance.mempool, this.nimiqInstance.network.time, this.nimiqInstance.wallet.address, Nimiq.BasePoolMiner.generateDeviceId(this.nimiqInstance.network.config));
        console.log('Pool Miner instantiated');

        this.wrappedMiner.on('hashrate-changed', () => this.onHashrateChanged());
        this.wrappedMiner.on('start', () => this.minerChangedHandler('started'));
        this.wrappedMiner.on('stop', () => this.minerChangedHandler('stopped'));
        this.wrappedMiner.on('confirmed-balance', balance => this.poolPayout = balance);
        this.wrappedMiner.on('connection-state', state => this.onConnectionChange(state));

		this.wrappedMiner.connect(host, port);
        return this.wrappedMiner;
	}

	startMining() {
		this.wrappedMiner.startWork();
	}

	stopMining() {
		this.wrappedMiner.stopWork();
	}

	disconnectMiner() {
		this.wrappedMiner.disconnect(host, port);
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

	onHashrateChanged() {
		//Update inner variables using wrappedMiner.hashrate, threads, etc...
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
	constructor(mine, minerChanged, connectionState, consensus, syncStatus, peersChanged, headChanged, peerJoined = (peer) => { }) {
		this.initDone = false;
		this.connectDone = false;
		let saved = this;

		this.initNimiq().then(function(result) {
			saved.nimiqInstance = result;
			saved.initDone = true;
		});

		this.minerChangedHandler = minerChanged;
		this.connectionStateHandler = connectionState;

		this.shouldMine = mine;
		this.consensusCallback = consensus;
		this.syncStatusCallback = syncStatus;
		this.peersChangedCallback = peersChanged;
		this.peerJoinedCallback = peerJoined;
		this.headChangedCallback = headChanged;

		this.wrappedBalance = 0;
	}

	async onBalanceChanged(account) {
		account = account || Nimiq.BasicAccount.INITIAL;
		this.wrappedBalance = account.balance;
	}

	async initNimiq() {
		return new Promise((resolve, reject) => {
			Nimiq.init(async () => {
				try {
					let genesisInitialized;

					try {
						genesisInitialized = !!Nimiq.GenesisConfig.NETWORK_NAME;
					} catch(e) {
						genesisInitialized = false;
					}

					if (!genesisInitialized) {
						Nimiq.GenesisConfig['main']();
					}

					const instance = {};
					instance.consensus = await Nimiq.Consensus.light();
                    instance.blockchain = instance.consensus.blockchain;
                    instance.accounts = instance.blockchain.accounts;
                    instance.mempool = instance.consensus.mempool;
                    instance.network = instance.consensus.network;
					window.nimiq = instance;

					resolve(instance);
				} catch(e) {
					reject(e);
				}
			}, function (error) {
				if (error === Nimiq.ERR_WAIT) {
					reject('Multiple Nimiq instances are currently running.');
				} else if (error === Nimiq.ERR_UNSUPPORTED) {
					reject('The current browser is too old to work with Nimiq.');
				} else {
					reject('An unknown initialization error occurred.');
				}
			});
		}).catch(async e => {
			//Should catch the errors rejected in the async.
			console.log('Error - ' + e);
		});
	}

	// walletSeed	=	array of 54 integers.
	// walletPass	=	the key required to unlock the seed.
	connect(seed, key) {
		let saved = this;

		if (this.initDone) {
			Nimiq.Wallet.loadEncrypted(NimiqUtils.stringToBuffer(seed), key).then(function(result) {
				saved.nimiqInstance.wallet = result;
			});
			this.minerInstance = new MinerWrapper(this.nimiqInstance, "pool.porkypool.com", "8444", this.minerChangedHandler, this.connectionStateHandler);

			this.nimiqInstance.consensus.on('lost', () => this.onConsensusLost());
			this.nimiqInstance.consensus.on('syncing', () => this.consensusCallback("syncing"));
			this.nimiqInstance.consensus.on('established', () => this.onConsensusEstablished());

			this.nimiqInstance.consensus.on('sync-chain-proof', () => this.syncStatusCallback('sync-chain-proof'));
			this.nimiqInstance.consensus.on('verify-chain-proof', () => this.syncStatusCallback('verify-chain-proof'));
			this.nimiqInstance.consensus.on('sync-accounts-tree', () => this.syncStatusCallback('sync-accounts-tree'));
			this.nimiqInstance.consensus.on('verify-accounts-tree', () => this.syncStatusCallback('verify-accounts-tree'));
			this.nimiqInstance.consensus.on('sync-finalize', () => this.syncStatusCallback('sync-finalize'));

			this.nimiqInstance.blockchain.on('head-changed', this.onHeadChanged.bind(this));
			this.nimiqInstance.network.on('peers-changed', () => this.peersChangedCallback());
			this.nimiqInstance.network.on('peer-joined', peer => this.peerJoinedCallback(peer));

			this.minerInstance.wrappedMiner.threads = 1;
			this.nimiqInstance.network.connect();

			this.onHeadChanged();
			return true;
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

	onConsensusEstablished() {
		this.consensusCallback("established");
		this.nimiqInstance.accounts.get(this.nimiqInstance.wallet.address).then(account => this.onBalanceChanged(account));

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
		this.headChangedCallback();
		this.nimiqInstance.accounts.get(this.nimiqInstance.wallet.address).then(account => this.onBalanceChanged(account));
	}
}
