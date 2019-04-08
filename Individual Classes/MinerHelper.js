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
			addr : Nimiq.Address.fromUserFriendlyAddress("NQ07 0000 0000 0000 0000 0000 0000 0000 0000"),
			host : "us.nimpool.io",
			port : 8444
		};

		if (options.poolHost) this.minerOptions.host = options.poolHost;
		if (options.poolPort) this.minerOptions.port = options.poolPort;
		if (options.address) {
			if (obj instanceof Nimiq.Wallet) {
				this.minerOptions.addr = obj.address;
			} else if (obj instanceof Nimiq.Address) {
				this.minerOptions.addr = obj;
			} else if (typeof obj == "string") {
				this.minerOptions.addr = Nimiq.Address.fromUserFriendlyAddress(obj);
			}
		}

		let miner = new Nimiq.SmartPoolMiner(this.theWrapper.wrappedNode.blockchain, this.theWrapper.wrappedNode.accounts, this.theWrapper.wrappedNode.mempool, this.theWrapper.wrappedNode.network.time, this.minerOptions.addr, Nimiq.BasePoolMiner.generateDeviceId(this.theWrapper.wrappedNode.network.config));
		this.theWrapper.wrappedNode.miner = miner;
		this.wrappedMiner = miner;

		this.wrappedMiner.on('start', () => this.theWrapper.callbacks.minerChanged('started'));
		this.wrappedMiner.on('stop', () => this.theWrapper.callbacks.minerChanged('stopped'));
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
