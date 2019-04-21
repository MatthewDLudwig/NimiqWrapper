// Order - 2

class KeyguardHelper {
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
			url : "https://accounts.nimiq-testnet.com",
			redirect : null
		};

		this.redirectSuccessHandler = (r, d) => { };
		this.redirectErrorHandler = (e, d) => { };
		this.defaultErrorHandler = (e, d) => { this.theWrapper.callbacks.error("KeyguardHelper:getRedirectResponse", e); };
	}

	redirectSuccess(result, data) {
		this.redirectSuccessHandler(result, data);
	}

	redirectError(error, data) {
		this.redirectErrorHandler(error, data);
	}

	initKeyguard(options = { }) {
		if (options.appName) this.keyguardOptions.name = options.appName;
		if (options.keyguardURL) this.keyguardOptions.url = options.keyguardURL;
		if (options.redirectBehavior) {
			let behavior = {
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;
			if (behavior.data) {
				this.keyguardOptions.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url, behavior.data);
			} else {
				this.keyguardOptions.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url);
			}
		}


		let onSuccess = (r, d) => this.redirectSuccess(r, d);
		let onError = (e, d) => this.redirectError(e, d);
		this.wrappedClient = new AccountsClient(this.keyguardOptions.url);
		this.wrappedClient.on(AccountsClient.RequestType.CHOOSE_ADDRESS, onSuccess, onError);
		this.wrappedClient.on(AccountsClient.RequestType.SIGN_MESSAGE, onSuccess, onError);
		this.wrappedClient.on(AccountsClient.RequestType.CHECKOUT, onSuccess, onError);
	}

	getRedirectResponse(onSuccess, onError = this.defaultErrorHandler) {
		this.redirectSuccessHandler = onSuccess;
		this.redirectErrorHandler = onError;
		this.wrappedClient.checkRedirectResponse();
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
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;
			if (behavior.data) {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url, behavior.data);
			} else {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url);
			}
		}

		let promise = null;
		if (obj.redirect) {
			promise = this.wrappedClient.chooseAddress(obj, obj.redirect)
		} else {
			promise = this.wrappedClient.chooseAddress(obj)
		}

		promise.then((addr) => {
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
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect,
			message : "Please sign this!"
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;
			if (behavior.data) {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url, behavior.data);
			} else {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url);
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

		let promise = null;
		if (obj.redirect) {
			promise = this.wrappedClient.signMessage(obj, obj.redirect)
		} else {
			promise = this.wrappedClient.signMessage(obj)
		}

		promise.then((signed) => {
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
			appName : this.keyguardOptions.name,
			redirect : this.keyguardOptions.redirect,
			recipient : "NQ07 0000 0000 0000 0000 0000 0000 0000 0000",
			value : 0
		};

		if (options.appName) obj.appName = options.appName;
		if (options.redirectBehavior) {
			let behavior = {
				url : null, //Uses the requesting url.
				data : null //No data.
			};

			if (options.redirectBehavior.url) behavior.url = options.redirectBehavior.url;
			if (options.redirectBehavior.data) behavior.data = options.redirectBehavior.data;
			if (behavior.data) {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url, behavior.data);
			} else {
				obj.redirect = new AccountsClient.RedirectRequestBehavior(behavior.url);
			}
		}
		if (options.logoURL) obj.shopLogoUrl = options.logoURL;
		if (options.sendFrom) obj.sender = options.sendFrom;
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

		let promise = null;
		if (obj.redirect) {
			promise = this.wrappedClient.checkout(obj, obj.redirect)
		} else {
			promise = this.wrappedClient.checkout(obj)
		}

		promise.then((result) => {
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
