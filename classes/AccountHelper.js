// Order - 4

class AccountHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	getFriendlyAddress(obj) {
		if (obj instanceof Nimiq.Wallet) {
			return obj.address.toUserFriendlyAddress();
		} else if (obj instanceof Nimiq.Address) {
			return obj.toUserFriendlyAddress();
		} else {
			this.theWrapper.callbacks.error("AccountHelper:getFriendlyAddress", "Parameter type incompatible with function.");
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
			this.theWrapper.callbacks.error("AccountHelper:getBalance", "Parameter type incompatible with function.");
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
			this.theWrapper.callbacks.error("AccountHelper:importWalletFromMnemonic", "Parameter type incompatible with function.");
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

	// Will be changed to default to false once legacy wallets are actually legacy in the mainnet.
	// Currently they're only legacy on the testnet.
	exportWalletToMnemonic(wallet, legacy = true) {
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
