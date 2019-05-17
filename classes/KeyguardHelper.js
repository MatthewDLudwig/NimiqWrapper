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
			url : "https://hub.nimiq-testnet.com",
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
			this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
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
					this.theWrapper.callbacks.error("KeyguardHelper:requestAddress", err);
				}
			});
		}
	}

	requestSignature(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
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
					this.theWrapper.callbacks.error("KeyguardHelper:requestSignature", err);
				}
			});
		}
	}

	requestTransaction(callback, options = { }) {
		if (WRAPPING_NODE) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED);
			return;
		}

		if (!this.wrappedClient) {
			this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY);
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
					this.theWrapper.callbacks.error("KeyguardHelper:requestTransaction", err);
				}
			});
		}
	}
}
