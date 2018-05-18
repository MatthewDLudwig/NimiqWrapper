# NimiqWrapper
NimiqWrapper.js is a file containing 3 classes that allow for easier use of the [Nimiq Javascript API](https://github.com/nimiq-network/core).  The 3 classes cover wrapping Nimiq as a whole, wrapping the Nimiq browser miner (pool implementation only), and a final class of utility functions.  My goal when creating this library was to help lower the bar for developers trying to work with Nimiq.  I believe Nimiq has much potential, going far beyond simply mining in the browser, and I can't wait to see what the community creates (hopefully with the help of NimiqWrapper).

#### Let's all work towards a Richer future!

Both wrapping classes were designed in such a way that all interesting events can be listened to using callback functions and both wrapped objects are accessible to the programmer in order to perform advanced functions.  This was done in order to have maximum compatibility with AngularJS but works just as well with NodeJS or any other UI framework.  For UI frameworks, the only thing to remember is that the callbacks may be called outside of the digest cycle / whatever your UI framework calls it.  There's a section in this readme specifically about dealing with this issue in AngularJS and if anyone solves any issues with other frameworks, they can submit a pull request to add a section.

## Implementation Details
### Standard JavaScript
Implementing NimiqWrapper in a site using standard JavaScript and HTML is quite easy.  Simply create whatever handler functions you deem necessary (most likely headHandler will be a minimum requirement) and have those functions update your UI as necessary.  This can be done via changing JavaScript variables and handling the UI seperately, or by manually manipulating the DOM to update the UI.
### AngularJS
NimiqWrapper was designed with AngularJS in mind and so using the two together is quite easy.  Similar to the JavaScript section, you will need to create any necessary handler functions and then pass them to the constructor of the NimiqWrapper object.  The important difference with AngularJS is that you must remember to update angular variables within the digest cycle.

If you know nothing of the digest cycle, some introductory reading can be found [here](https://www.sitepoint.com/understanding-angulars-apply-digest/) and [here](https://www.thinkful.com/projects/understanding-the-digest-cycle-528/).  Once you understand where the issue is, solving it is not too hard.  $scope.$apply and $timeout are the two most well known solutions, with $scope.$evalAsync being the best I've found.  

$scope.$apply was my preferred solution however it can run into issues if a digest cycle is already running.  You can use $scope.$apply pretty reliably in most of the handlers except for headHandler.  The headHandler function has the possibility of being called quite often (as blocks roll in or while you're achieving concensus for the first time) and some of these calls will collide with the current digest cycle.  One solution to colliding with a running digest is to use $timeout.  I won't go into much detail on this solution as it's a common WORKAROUND documented all over the internet.  I've always tried to avoid it, but unfortunately $scope.$apply just isn't reliable enough for use with NimiqWrapper.

After being unhappy with using $timeout in such a way, I did some research and landed upon $scope.$evalAsync which is available in later versions of AngularJS.  A very educational overview of this function can be seen [here](https://www.bennadel.com/blog/2605-scope-evalasync-vs-timeout-in-angularjs.htm) and the same author has an side by side comparison of $evalAsync and a similar function [here](https://www.bennadel.com/blog/2751-scope-applyasync-vs-scope-evalasync-in-angularjs-1-3.htm).  $scope.$evalAsync can be used in the same way as $scope.$apply, except it will always ensure that the function is run at the end of the current digest or start of the next.  This is much faster than $timeout, get's the point clearly across, and fixes the issue with trying to digest in the middle of a digest cycle.
### NodeJS
I'm not too experienced with NodeJS although I figured my experience with JavaScript would carry over.  While the code seems like it should work fine, I'm having issues exporting the classes properly as a NodeJS module.  If anyone would like to volunteer to help me set it up, I can be reached on the Nimiq discord (@Chugwig) or a pull request can be made on this repo.
### Other Implementations
If anyone uses NimiqWrapper with a framework not discussed above, please reach out to me or issue a pull request detailing any implementation details of that framework.  I imagine that NimiqWrapper won't work perfectly on at least one framework, but it was designed to work in most environments and I would like to document any exceptions to that.

## Accessing the Wrapped Objects
As a developer, I like to reduce the amount of repeated code across my projects while still maintaining a close to the bone feel.  With NimiqWrapper.js you can do most basic operations while only working with the NimiqWrapper and MinerWrapper objects, but both wrappers give access to the wrapped objects.  Descriptions of the four objects most developers will be working with are below:
 * NimiqWrapper object (referred to as "wrapper" as needed in the bullets)
   * This object is the meat and bones of NimiqWraper.js and initializes the Nimiq engine.
   * Getters are provided to obtain commonly needed values.
     * Global hash rate, block reward, block height, etc...
     * Further getters can (and should) be added in future updates.
 * MinerWrapper object (accessed through "wrapper.miner")
   * The MinerWrapper object is created by and stored within the NimiqWrapper object.
   * It can be accessed by using the getter function in your NimiqWrapper object.
   * Getters are provided in this object as well, but less information is available.
     * Global hash rate (repeated on purpose), hashrate (current H/s of the miner), and the reward per hour (in NIM)
     * Getters may be added to NimiqWrapper in the future to access these values without needing the MinerWrapper object.
 * wrapper.nimiqInstance
   * This is the officially supported way to access the wrapped Nimiq object.
   * This object has been populated with the following fields:
     * consensus, blockchain, accounts, mempool, network, and wallet.
     * wallet is initialized with the seed and key provided in the constructor.
   * This object is also saved to window.nimiq for use in the console.
     * On official nimiq.com sites, this is equivalent to the window.$ object.
 * wrapper.miner.wrappedMiner
   * This is the officially supported way to access the wrapped SmartPoolMiner object.
   * Most interactions with this object can be done through the MinerWrapper object, but in some cases the direct object may be necessary.

## The Message System
Thinking ahead towards possibly applications I'd like to develop using Nimiq, I've created a system for signing messages with an address.  This is done by abusing the ExtendedTransaction spec provided in Nimiq and details can be seen below:
 * A message consists of 3 nonces and a data field.
   * The 3 nonces are stored in the transaction's value, fee, and validityStartHeight fields respectively.
     * This means that the first nonce can never be 0, as all transactions (even if never sent) must transfer some value.
   * The nonces are meant to help identify a message, and can be used to require unique messages.
   * The data field is meant to store 8-bit integers, but for the message system stores strings.
     * This string is converted to an array of integers by the Util method.
 * A message is first created (providing a transaction) and then signed (providing a proof).
   * Both the message and the proof should be sent to the recipient of the message for confirmation.
   * Confirmation consists of ensuring that the proof was signed by the sender specified in the message.
     * Nonce values are also checked to be the same before decoding and returning the message data.
     * Transactions that do not pass confirmation return 'null' as the data.
   * For future improvements, verifying that the provided proof is actually the signed message would be useful.
     * Currently I'm using a SignatureProof, but there are different proofs available that may provide the functionality required.
     * Pull requests or reaching out to me with suggestions are both greatly appreciated.

When signing a message, it's confirmed that the signer is the address specified in the message but that is all.  After creating and signing a message, both the message and proof should be serialized using the respective functions in NimiqUtils and sent to the recipient.  Once received, the recipient can unserialize the two objects (using NimiqUtils.unserializeMessage and NimiqUtils.unserializeProof) and then confirm the message to work with the value associated with it.  Possible use cases for such a feature include signing in on any site with a Nimiq wallet, sending messages to a game server that could have only come from you (or someone with access to your private key), and many more.  All necessary functions for using the message system are implemented in the NimiqUtils class and can be seen below:
 * stringToData(s)
   * This function simply takes a string and converts it to an array of 8-bit integers.
   * This function need not be called on the data manually, but could be useful in other cases.
 * dataToString(d)
   * This function does the reverse of stringToData() and also need not be called manually.
 * createMessage(sender, nonceA, nonceB, nonceC, data)
   * This function creates a Nimiq.ExtendedTransaction using the provided data.
   * Both the sender and receiver are set to be normal accounts, with the receiver being the Nimiq Null Address.
     * The sender should be the current wallet controlled by the user, but it's been left as a parameter in case necessary.
   * The three nonces are assigned to the value, fee, and validityStartHeight fields.
     * The only requirement here is that nonceA not be 0 as Nimiq transactions cannot send 0 value.
     * These transactions will never see the actual blockchain (at least as designed) but this requirement must still be met.
   * The provided data should be a string that will be converted to an array of integers representing each character.
 * signMessage(message, signer)
   * This function signs a message with the provided wallet object (signer).
   * The signer must have the same address as the one set in the message.sender field.
   * The Nimiq.SignatureProof provided by Nimiq.Wallet.signTransaction(...) is returned.
 * confirmMessage(message, proof, a, b, c)
   * This function accepts a message, proof, and nonce values and confirms that everything matches.
   * The providied nonce values must match those in the message, and the proof must have been signed by the address specified in message.sender
   * In future updates to this function, I hope to somehow confirm that the data "proof" represents is the provided message.
   * The message.data field is returned if all values match, otherwise the null object is returned.
 
## Necessary Handlers
In order to construct a NimiqWrapper object quite a few variables must be provided.  The first 3 are the wallet seed, wallet password, and whether mining should occur.  Wallet seed should be a string containing hexadecimal numbers and produced (ideally) by NimiqUtils.serializeEncryptWallet(...) with the wallet password being the same password used to encrypt the seed.  The third parameter should be a boolean specifying whether mining should begin once consensus is achieved.  The WrappedMiner object will be created regardless of this value, and the value is only used to decide whether mining should begin once consensus is achieved.  This implementation detail may change in the future, as most would expect this variable to be tied directly to the state of the wrapped miner.

The remaining parameters are all required (except the last) but need not do anything.  For handlers you have no use for, "() => {}" and "(status) => {}" should be used as necessary.  The functions required are as follows:
 * minerChanged(status)
   * This handler function is called when the miner state changes.
   * Possible values of status are: "started" and "stopped".
 * connectionState(status)
   * This handler function is called when the connection to the pool changes.
   * Possible values of status are: "connected" and "failed".
 * consensus(status)
   * This handler function is called when a major change in consesnsus occurs.
   * Possible values of status are: "syncing", "established", and "lost"
 * syncStatus(status)
   * This handler function is called while obtaining consensus and provides updates on which step of syncing the wrapper is at.
   * Possible values of status are: "sync-chain-proof", "verify-chain-proof", "sync-accounts-tree", "verify-accounts-tree", and "sync-finalize"
   * These 5 states will be seen in order although sometimes extremely quickly or with some states being skipped.
 * peersChanged()
   * This handler function is called when the number of peers changes.
   * This is one of two functions that accepts no parameter.
   * This handler is useful in reporting any information during the sync as it will be called each time a peer connects or is lost.
     * Do keep in mind though that this handler will be called after the sync and for the remainder of the running time of the program.
     * It is called EVERY time the number of peers changes so don't treat it as a function only called during initialization.
 * headChanged()
   * This handler function is called each time the head of the blockchain changes.
   * This is a good time to update the block height, as well as run any checks for you application.
   * This function should be called once per block as they are produced, although during sync it can be called multiple times as past blocks are retrieved.
   * This will most likely be the most used handler of them all as it's useful for watching the blockchain and reacting to any changes that may have happened in the most recent block.
 * peerJoined(peer)
   * This handler function is called each time a peer joins and provides an object with information on that peer.
   * No realistic uses for this function were found and so the choice was made to make it default to an empty function.
   * This is the only handler that is not required to construct the NimiqWrapper object.
   
## Provided Classes
### NimiqWrapper
This class wraps Nimiq as a whole and takes care of initializing the libraries.  To connect to the network and finish up initialization you must call the connect() function.  This function returns a boolean based on whether the wrapper was ready to connect.  This is done to prevent a call to connect() before the Nimiq libraries are fully loaded.  The recommended way to handle this boolean is by using JavaScript's "setInterval" function repeating once per second.  The interval should be cancelled once connect() returns 'true'.
### MinerWrapper
This class wraps the Nimiq miner, more specifically the pool miner.  It's set up to mine to the account loaded on the creation of NimiqWrapper, and connects to a hard coded pool.  The decision to hard code the pool was made as most uses of this set of classes, will most likely involve the developer having all users mine to a specific pool.  My pool of choice is porkypool and so that's what is currently hard coded.  Feel free to change it up in your own implementation, and future updates to NimiqWrapper may involve the removal of the hard coded pool.
### NimiqUtils
This horribly named class (as there's already another NimiqUtils class and will surely be countless others) provides some utility functions I found necessary while developing the wrapper.  Some of the more useful ones include:
 * bufferToString(ser)
   * Converts a serialized buffer into a string of hexadecimal values.  Useful for serializing and storing/sharing certain objects within Nimiq.
 * stringToBuffer(str)
   * The reverse of bufferToString, this function will return a Nimiq.SerialBuffer created from the passed in string.  This string is split by spaces, and each part of the string is parsed as a hexadecimal value.
 * serializeEncryptWallet(wall, pass)
   * This function exports the passed in wallet (wall), encrypted with the passed in password, and then converts the returned buffer to a string of hexadecimal values.
   * This leaves you with a more familiar representation of a "private key" although this is only similar in the fact that both let you access a cryptocurrency's account.
 * unserializeEncryptedWallet(seed, key)
   * A wallet can be recovered by using this function where 'seed' is the value returned by serializeEncryptWallet(...), and 'key' is the password used to encrypt the wallet.
 * getNewWallet(pass)
   * Generates a new wallet and encrypts it using serializeEncryptWallet(...) returning that same value.
   * The wallet that was created can be accessed by unserializing and decrypting the returned value.
   * While this is a bit of a hassle, this is done to ensure that the returned value and desired password result in the correct wallet.
   * Anyone wanting to do this without all the extra steps can generate the wallet themselves using "Nimiq.Wallet.generate()".
 ## General Notes
 ## Licensing
NimiqWrapper is licensed under the Apache 2.0 license.  This license was chosen in order to restrict developers as little as possible and anything made using NimiqWrapper has no obligations to release source code, include the Apache 2.0 license, or pay me (the creator of NimiqWrapper) any money.

Any modifications made to either of the 3 classes provided with NimiqWrapper won't require that the modified source be released, however I would appreciate if it would be.  Better yet, please submit pull requests for any modifications made that would benefit the community.

If you'd still like to throw some money my way, I accept donations in the following ways:
 * Send NIM to:
   * NQ89 54KX U06J 5S88 LC2Q V684 EESA KXS2 L984
 * Send ETH or tokens to:
   * 0x844a2Fcbc127980b158a04c054A22545a6f44c50
