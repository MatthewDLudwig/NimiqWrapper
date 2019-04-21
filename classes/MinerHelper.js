// Order - 3

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
					this.theWrapper.callbacks.error("MinerHelper:initMiner", "Unknown connection state occurred!");
				}
			});

			this.wrappedMiner.connect(this.minerOptions.host, this.minerOptions.port);
		}
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
