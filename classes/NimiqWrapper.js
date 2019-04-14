// Order - 8

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