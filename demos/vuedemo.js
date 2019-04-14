let appVue = new Vue({
	el : '#vueDiv',
	data : {
		wrapperReady : false,
		myWallet : null,
		walletBalance : 00,
		isMining : false,
		minerHR : 00,
		generatedWallets : 00,
		watchAddr : "",
		addrWatchers : [ ],
		lastTX : {
				sender : "",
				recipient : "",
				value : 0
			}
	},
	watch : {
		'myWallet' : function(newVal, oldVal) {
			wrapper.accountHelper.getBalance(this.myWallet, (b) => {
				this.walletBalance = b;
			});
		},
		'isMining' : function(newVal, oldVal) {
			if (!newVal) this.minerHR = 0;
		}
	},
	computed : {
		walletAddress : function() {
			return this.myWallet ? wrapper.accountHelper.getFriendlyAddress(this.myWallet) : "NO WALLET LOADED";
		},
		walletImage : function() {
			return this.myWallet ? wrapper.utilHelper.getIqonURLFor(this.myWallet) : "";
		},
		miningText : function() {
			return this.isMining ? "Stop Mining" : "Start Mining";
		}
	},
	methods : {
		'whenReady' : function() {
			this.wrapperReady = true;
			wrapper.minerHelper.initMiner({
				soloMine : true,
				extraData : "Testing NimiqWrapper"
			});

			setInterval(() => {
				this.generatedWallets = 0;
				if (this.myWallet) {
					wrapper.accountHelper.getBalance(this.myWallet, (b) => {
						this.walletBalance = b / 100000;
					});
				}
			}, 30000);

			setInterval(() => {
				if (this.isMining) {
					this.minerHR = wrapper.minerHelper.hashrate;
				}
			}, 500);
		},
		'generateWallet' : function() {
			if (this.generatedWallets > 5) {
				alert("Slow down.");
			} else {
				this.myWallet = wrapper.accountHelper.createWallet();
				this.generatedWallets++;
			}
		},
		'toggleMining' : function() {
			if (this.isMining) {
				wrapper.minerHelper.stopMining();
			} else {
				wrapper.minerHelper.startMining();
			}

			this.isMining = !this.isMining;
		},
		'registerWatcher' : function(watchTo) {
			let tracker;
			if (watchTo) {
				tracker = wrapper.transactionHelper.watchForTransactionsTo(this.watchAddr, (tx) => this.transactionTriggered(tx));
			} else {
				tracker = wrapper.transactionHelper.watchForTransactionsFrom(this.watchAddr, (tx) => this.transactionTriggered(tx));
			}
			this.addrWatchers.push(tracker);
			this.watchAddr = "";
		},
		'transactionTriggered' : function(tx) {
			this.lastTX.sender = wrapper.accountHelper.getFriendlyAddress(tx.sender);
			this.lastTX.recipient = wrapper.accountHelper.getFriendlyAddress(tx.recipient);
			this.lastTX.value = wrapper.utilHelper.convertLunaToNIM(tx.value);
			console.log(tx);
		},
		'getTextFor' : function(watcher) {
			if (watcher.type == "from") {
				return "From: " + watcher.watching;
			} else {
				return "To: " + watcher.watching;
			}
		},
		'removeWatcher' : function(watcher, i) {
			this.addrWatchers.splice(i, 1);
			watcher.stopWatching();
		}
	}
});

//Create the NimiqWrapper object.
let wrapper = new NimiqWrapper();
//It can be used through this `wrapper` variable within the Vue methods, but should not be stored in `data`.
//This means that you can't have your Vue app be reactive to a wrapper property directly, though intervals can allow you to sync it up.

//Initialize the node as a Light node (default for NimiqWrapper) on the testnet (default is mainnet).
wrapper.initNode({
	network : "TEST",
	whenReady : appVue.whenReady
});
