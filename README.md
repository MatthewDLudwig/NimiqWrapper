# NimiqWrapper
NimiqWrapper.js is a file containing 3 classes that allow for easier use of the [Nimiq Javascript API](https://github.com/nimiq-network/core).  The 3 classes cover wrapping Nimiq as a whole, wrapping the Nimiq browser miner (pool implementation only), and a final class of utility functions.  My goal when creating this library was to help lower the bar for developers trying to work with Nimiq.  I believe Nimiq has much potential, going far beyond simply mining in the browser, and I can't wait to see what the community creates (hopefully with the help of NimiqWrapper).

##### Table of Contents  
[General Details](#general)  

#### Let's all work towards a Richer future!

Both wrapping classes were designed in such a way that all interesting events can be listened to using callback functions and both wrapped objects are accessible to the programmer in order to perform advanced functions.  This was done in order to have maximum compatibility with AngularJS but works just as well with NodeJS or any other UI framework.  For UI frameworks, the only thing to remember is that the callbacks may be called outside of the digest cycle / whatever your UI framework calls it.  There's a section in this readme specifically about dealing with this issue in AngularJS and if anyone solves any issues with other frameworks, they can submit a pull request to add a section.

<a name="general"> </a>
## General Details
### Getting Started
In order to fully connect to the Nimiq Network,, two objects are required.  The first is the `InitInfo` object and the second is the `HandlerFunctions` object.  The `InitInfo` object is meant to contain information on the wallet, mining address, and other information needed to connect to the Nimiq Network.  This object will be passed to the connect(...) function of the NimiqWrapper object.  The `HandlerFunctions` object is meant to contain the callback functions used to obtain information from the wrapper.  This object will be passed to the constructor of the NimiqWrapper object.  Descriptions of the possible fields in each object are given below, and if not present default values will be used.

### InitInfo Object
 * walletSeed
   * Default Value: None, no wallet will be initalized and a message will be logged in the console.
   * Purpose: To define the encrypted serialized form of the wallet to be loaded.
 * walletKey
   * Default Value: None, see above.
   * Purpose: To define the key used to encrypt the walletSeed
 * poolHost
   * Default Value: pool.porkypool.com
   * Purpose: To define the host of the pool to mine with.  Defaults to porkypool.
 * poolPort
   * Default Value: 8444
   * Purpose: To define the port of the pool to mine with.  Defaults to porkypool:8444.
 * mineToAddr
   * Default Value: Nimiq Null Address
   * Purpose: To define the address (in friendly form) to mine to.
### HandlerFunctions Object
 * errorHandler(where, err)
   * This handler function is called when an error occurs in the Nimiq Wrapper.
   * `where` will be a string which references where in the code the error occured.
     * This string will become more detailed over time, and will be useful for debugging.
   * `err` will be the message of the error.
     * This may be replaced by the actual error object or a third parameter will include the traceback.
 * minerChanged(status)
   * This handler function is called when the miner state changes.
   * Possible values of `status` are: "started" and "stopped".
 * connectionState(status)
   * This handler function is called when the connection to the pool changes.
   * Possible values of `status` are: "connected" and "failed".
 * consensus(status)
   * This handler function is called when a major change in consesnsus occurs.
   * Possible values of `status` are: "syncing", "established", and "lost"
 * syncStatus(status)
   * This handler function is called while obtaining consensus and provides updates on which step of syncing the wrapper is at.
   * Possible values of `status` are: "sync-chain-proof", "verify-chain-proof", "sync-accounts-tree", "verify-accounts-tree", and "sync-finalize"
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
### Minimum Necessary Code
```
let handlers = {
    consensus: (status) => console.log("Consensus: " + status),
    headChanged: () => console.log("Now at height: " + wrapper.blockHeight)
};

//Neither of the handlers above or the mineToAddr field are strictly necessary.
//They are however useful for a minimum connection that simply mines for you in place of advertisement.

let inits = {
    mineToAddr: "NQ07 0000 0000 0000 0000 0000 0000 0000 0000"
};

let wrapper = new NimiqWrapper(true, handlers);
let cancelConnect = setInterval(function () {
    let result = wrapper.connect(inits);

    if (result) {
        console.log('Nimiq loaded. Connecting and establishing consensus.');
        clearInterval(cancelConnect);
    }
}, 1000);
```
### Constructor and Connect Functions
The constructor for the NimiqWrapper object takes 4 parameters with the last two being optional.
 * `mine` specifies whether the miner should begin once consensus is reached.
 * `handlerFunctions` is the `HandlerFunctions` object which specifies all of the necessary handler functions you'd like to define.
   * Any callbacks not specified in this object use default functions that simply log appropriate console output.
 * `full` specifies whether a full node should be initialized instead of a light node.
   * This parameter is optional and defaults to false if not included.
 * `network` specifies which network to connect to.
   * Possible values are 0, 1, 2, and 3: corresponding to the test, main, dev, and bounty networks.
   * The default value of this parameter is 1 (main network).

The connect function in the NimiqWrapper object takes 1 parameter being the the `InitInfo` object.

## Implementation Details
### Standard JavaScript
Implementing NimiqWrapper in a site using standard JavaScript and HTML is quite easy.  Simply create whatever handler functions you deem necessary (most likely headHandler will be a minimum requirement) and have those functions update your UI as necessary.  This can be done via changing JavaScript variables and handling updating the UI seperately, or by manually manipulating the DOM to update the UI.  An example of how this can be done can be seen in the demo.html file in this repo, which is hosted live [on my site](https://www.drawpad.org/nimiq/demo.html).
### AngularJS
NimiqWrapper was designed with AngularJS in mind and so using the two together is quite easy.  Similar to the JavaScript section, you will need to create any necessary handler functions and then pass them to the constructor of the NimiqWrapper object.  The important difference with AngularJS is that you must remember to update angular variables within the digest cycle.  If you know nothing of the digest cycle, some introductory reading can be found [here](https://www.sitepoint.com/understanding-angulars-apply-digest/) and [here](https://www.thinkful.com/projects/understanding-the-digest-cycle-528/).  Once you understand where the issue is, solving it is not too hard.  `$apply` and `$timeout` are the two most well known solutions, with $scope.`$evalAsync` being the best I've found.  

`$apply` was my preferred solution however it can run into issues if a digest cycle is already running.  You can use `$apply` pretty reliably in most of the handlers except for headHandler.  The headHandler function has the possibility of being called quite often (as blocks roll in or while you're achieving concensus for the first time) and some of these calls will collide with the current digest cycle.  One solution to colliding with a running digest is to use `$timeout`.  I won't go into much detail on this solution as it's a common workaround documented all over the internet.  I've always tried to avoid it, but unfortunately `$apply` just isn't reliable enough for use with NimiqWrapper.

After being unhappy with using `$timeout` in such a way, I did some research and landed upon `$evalAsync` which is available in later versions of AngularJS.  A very educational overview of this function can be seen [here](https://www.bennadel.com/blog/2605-scope-evalasync-vs-timeout-in-angularjs.htm) and the same author has an side by side comparison of `$evalAsync` and a similar function [here](https://www.bennadel.com/blog/2751-scope-applyasync-vs-scope-evalasync-in-angularjs-1-3.htm).  `$evalAsync` can be used in the same way as `$apply`, except it will always ensure that the function is run at the end of the current digest or start of the next.  This is much faster than `$timeout`, get's the point clearly across, and fixes the issue with trying to digest in the middle of a digest cycle.
### NodeJS
NimiqWrapper can be used within NodeJS using the same file as would be used in a client side solution.  The most important change required is ** to modify the NimiqWrapper.js file to set WRAPPING_NODE to true ** .  The first thing done by the wrapper is to print whether it's running in JS or NodeJS mode, so it's easy to tell if this has been forgotten.  If WRAPPING_NODE is left set to false, the necessary classes won't be exported as a NodeJS module.

The only requirement for NimiqWrapper to run in NodeJS is for ** @nimiq/core ** to be installed in the path of your application.  Alternatively (actually recommended), you can add this package to your package.json file and no issues should occur.
### Other Implementations
If anyone uses NimiqWrapper with a framework not discussed above, please reach out to me or issue a pull request detailing any implementation details of that framework.  I imagine that NimiqWrapper won't work perfectly on at least one framework, but it was designed to work in most environments and I would like to document any exceptions to that.

## Accessing the Wrapped Objects
As a developer, I like to reduce the amount of repeated code across my projects while still maintaining a close to the bone feel.  With NimiqWrapper.js you can do most basic operations while only working with the NimiqWrapper and MinerWrapper objects, but both wrappers give access to the wrapped objects.  Descriptions of the four objects most developers will be working with are below:
 * NimiqWrapper object (referred to as `wrapper` as needed in the bullets)
   * This object is the meat and bones of NimiqWraper.js and initializes the Nimiq engine.
   * Getters are provided to obtain commonly needed values.
     * Global hash rate, block reward, block height, etc...
     * Further getters can (and should) be added in future updates.
 * MinerWrapper object (accessed through `wrapper.miner`)
   * The MinerWrapper object is created by and stored within the NimiqWrapper object.
   * It can be accessed by using the getter function in your NimiqWrapper object.
   * Getters are provided in this object as well, but less information is available.
     * Global hash rate (repeated on purpose), hashrate (current H/s of the miner), and the reward per hour (in NIM)
     * Getters may be added to NimiqWrapper in the future to access these values without needing the MinerWrapper object.
 * `wrapper.wrappedInstance` (`wrapper.nimiqInstance`)
   * This is the officially supported way to access the wrapped Nimiq object.
   * This object has been populated with the following fields:
     * `consensus`, `blockchain`, `accounts`, `mempool`, `network`, `wallet`, and `miner`.
     * `wallet` is initialized with the seed and key provided in the InitInfo object.
   * This object is also saved to `window.nimiq` for use in the console.
     * On official nimiq.com sites, this is equivalent to the `window.$` object.
	 * With the official sushipool wrapper, this is equivalent to the `window.$nimiq` object.
 * `wrapper.wrappedMiner` (`wrapper.miner.wrappedMiner`)
   * This is the officially supported way to access the wrapped SmartPoolMiner object.
   * Most interactions with this object can be done through the MinerWrapper object, but in some cases the direct object may be necessary.

## The Message System
Within the wrapper is a simple messaging system for use with Nimiq accounts.  The messages can either be a raw Uint8Array or a string, and will always be signed with the private key passed to the function.  The associated public key can then be transmitted along with the message (serialization recommended through NimiqUtils.serializePublicKey) and the message verified by the recipient.  This messaging system is useful for tasks ranging from simply proving ownership of an account, to passing messages between the client (key holder) and server.  The message system is NOT meant for passing encrypted messages, but instead messages that are known to come from the key holder.  Messages should never be re-used and should ideally include a timestamp or unique ID in order to prevent reuse.
 * A message can be created using either "createMessageFromData" or "createMessageFromString" and both will return a Nimiq.Signature object.
 * A message can be verified using either "verifyMessageWithData" or "verifyMessageWithString" depending on how it was originally created.
   * Both functions will return a boolean specifying whether or not the message matches with the passed in public key and data.
   * Keep in mind that if a string is passed in to the "verifyMessageWithData" function, the result will always be true.

## Provided Classes
### NimiqWrapper
This class wraps Nimiq as a whole and takes care of initializing the libraries.  To connect to the network and finish up initialization you must call the connect() function.  This function returns a boolean based on whether the wrapper was ready to connect.  This is done to prevent a call to connect() before the Nimiq libraries are fully loaded.  The recommended way to handle this boolean is by using JavaScript's "setInterval" function repeating once per second.  The interval should be cancelled once connect(...) returns 'true'.
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
 * getNewEncryptedWallet(pass)
   * Generates a new wallet and encrypts it using serializeEncryptWallet(...) returning that same value.
   * The wallet that was created can be accessed by unserializing and decrypting the returned value.
   * While this is a bit of a hassle, this is done to ensure that the returned value and desired password result in the correct wallet.
   * Anyone wanting to do this without all the extra steps can generate the wallet themselves using "Nimiq.Wallet.generate()".
## Demo information
### Pure JavaScript Demo
This demo is a clone of the one hosted [by the official team](https://demo.nimiq.com) except using the NimiqWrapper files included here to work with the API.  The same wallet on all computers is connected, and it's "Demo Wallet 1" that is used.
### Angular Demo
This demo is custom made and also shows off the messaging system I've created.
### Demo Wallets and Codes
#### Demo Wallet Format
 * Address (friendly)
 * Seed (encrypted serialized seed in hex)
 * Key (the string used to encrypt the seed)
#### Demo Wallet 1
 * NQ47 M5T3 M565 A0G0 UHSP 1H4D 7J2T 5FLP GHGY
 * 01 08 80 CB 6F 9C BA 2A 6A D6 7F 3B BF 1E 2F 7D C0 6F D3 66 9F 1D 19 70 9C 6D 7B 1B 1D 2D FD F4 E5 32 0A 7C F9 24 97 48 76 FF 2D 9F 5B A6 9C D8 5C 46 A9 76 3A 94
 * Key - Password
#### Demo Wallet 2
 * NQ68 G7SF ENKC 1U1V YR15 E808 X05R 92J1 22J6
 * 01 08 3E E7 DA 2C C0 09 68 5E DA 61 4D E1 90 53 00 6D 12 50 55 FD F4 0E FF 34 69 7E B8 36 23 2B 8F 55 AA 66 64 36 5F 61 1E 82 6E 11 3E F7 6D 63 2F 60 81 F4 F7 5A
 * Dracula
#### Demo Message Format
 * Used Parameters
 * Message Key / Code
 * Proof Key / Code
#### Demo Message 1
 * (1, 1, 1, Str)
 * 01 00 03 53 74 72 B5 F8 38 A7 28 FD B2 1D A6 9F A3 A1 56 2A 0D 77 67 87 36 A3 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 00
 * A5 A4 CD C1 1E 37 8B 27 7B D2 35 BF C4 C4 54 BE E4 03 E7 5B 2F 30 17 9A 18 49 0D A6 85 29 C5 AC 00 E0 D1 79 88 77 94 31 9D D6 E9 DC 3B 89 D8 5E 9D 29 9F 17 99 D7 3E A2 25 FC 42 01 D4 9E 9A D6 30 73 FF 11 18 3D 1D 7D 3F FE BA 36 96 40 02 A7 9D 65 E9 AD EE 33 95 8F AA 9A 34 64 67 53 BF D6 07
#### Demo Message 2
 * (1, 1, 1, Strang)
 * 01 00 06 53 74 72 61 6E 67 B5 F8 38 A7 28 FD B2 1D A6 9F A3 A1 56 2A 0D 77 67 87 36 A3 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00 00 01 00 00 00 01 00 00 00 00
 * A5 A4 CD C1 1E 37 8B 27 7B D2 35 BF C4 C4 54 BE E4 03 E7 5B 2F 30 17 9A 18 49 0D A6 85 29 C5 AC 00 F9 9F 0F 6D F9 5D 07 E0 BB E3 51 09 0F 62 F4 D8 0A DB 09 DF DC 9F 8C B6 45 03 28 A7 89 DF 36 D2 B1 88 AE 77 A8 BD 1D 8C 39 CF 41 E3 4E 7D AF 20 BC 83 43 A5 2A 08 FF 0D 67 BA B5 8F 0A D0 06 05
#### Demo Message 3
 * (12, 42, 1, This is my data)
 * 01 00 0F 54 68 69 73 20 69 73 20 6D 79 20 64 61 74 61 B5 F8 38 A7 28 FD B2 1D A6 9F A3 A1 56 2A 0D 77 67 87 36 A3 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 0C 00 00 00 00 00 00 00 2A 00 00 00 01 00 00 00 00
 * A5 A4 CD C1 1E 37 8B 27 7B D2 35 BF C4 C4 54 BE E4 03 E7 5B 2F 30 17 9A 18 49 0D A6 85 29 C5 AC 00 45 46 4B 47 B2 4D D6 FC 23 78 E9 74 76 27 5A C9 DE 40 DF 35 5C B3 3A 6F 85 0A A9 80 E9 13 AB DE 0A F3 E2 E7 85 A5 4F 5A E3 A0 25 59 22 20 B8 F3 75 68 9D 08 65 53 FC 28 EC 05 88 B5 A6 72 E1 06
## Licensing
NimiqWrapper is licensed under the Apache 2.0 license.  This license was chosen in order to restrict developers as little as possible and anything made using NimiqWrapper has no obligations to release source code, include the Apache 2.0 license, or pay me (the creator of NimiqWrapper) any money.

Any modifications made to either of the 3 classes provided with NimiqWrapper won't require that the modified source be released, however I would appreciate if it would be.  Better yet, please submit pull requests for any modifications made that would benefit the community.

If you'd still like to throw some money my way, I accept donations in the following ways:
 * Send NIM to:
   * NQ89 54KX U06J 5S88 LC2Q V684 EESA KXS2 L984
 * Send ETH or tokens to:
   * 0x844a2Fcbc127980b158a04c054A22545a6f44c50
