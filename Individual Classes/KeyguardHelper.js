// Order - 2

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
				obj.message = JSON.stringify(options.data, null, 4);
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
