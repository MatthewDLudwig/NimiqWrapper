// Order - 6

class SignatureHelper {
	/*
		Variables:
			theWrapper
	*/

	constructor(wrapper) {
		this.theWrapper = wrapper;
	}

	signMessage(wallet, message) {
		let obj = {
			private : wallet._keyPair.privateKey,
			public : wallet._keyPair.publicKey,
			data : null
		}

		if (typeof message == "string") {
			obj.data = Nimiq.BufferUtils.fromAscii(txDetails.data);
		} else if (message instanceof Uint8Array) {
			obj.data = message;
		} else {
			obj.data = Nimiq.BufferUtils.fromAscii(JSON.stringify(message, null, "\t"));
		}

		return Nimiq.Signature.create(obj.private, obj.public, obj.data);
	}

	verifyKeyguardSignature(signedMessage, rawMessage) {
		const signature = new Nimiq.Signature(signedMessage.signature);
		const publicKey = new Nimiq.PublicKey(signedMessage.signerPublicKey);

		const data = HubApi.MSG_PREFIX + rawMessage.length + rawMessage;
		const dataBytes = Nimiq.BufferUtils.fromUtf8(data);
		const hash = Nimiq.Hash.computeSha256(dataBytes);

		return signature.verify(publicKey, hash);
	}

	verifyRawSignature(signature, publicKey, message) {
		if (!(signature instanceof Nimiq.Signature)) {
			signature = new Nimiq.Signature(signature);
		}

		if (!(publicKey instanceof Nimiq.PublicKey)) {
			publicKey = new Nimiq.PublicKey(publicKey);
		}

		if (typeof message == "string") {
			message = Nimiq.BufferUtils.fromUtf8(txDetails.data);
		} else if (!(message instanceof Uint8Array)) {
			message = Nimiq.BufferUtils.fromUtf8(JSON.stringify(message, null, "\t"));
		}

		return signature.verify(publicKey, message);
	}

}
