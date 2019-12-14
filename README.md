# Nimiq Wrapper

NimiqWrapper.js is a library wrapping around the [Nimiq Javascript API](https://github.com/nimiq-network/core).  It comes with 6 helper classes that group together similar functions.  These 6 helpers are:
 * HubHelper
 * MinerHelper
 * AccountHelper
 * TransactionHelper
 * SignatureHelper
 * UtilHelper

The original version of NimiqWrapper thinly wrapped around the Nimiq API but only helped with initialization of the objects.  With the current version of NimiqWrapper, not only is initalization made easier, but functions have been made for commonly used code snippets found in Nimiq Apps.  Developers are still encouraged to work with the raw Nimiq API and all wrapped objects are easily accessible from the wrapper object (or the helpers within it).  My goal for this library is for new developers to easily be able to start working with Nimiq, and then as they become more comfortable they can read the wrapper's source (alongside the amazing tutorials at https://nimiq.github.io/) to do things that aren't provided by the wrapper.  I believe Nimiq has much potential, going far beyond simply mining in the browser, and I can't wait to see what the community creates (hopefully with the help of NimiqWrapper).

![logo](https://raw.githubusercontent.com/MatthewDLudwig/NimiqWrapper/master/assets/color_wrapper_small.png)

## Table of Contents  
- [Installation](#installation)
  - [In Browser](#in-browser)
  - [In NodeJS](#in-nodejs)
- [Basics](#basics)
  - [Initialization](#initialization)
  - [Dealing With Errors](#dealing-with-errors)
  - [Common NimiqWrapper Patterns](#common-nimiqwrapper-patterns)
- [The Objects](#the-objects)
  - [NimiqWrapper](#nimiqwrapper)
  - [HubHelper](#HubHelper)
  - [MinerHelper](#minerhelper)
  - [AccountHelper](#accounthelper)
  - [TransactionHelper](#transactionhelper)
  - [SignatureHelper](#signaturehelper)
  - [UtilHelper](#utilhelper)
- [Tutorials](#tutorials)
  - [Minimum Code Needed](#minimum-code-needed)
  - [Customizing The Wrapper](#customizing-the-wrapper)
- [Licensing](#licensing)

## Installation

### In Browser
- Include necessary scripts
  - Nimiq Library
    - https://cdn.nimiq.com/nimiq.js
  - Keyguard Library
    - https://unpkg.com/@nimiq/hub-api@v0.4/dist/standalone/HubApi.standalone.umd.js
	- or
	- https://cdn.jsdelivr.net/npm/@nimiq/hub-api@v0.4/dist/standalone/HubApi.standalone.umd.js
  - NimiqWrapper Library
    - Use `NimiqWrapper.js` in the "releases/browser" directory of this repo.
	- Or use the individual files in the `classes` directory of this repo, including them in the order specified at the top of the files.
	- CDN in the future.

### In NodeJS
- Install necessary NPM modules
  - Nimiq Module (@nimiq/core)
  - NimiqWrapper Module (optional, can instead manually import NimiqWrapper.js)
- If using NimiqWrapper.js instead of the NimiqWrapper module.
  - The only change to the NimiqWrapper.js used by the browser necessary for it to work with NodeJS is to set the `WRAPPING_NODE` variable to true.
  - Alternatively you can use `NimiqWrapper.js` in the "releases/node" directory of this repo which already has `WRAPPING_NODE` set to true.
  - This is already done for the NimiqWrapper module, so no extra changes are necessary if using it.

## Basics

### Initialization
- To start working with the wrapper, simply construct a `NimiqWrapper` object.
  - No parameters are needed for now however you can customize the wrapper later by including an `options` object as a parameter.
- There are 3 objects that require calling an initialization function before they can be used.
  - NimiqWrapper
    - `NimiqWrapper:initNode`
    - This function is called to start the Nimiq Node and in the browser it'll initalize the `Nimiq.___` classes.
    - Most functionality of the wrapper will not work without first calling this function.
  - HubHelper
    - `HubHelper:initKeyguard`
    - This function is called to initialize the keyguard client, letting it know which keyguard URL to connect to and what the default app name should be for function calls.
    - HubHelper is the only class that isn't dependent on `NimiqWrapper:initNode` being called before i can be used.
  - MinerHelper
    - `MinerHelper:initMiner`
    - This function is called to initialize the miner (pool miner by default).
    - The address to mine to, along with the pool's host and port are set with this function.
      - This function **should not** be called again if you want to change these values.
    - This function will not work correctly unless `NimiqWrapper:initNode` has already been called.

### Dealing With Errors
- Errors can occur under a variety of situations when working with NimiqWrapper.
- Some of the more common situations are:
  - When initializing a Nimiq Node.
  - When using the Keyguard.
  - When incompatible parameter types have been passed in.
- All errors will call the error callback that can be set in the NimiqWrapper constructor.
  - The error callback will take the location of the error and the associated messages as parameters.
- Catching errors thrown by NimiqWrapper will usually consist of:
  - Checking the location (possibly splitting by ":") to determine if you care about it.
  - If you care about the thrown error, check it's error message.
- The associated messages with each error will be a string, either custom (based on the error) or one of the following constants:
  - `NimiqWrapper.ERROR_MESSAGES.BAD_PARAM_TYPE`
    - Thrown when a function is given a parameter of incompatible type.
  - `NimiqWrapper.ERROR_MESSAGES.ANOTHER_NODE`
    - Thrown when a Nimiq Node on the same domain name is already running.
  - `NimiqWrapper.ERROR_MESSAGES.NODE_NOT_SUPPORTED`
    - Thrown when the browser is missing a feature required for Nimiq to initialize.
  - `NimiqWrapper.ERROR_MESSAGES.UNKNOWN_INIT`
    - Thrown when an unknown error occurs during initialization.
  - `NimiqWrapper.ERROR_MESSAGES.BAD_FEE`
    - Thrown when there's an attempt to send a transaction with a fee less than 138 Luna (including negative fees) which is treated as no fee.
  - `NimiqWrapper.ERROR_MESSAGES.FREE_TX_LIMIT`
    - Thrown when the developer attempts to send a transaction without a fee when 10 transactions without a fee from the sending address already exist.
  - `NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_SUPPORTED`
    - Thrown when the browser is missing a feature required to use the Nimiq Keyguard.
  - `NimiqWrapper.ERROR_MESSAGES.KEYGUARD_NOT_READY`
    - Thrown when a HubHelper function is called before the Keyguard is done initializing.
  - `NimiqWrapper.ERROR_MESSAGES.BAD_DATA`
    - Thrown when the developer sends a transaction with an extraData of an incompatible type.  None is used in this case.
  - `NimiqWrapper.ERROR_MESSAGES.BAD_ADDRESS`
    - Thrown when the developer sends a transaction with an address of an incompatible type.  The Nimiq Burn address is used in this case (pay attention and always test on Testnet)
  - `NimiqWrapper.ERROR_MESSAGES.UNKNOWN_STATE`
    - Thrown when the miner runs into an unknown state, and should never be thrown.
  - `NimiqWrapper.ERROR_MESSAGES.NO_MINER_YET`
    - Thrown when a MinerHelper function is called before the Miner is initalized.

### Common NimiqWrapper Patterns
- Many functions take an `options` parameter which is optional, but can be ued to change the default option for the function.
  - This object is used similarly by all functions, and only certain properties are valid depending on the function.
  - For each function that takes an `options` parameter, the documentation will be formatted as such:
    - Property Name
      - Description
        - ...
      - Default Value (used if the property isn't defined in the `options` object)
      - Expected Type(s) and Format
  - All properties defined in the documentation are optional and you only need to include a property if you want to change the default value.
- The "Nimiq Burn Address" is referenced in the documentation multiple times and is "NQ07 0000 0000 0000 0000 0000 0000 0000 0000".
  - This was the address that "mined" the genesis block and no private key for this account is currently owned (and statistically never will be).
  - Any NIM sent to this address is irrecoverable and considered "burned".
- The "Global NimiqWrapper Error Callback" is referenced in the documentation multiple times and used for all error logging in NimiqWrapper.
  - This callback can be specified in the `options` object when constructing the NimiqWrapper object (not in `initNode`) and should accept two parameters:
    - The first parameter is the location where the error occurred, which will be in the format "ClassName:FunctionName".
    - The second parameter is the error object/message that was thrown.
  - This callback is set by default to log all errors to the conole as such:
    - "Error at 'ClassName:FunctionName' occurred with message 'MESSAGE'"

## The Objects

### NimiqWrapper
- Variables
  - `HubHelper`
    - The `hubHelper` object for this instance of the wrapper.
  - `minerHelper`
    - The `MinerHelper` object for this instance of the wrapper.
  - `accountHelper`
    - The `AccountHelper` object for this instance of the wrapper.
  - `transactionHelper`
    - The `TransactionHelper` object for this instance of the wrapper.
  - `signatureHelper`
    - The `SignatureHelper` object for this instance of the wrapper.
  - `utilHelper`
    - The `UtilHelper` object for this instance of the wrapper.
- Functions
  - `constructor`
    - This function creates the wrapper object and constructs all helper objects.
    - Parameters
      - `options`
        - `errorCallback`
          - If included, this callback will be called every time an error occurs with 2 parameters:
            - The first parameter is the location where the error occurred, which will be in the format "ClassName:FunctionName".
            - The second parameter is the error object/message that was thrown.
          - The default value is the Global NimiqWrapper Error Callback as described above in "Common NimiqWrapper Patterns".
          - Function
        - `consensusCallback`
          - This callback will be called when the consensus status changes with a single parameter:
            - The parameter passed to this callback will be a string: (lost|syncing|established)
          - By default an empty callback will be used.
          - Function
        - `syncStatusCallback`
          - This callback will be called while the network is being synced with a single parameter:
            - The parameter passed to this callback will be a string: (sync-chain-proof|verify-chain-proof|sync-accounts-tree|verify-accounts-tree|sync-finalize)
          - By default an empty callback will be used.
          - Function
        - `peersChangedCallback`
          - This callback will be called when the peer list changes with no parameters.
          - By default an empty callback will be used.
          - Function
        - `peerJoinedCallback`
          - This callback will be called when a peer is connected to with a single parameter.
            - The parameter passed to this callback will be a `Nimiq.Peer` object.
          - By default an empty callback will be used.
          - Function
        - `headChangedCallback`
          - This callback will be called when the head of the blockchain changes with no parameters.
            - This callback will be called multiple times for each block your node processes as it catches up since the last time it was connected (exact functionality depends on node type).
            - This callback will then be called once each time your node learns that a block was mined.
          - By default an empty callback will be used.
          - Function
        - `minerChangedCallback`
          - This callback will be called when the miner starts or stops with a single parameter.
            - The parameter passed to this callback will be a string: (started|stopped)
            - This callback will never be registered if the miner isn't used (MinerHelper:initMiner).
          - By default an empty callback will be used.
          - Function
        - `connectionStateCallback`
          - This callback will be called when the miner connection state changes with a single parameter:
            - The parameter passed to this callback will be a string: (connected|connecting|disconnected)
            - This callback will never be registered if the miner isn't used (MinerHelper:initMiner).
          - By default an empty callback will be used.
          - Function
  - `initNode`
    - This function is called to initialize the nimiq node used by the wrapper.
    - Parameters
      - `options`
        - `network`
          - This property is used to change which network the node will connect to.
          - The mainnet is connected to by default.
          - String: (TEST|MAIN|DEV|BOUNTY)
        - `type`
          - This property is used to change which type of node will be initialized.
          - A Light node is used by default.
          - String: (NANO|LIGHT|FULL)
        - `debug`
          - This property is used to indicate whether or not the `window.nimiq` object should be populated.
            - Set this to `true` if you wish to reveal the node in the console.
          - The default value is `false` and `window.nimiq` will be `undefined`.
            - `window.Nimiq` is different from `window.nimiq`
          - Boolean
        - `dontConnect`
          - This property is used to indicate whether or not the node should automatically connect to the network after initialization.
            - Set this to `true` if you wish to manually connect to the network.
          - The default value is `false`.
          - Boolean
        - `justClasses`
          - If true, a node won't be initialized and the initialization will stop after downloading the remaining `Nimiq.___` classes.
          - By default it's false.
          - Function
        - `whenLoaded`
          - If included, this callback will be ran once the `Nimiq.___` classes have been loaded but prior to initializing the node.
          - By default an empty callback will be used.
          - Function
        - `whenReady`
          - If included, this callback will be ran once `NimiqWrapper:nodeReady` would return true.
            - This is useful if you'd rather not have to check `nodeReady` to be sure the node is initialized.
            - This is also useful if there's an action you want to only do once when the node is initialized.
          - By default an empty callback will be used.
          - Function
- Getters
  - `nodeType`
    - Returns the type of node that has been initialized as a string.
    - Returns either: (NANO|LIGHT|FULL|UNKNOWN)
  - `nodeReady`
    - This getter returns whether the nimiq node has finished initializing.
    - Ensure that this getter returns true before you do most anything with the `NimiqWrapper` object.
      - HubHelper functions are one of the few exceptions where `nodeReady` doesn't have to be `true`.
  - `hubReady`
    - This getter function returns whether the HubHelper initialization function has been called.
  - `minerReady`
    - This getter function returns whether the MinerHelper initialization function has been called.
  - `peerCount`
    - Returns the number of peers that the node is currently connected.
  - `globalHashrate`
    - Returns the current global hashrate, calculated using the current block's difficulty.
  - `blockReward`
    - Returns the current block reward for mining a block.
  - `blockHeight`
    - Returns the current block height.

### HubHelper

These functions can be accessed through the `hubHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `initKeyguard`
    - This function is called to initalize the keyguard client.
    - Parameters
      - `options`
        - `keyguardURL`
		  - The URL for the accounts manager you wish to connect to.
		  	- Mainnet Keyguard URL: `https://hub.nimiq.com` (the default)
  		  	- Testnet Keyguard URL: `https://hub.nimiq-testnet.com`
		  - Default value used if none is provided is the testnet keyguard URL.
		  - String
		- `appName`
		  - The name that is passed to all keyguard function calls by default and will be displayed in the "Return to ___ " message.
		    - Each HubHelper function can optionally define a different `appName` to be used for that specific function call, and the value set at initialization is only used if the function doesn't define a different one.
		  - Default value is "Nimiq Application"
		  - String
        - `redirectBehavior`
		  - An object that if defined will have the keyguard open via redirecting to the keyguard and then back to your application rather than by opening a popup.
		    - This object will be used for all `requestXXXXX` functions in HubHelper, but can be overridden for that specific call.
		  - Default value is `null` meaning a popup will open with each keyguard call.
		  - Object with the following parameters:
		  	- `popup`
			  - A boolean property specifying whether to use redirects (false) or popups (true).
			  - The default value is `false` and it's pointless to use it on the `initKeyguard` function.
			  - For the `requestXXXXX` functions it can be used to specify that a popup should be used if you had previously specified redirects should be used in `initKeyguard`.
		  	- `url`
			  - The URL that the keyguard will redirect back to after the user completes the requested action.  Must be on the same domain and subdomain as the calling application.
			- `data`
			  - An object which can be passed to the keyguard and that will be accessible via the `HubHelper:getRedirectResponse` function after the redirect.
  - `getRedirectResponse`
    - This function checks whether there current page came from a redirect from the keyguard and if so calls either the success or error callback.
	  - Calling this function repeatedly will always react the exact same, be careful otherwise you'll respond to the same event multiple times.
	    - Weirdly, when you refresh the page calling this function will do nothing even though the URL (which holds the returned keyguard info in the parameters) doesn't change.
	  - If not using popups, the callbacks passed to the `requestXXXXX` functions will not be called and this function must be used instead.
	- Parameters
	  - `onSuccess`
	    - The callback to call if the keyguard request was completed successfully.  The callback should take two parameters:
		  - `result` which contains the same data that would have been returned to the callback passed to the `requestXXXXX` functions.
		  - `data` which contains the data passed to the keyguard with `redirectBehavior.data` so you can maintain state in between redirects.
		    - Whether or not you provide the keyguard data to pass along, this parameter will always have a value.
			- This parameter will always have a `__command` property which informs the programmer which command the redirect response was generated from.
  	  - `onSuccess`
  	    - The callback to call if the keyguard request wasn't completed correctly.  The callback should take two parameters:
  		  - `error` which contains the thrown error.
  		  - `data` which contains the data passed to the keyguard with `redirectBehavior.data` so you can maintain state in between redirects.
		    - Whether or not you provide the keyguard data to pass along, this parameter will always have a value.
			- This parameter will always have a `__command` property which informs the programmer which command the redirect response was generated from.
		- This parameter is optional and if not included the Global NimiqWrapper Error Callback will be used.
  - `requestAddress`
    - This function requests that the user pick one of their accounts and then that account's address and label are sent to the callback function.
    - Parameters
      - `callback`
        - This should be a function taking a single parameter which will have the following properties:
          - address
          - label
      - `options`
        - `onError`
          - If this property is defined, the given function will be called instsead of the Global NimiqWrapper Error Callback.
            - This is useful as the Keyguard will throw errors if the user rejects the action or closes the keyguard before completing the action.
          - NULL (meaning the Global NimiqWrapper Error Callback will be used)
          - Function
        - `appName`
          - If defined, this value will be ued instead of the `appName` set in `initKeyguard`.
            - Only applies for the ingle function call.
          - The default `appName` set in `initKeyguard`.
          - String
        - `redirectBehavior`
		  - An object that if defined will have the keyguard open via redirecting to the keyguard and then back to your application rather than by opening a popup.
		    - This object will be used instead of the object specified during `initKeyguard`.  Can be used to:
			  - Use a popup for a specific function call when by default all other calls use redirects.
			  - Use a redirect for a specific function call when by default all other calls use popups.
		  - Default value is `null` meaning a popup will open with each keyguard call.
		  - Object with the following parameters:
		  	- `popup`
			  - A boolean property specifying whether to use redirects (false) or popups (true).
			  - The default value is `false` and can be used to specify that a popup should be used if you had previously specified redirects should be used in `initKeyguard`.
		  	- `url`
			  - The URL that the keyguard will redirect back to after the user completes the requested action.  Must be on the same domain and subdomain as the calling application.
			- `data`
			  - An object which can be passed to the keyguard and that will be accessible via the `HubHelper:getRedirectResponse` function after the redirect.
  - `requestSignature`
    - This function requests that the user sign a given message with an account of their choosing (or the developer can request a specific one)
    - Parameters
      - `callback`
        - This should be a function taking a single parameter which will have the following properties:
          - signer
          - signerPublicKey
          - signature
      - `options`
        - `onError`
          - If this property is defined, the given function will be called instsead of the Global NimiqWrapper Error Callback.
            - This is useful as the Keyguard will throw errors if the user rejects the action or closes the keyguard before completing the action.
          - NULL (meaning the Global NimiqWrapper Error Callback will be used)
          - Function
        - `appName`
          - If defined, this value will be ued instead of the `appName` set in `initKeyguard`.
            - Only applies for the ingle function call.
          - The default `appName` set in `initKeyguard`.
          - String
        - `redirectBehavior`
		  - An object that if defined will have the keyguard open via redirecting to the keyguard and then back to your application rather than by opening a popup.
		    - This object will be used instead of the object specified during `initKeyguard`.  Can be used to:
			  - Use a popup for a specific function call when by default all other calls use redirects.
			  - Use a redirect for a specific function call when by default all other calls use popups.
		  - Default value is `null` meaning a popup will open with each keyguard call.
		  - Object with the following parameters:
		  	- `popup`
			  - A boolean property specifying whether to use redirects (false) or popups (true).
			  - The default value is `false` and can be used to specify that a popup should be used if you had previously specified redirects should be used in `initKeyguard`.
		  	- `url`
			  - The URL that the keyguard will redirect back to after the user completes the requested action.  Must be on the same domain and subdomain as the calling application.
			- `data`
			  - An object which can be passed to the keyguard and that will be accessible via the `HubHelper:getRedirectResponse` function after the redirect.
        - `data`
          - This is the message to be signed by the user.
          - "Please sign this!"
          - String, Uint8Array, or a normal JS object (which will be converted to a JSON string).
        - `address`
          - This is the friendly representation of the address the developer is requesting the user signs the message with.
          - NULL (meaning the user can select any of their accounts to sign the message with)
          - String containing NQ... format of the string.
  - `requestTransaction`
    - This function requests that the user send a transaction from one of their accounts.
    - Parameters
      - `callback`
        - This should be a function taking a single parameter which will have the following properties:
          - hash
          - serializedTx
          - raw
      - `options`
        - `onError`
          - If this property is defined, the given function will be called instsead of the Global NimiqWrapper Error Callback.
            - This is useful as the Keyguard will throw errors if the user rejects the action or closes the keyguard before completing the action.
          - NULL (meaning the Global NimiqWrapper Error Callback will be used)
          - Function
        - `appName`
          - If defined, this value will be ued instead of the `appName` set in `initKeyguard`.
            - Only applies for the ingle function call.
          - The default `appName` set in `initKeyguard`.
          - String
        - `redirectBehavior`
		  - An object that if defined will have the keyguard open via redirecting to the keyguard and then back to your application rather than by opening a popup.
		    - This object will be used instead of the object specified during `initKeyguard`.  Can be used to:
			  - Use a popup for a specific function call when by default all other calls use redirects.
			  - Use a redirect for a specific function call when by default all other calls use popups.
		  - Default value is `null` meaning a popup will open with each keyguard call.
		  - Object with the following parameters:
		  	- `popup`
			  - A boolean property specifying whether to use redirects (false) or popups (true).
			  - The default value is `false` and can be used to specify that a popup should be used if you had previously specified redirects should be used in `initKeyguard`.
		  	- `url`
			  - The URL that the keyguard will redirect back to after the user completes the requested action.  Must be on the same domain and subdomain as the calling application.
			- `data`
			  - An object which can be passed to the keyguard and that will be accessible via the `HubHelper:getRedirectResponse` function after the redirect.
        - `logoURL`
          - This property can be used to define a picture which will be shown to the user representing the address rather than the default Iqon for that address.
            - The provided URL must be on the same domain as the site the function is being called from.
          - NULL (meaning that the Account Iqon for the address will be used)
          - String
        - `sendFrom`
          - The address you are requesting the user send from.
		    - Specifying an address the user doesn't have in their keyguard is the same as not specifying at all.
			- This function is most often used after requesting the user choose an address with `requestAddress`.
          - NULL (meaning that the user will be prompted to choose which of their accounts they want to send from)
          - String
        - `forceFrom`
          - If true, an error will be thrown if the account specified in `sendFrom` can't complete the transaction.
          - `false`
          - Boolean
        - `address`
          - The address the transaction is being sent to, in the friendly format.
          - Nimiq Burn Address (meaning that sent NIM will be forever lost by default)
          - String
        - `addrType`
          - This property is only needed if the address being sent to is an HTLC or Vesting account.
          - NULL (meaning the recipient is asssumed to be a normal Nimiq account)
          - Enum (`Nimiq.Account.Type`)
        - `amount`
          - The amount of Luna (1/100,000 of a NIM) to be sent to the recipient.
            - `UtilHelper:convertNIMToLuna` is a useful function to convert from NIM to Luna without doing the math yourself.
          - 0 NIM (meaning the transaction won't be sent as all Nimiq Transactions must transfer value)
          - Number
        - `fee`
          - The amount of Luna per Byte to be sent with the transaction as a fee for the minerss.
            - There can't be more than 10 transactions in the mempool with no fee per sender.
            - If a fee is specified, it must be greater than or equal to 138 Luna/Byte otherwise it's treated as 0.
          - 0 Luna/Byte.
          - Number
        - `flags`
          - The flags to be sent with the transaction, which is only needed if the transaction is creating an HTLC or Vesting Account.
          - NULL (meaning the transaction only sends NIM from one account to another)
          - Enum (`Nimiq.Transaction.Flag`)
        - `expiration`
          - This value specifies how many blocks the transaction should be valid for, and is used differently than `TransactionHelper::sendTransaction`
          - NULL (meaning the transaction will immediately be valid and expire in 2 hours if not mined by then)
          - Number
        - `data`
          - This property can be set to add a message (whether a string or a Uint8Array) to the transaction.
            - Transactions without a message are cheaper (as they take up less bytes) and called Basic Transactions.
            - Transactions with a message are called Extended Transactions and can get expensive with large messages.
            - Both Basic and Extended transactions can be sent without a fee / byte and both count towards the 10 feeless transactions per sender in the mempool.
            - So developers should prioritize sending Extended Transactions before Basic Transactions if trying to conserve on fees.
          - NULL (meaning the transaction will be a Basic Transaction without an attached message)
          - Uint8Array or string.

### MinerHelper

These functions can be accessed through the `minerHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `initMiner`
    - This function must be called before any others in MinerHelper can be called, as it initializes the pool miner.
      - The miner will not start mining by default, and `startMining` must be called after this function to start mining.
    - Parameters:
      - `options`
        - `soloMine`
		  - This property can be used to solo mine instead of with a pool.
		  - false (meaning pool miner will be used by default)
		  - Boolean
        - `extraData`
		  - This property can be used to set the extraData the miner will use.
		  - An empty Uint8Array
		  - Uint8Array or a string.
        - `poolHost`
          - This property can be used to change which pool is connected to by the miner.
            - Do not include the port number in this property, and instead split it and use `poolPort` if necessary.
          - "us.nimpool.io"
          - String
        - `poolPort`
          - This property can be used to change which port of the provided pool should be connected to.
            - All pools will tell you which url and port to use, so set this as needed.
          - 8444
          - Number
        - `address`
          - This is the address that will receive payous for the mining.
          - Nimiq Burn Address (meaning payouts will be permanently lost).
          - `Nimiq.Wallet`, `Nimiq.Address`, or a string with the user friendly representation of the address.
  - `startMining`
    - Calling this function will tell the miner to start mining.
  - `stopMining`
    - Calling this function will tell the miner to stop mining.
      - The miner must be stopped before changing the address or pool information.
  - `estimateRewardPerHour`
    - This function will return an estimation of the amount of NIM earned per hour based off the current hashrate of the miner.
      - NIM earned isn't immediately payed out to the specified address as the actual pool handles payouts
- Getters
  - `isMining`
    - Returns `true` if the miner is mining (the state it'd be in after `startMining`) and `false` if not (the state it'd be in after `stopMining`).
  - `hashrate`
    - Return the current hashrate of the miner.
  - `poolBalance` / `payoutBalance`
    - Returns the amount of NIM the pool is reporting that it owes the specified miner address.
    - These two values are similar and a bit confusing.  `payoutBalance` is usually more accurate, but checking both would make sense.
  - `maxThreads`
    - Returns the maximum number of threads you're recommended to use on the platform.
	  - For the browser, `window.navigator.hardwareConcurrency` is used.
	  - For NodeJS, `require('os').cpus().length` is used.
  - `threads`
    - Returns the number of threads the miner is currently using in the browser.
- Setters
  - `threads`
    - Using this setter will tell the miner to change the number of threads it's using.
    - The related getter function will immediately update to reflect this change.

### AccountHelper

These functions can be accessed through the `accountHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `isValidFriendlyAddress`
    - Returns `true` if the given parameter can be parsed by `Nimiq.Address.fromUserFriendlyAddress`, and `false` if not.
	  - This function is useful for validating data the user inputs.
    - Parameters
      - `addr`
        - The object to check whether it contains a friendly address or not.
        - Can be anything, but should only return `true` for strings with the user friendly representation of an address.
  - `getFriendlyAddress`
    - Returns a string containing the user friendly representation of an address.
    - Parameters
      - `obj`
        - The object that the friendly representation should be looked up for.
        - Type of `obj` must be either `Nimiq.Wallet`, `Nimiq.Address`, or `Nimiq.PublicKey`.
  - `getBalance`
    - This function will retrieve the balance of the given account/address and will call the callback function with the balance.
    - Parameters
      - `obj`
        - The object that the balance should be looked up for.
        - Must be a `Nimiq.Wallet, `Nimiq.Address, or a string with the user friendly representation of the address.
      - `callback`
        - A function taking a single parameter which is the balance (as a number).
        - This callback will be called with a value of `0` if the given address doesn't exist.
  - `createWallet`
    - This function will generate a random private key and return the wallet associated with it.
  - `importWalletFromHexKey`
    - This function will load and return a wallet using the given private key in hexadecimal format.
    - Parameters
      - `key`
        - The private key for the wallet being loaded.
        - Must be a string and it does not matter if it start with "0x".
        - This representation of the key will be familiar to those who've worked with other blockchains in the past.
  - `importWalletFromMnemonic`
    - This function will load and return a wallet using the given 24-word mnemonic.
    - Parameters
      - `words`
        - The set of 24 word to be used to load the wallet.
        - This parameter should either be an array of words, or a string with the words separated by spaces.
  - `importWalletFromBuffer`
    - This function will load and return a wallet using the given buffer object.
    - Parameters
      - `buffer`
        - A Uint8Array, compatible with the value returned by `exportWalletToBuffer`.
  - `importWalletFromEncryptedBuffer`
    - This function will load a wallet uing the given buffer object after unlocking it with the given password.
      - Unlike similar function in AccountHelper, this function doesn't return the wallet but instead passes ittt as a parameter to the given callback.
      - This is necessary as unlocking the wallet is an asynchronous function.
    - Parameters
      - `buffer`
        - A Uint8Array, compatible with the value returned by `exportWalletToEncryptedBuffer`.
      - `password`
        - Should be the password originally used with `exportWalletToEncryptedBuffer`.
        - An incorrect password will throw an error.
      - `callback`
        - A function that will be called with the loaded wallet as it's only parameter.
        - The callback is only called if the wallet was imported succesfully.
      - `errorCallback`
        - This is an optional callback which would be called if an error occurred while unlocking the wallet.
        - The most common error to occur will be an incorrect password being provided, so this callback is useful for detecting such an error.
        - If not included, the Global NimiqWrapper Error Callback will be used.
  - `exportWalletToHexKey`
    - This function will return a string with the hexadecimal representation of the given wallet's private key.
    - Parameters
      - `wallet`
        - The `Nimiq.Wallet` object being exported.
  - `exportWalletToMnemonic`
    - This function will return an array containing the 24 words in the Mnemonic repreenting the wallet's private key.
    - Parameters
      - `wallet`
        - The `Nimiq.Wallet` object being exported.
      - `legacy`
        - A boolean value which specified which format of Mnemonic to return.
          - Legacy mnemonics are used for Single Address accounts.
          - Non-Legacy mnemonics are usesd for Keyguard accounts which can hold multiple Nimiq Accounts.
        - By default, this parameter is `false`.
  - `exportWalletToBuffer`
    - This function will return a buffer compatible with `importWalletFromBuffer`.
    - Parameters
      - `wallet`
        - The `Nimiq.Wallet` object being exported.
  - `exportWalletToEncryptedBuffer`
    - This function will export a wallet to a buffer after encrypting the wallet with the given password.
      - Unlike similar functions in AccountHelper, this functon doesn't return the buffer but instead passes it as a parametter to the given callback.
      - This is necessary as locking the wallet is an asyncrhonous function.
    - Parameters
      - `wallet`
        - The `Nimiq.Wallet` object being exported.
      - `password`
        - The password that should be ued to encrypt the wallet.
      - `callback`
        - A function that should take a single parameter, which will be the created Uint8Array buffer.

### TransactionHelper

These functions can be accessed through the `transactionHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `getRemainingFreeTransactionsFor`
    - This function will return the number of free transactions that the given address can send right now.
      - This value will always be less than or equal to 10, and always greater than 0.
      - Once the feeless transactions in the mempool for that sender have been mined, future calls to this function will return a higher number.
    - Parameters
      - `obj`
        - Represents the address being inspected.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or aa string with the user friendly representation of the address.
  - `watchForTransactionsTo`
    - This function will watch the mempool for any new transactions being sent **to** the given address and will return an object with the following properties:
      - `type`
        - Always equal to `to` and is useful for keeping track if you have multiple watchers going.
      - `watching`
        - The user friendly representation of the address being watched.  Useful when multiple watcher are going.
      - `stopWatching`
        - This function can be called at any time to tell the wrapper to stop listening for transactions sent to the address.
    - Parameters
      - `obj`
        - Represents the address being inspected.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or aa string with the user friendly representation of the address.
      - `callback`
        - Should be a function which take a single parameter (a `Nimiq.Transaction` object).
  - `watchForTransactionsFrom`
    - This function will watch the mempool for any new transactions being sent **from** the given address and will return an object with the following properties:
      - `type`
        - Always equal to `from` and is useful for keeping track if you have multiple watchers going.
      - `watching`
        - The user friendly representation of the address being watched.  Useful when multiple watcher are going.
      - `stopWatching`
        - This function can be called at any time to tell the wrapper to stop listening for transactions sent from the address.
    - Parameters
      - `obj`
        - Represents the address being inspected.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or aa string with the user friendly representation of the address.
      - `callback`
        - Should be a function which take a single parameter (a `Nimiq.Transaction` object).
  - `watchForTransactionsInvolving`
    - This function will watch the mempool for any new transactions involving (both to and from) the given address and will return an object with the following properties:
      - `type`
        - Always equal to `all` and is useful for keeping track if you have multiple watchers going.
      - `watching`
        - The user friendly representation of the address being watched.  Useful when multiple watcher are going.
      - `stopWatching`
        - This function can be called at any time to tell the wrapper to stop listening for transactions sent to the address.
    - Parameters
      - `obj`
        - Represents the address being inspected.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or aa string with the user friendly representation of the address.
      - `callback`
        - Should be a function which take a single parameter (a `Nimiq.Transaction` object).
  - `sendTransaction`
    - This function can be used to send a transaction from a `Nimiq.Wallet` object.
    - Parameters
      - `fromWallet`
        - The `Nimiq.Wallet` object sending the transaction.
      - `options`
        - `address`
          - The address of the recipient of the transaction.
          - Nimiq Burn Address
          - `Nimiq.Address` object or a string with the user friendly representation of the address.
        - `amount`
          - The amount of Luna to be sent to the recipient.
          - 0 NIM (meaning the transaction will fail to send)
          - Number
        - `fee`
          - The amount of Luna/byte to be sent with the transaction as a fee.
          - 0 (meaning the transaction is a feeless transaction)
          - Number
        - `expiration`
          - This value specifies at what block height the transaction becomes valid to mine, and if the transaction hasn't been mined 120 blocks (about 2 hours) after this value it'll be invalidated.
            - This prevents transactions from floating around during times when the network is congested, and then randomly getting mined a few days later possibly causing the user to be charged twice.
            - If this value is set to less than the current block height, it'll be immediately valid but will expire 2 hours after the specified block height and not 2 hours after it was submitted.
          - NULL (meaning the transaction will be immediately valid and expire in 2 hours if not mined)
          - Number
        - `data`
          - This property can be set to add a message to the transaction.
          - NULL (meaning the transaction will be a Basic Transaction without a message attached)
          - `Uint8Array` or a string.
      - `callback`
        - An optional callback function that will be called when the transaction has been accepted into the mempool.
          - This callback will not be called if the transaction is rejected for whatever reason.
          - One reason a transaction may be rejected is if there is an exact duplicate already in the mempool (since Nimiq transaction don' have a nonce).
        - If provided, this callback will be given the `Nimiq.Transaction` object for the transaction as it's only parameter.

### SignatureHelper

These functions can be accessed through the `signatureHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `signMessage`
    - This function can be used to sign a message with the given wallet, with the `Nimiq.Signature` object being returned.
    - Parameters
      - `wallet`
        - The `Nimiq.Wallet` object signing the message.
      - `message`
        - The message being signed by the wallet.
        - Can either be a `Uint8Array`, a string, or a JS object (which will be converted to a JSON string).
  - `verifyKeyguardSignature`
    - This function can be used with a result from `HubHelper:requestSignature` and the message that was supposedly signed to verify whether the signature is valid for that message.
    - Parameters
      - `signedMessage`
        - An object returned by the keyguard after signing a message, or an object with the same properties.
	  - `rawMessage`
	    - The originally signed message.
		- The additions to the data made by the Keyguard when signing are done for you automatically so you can use your message as it was specified in `HubHelper:requestSignature`.
  - `verifyRawSignature`
    - This function can be used to verify that a signature represents the given message and was signed by the given public key (different from the user friendly address).
    - Parameters
      - `signature`
        - A `Nimiq.Signature` object.
      - `publicKey`
        - A `Nimiq.PublicKey` object.
          - Can be retrieved from a `Nimiq.Wallet` object or manually constructed by the developer.
      - `message`
        - The message the developer wants to confirm was signed by the given public key.
        - Should be a `Uint8Array`, a string, or a JS object (which will be converted to a JSON string).

### UtilHelper

These functions can be accessed through the `utiHelper` property of the constructed `NimiqWrapper` object.

- Functions
  - `convertLunaToNIM`
    - This function converts the given value to its equivalent in NIM.
      - This is the same as dividing the value by 100,000.
    - Parameters
      - `value`
        - The amount of Luna to be converted.
  - `convertNIMTToLuna`
    - This function converts the given value to its equivalent in Luna.
      - This is the same as multiplying the value by 100,000.
    - Parameters
      - `value`
        - The amount of NIM to be converted.
  - `getTransactionByHash`
    - This function only works for full nodes, and will call the given callback with the transaction once retrieved.
    - Parameters
      - `hash`
        - The transaction hash for the tx being looked up.
        - Must be a `Nimiq.Hash` object or a string with the hexadecimal representation of the hash (with or without the "0x")
      - `callback`
        - A function taking a single parameter with the following properties:
          - `txHash`
            - A `Nimiq.Hash` object representing the txs hash.
          - `blockHash`
            - A `Nimiq.Hash` object representing the block hash of the block the transaction is included in.
          - `height`
            - The block height of the block this transaction was included in.
          - `index`
            - The index of the transaction (most likely within the block).  Not needed for most applications.
          - `sender`
            - A `Nimiq.Address` object representing the sender of the transaction.
          - `recipient`
            - A `Nimiq.Address` object representing the recipient of the transaction.
  - `getBlockByHash`
    - This function only works for full nodes, and will call the given callback with the block once retrieved.
    - Parameters
      - `hash`
        - The block hash for the block being looked up.
        - Must be a `Nimiq.Hash` object or a string with the hexadecimal representation of the hash (with or without the "0x")
      - `callback`
        - A function taking a single parameter with the following properties:
          - `version`
            - The version number for the block, useful for if hard forks ever occur.
          - `time`
            - The Unix Timestamp reported by the miner saying when the block was mined.
          - `height`
            - The block height of the block.
          - `nonce`
            - The nonce that was used to succesfully mine the block.
          - `hash`
            - The block hash for the block.
          - `lastHash`
            - The block hash for the last block in the chain (`height` - 1)
  - `getBlockByHeight`
    - This function only works for full nodes, and will call the given callback with the block once retrieved.
    - Parameters
      - `height`
        - The height of the block being looked up.
      - `callback`
        - A function taking a single parameter with the following properties:
          - `version`
            - The version number for the block, useful for if hard forks ever occur.
          - `time`
            - The Unix Timestamp reported by the miner saying when the block was mined.
          - `height`
            - The block height of the block.
          - `nonce`
            - The nonce that was used to succesfully mine the block.
          - `hash`
            - The block hash for the block.
          - `lastHash`
            - The block hash for the last block in the chain (`height` - 1)
  - `getIqonURLFor`
    - This function returns a URL to the Nimiq Iqon image for an address using the Mopsus API.
      - The URL can be put into the `src` of an img tag or used however else the developer chooses.
    - Parameters
      - `obj`
        - Represents the address that an image url should be returned for.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or a string with the user friendly representation of the address.
      - `png`
        - A boolean value which indicates whether a PNG (`true`) or SVG (`false`) should be returned.
        - The default value if none is given is `false` as SVGs are easily scalable.
      - `size`
        - A number value which indicates what size (square) the PNG should be.
        - If `png` is `false`, this parameter is ignored.
        - If `png` is `true` and this parameter is not given, no size will be indicated and Mopsus will use it's default.
  - `getTransactionRequestURL`
    - This function returns a URL to Nimiq Safe that requests the user send a transaction.
      - These are useful for hyperlinks or other use cases where the keyguard can't be directly called.
    - Parameters
      - `obj`
        - Represents the address that the developer is requesting a transaction be sent to.
        - Should be a `Nimiq.Wallet`, `Nimiq.Address`, or a string with the user friendly representation of the address.
      - `amount`
        - A number indicating the number of NIM that Nimiq Safe should suggest the user send.
          - The user can change this value once they get to Nimiq Safe though.
        - The minimum value is `.01 NIM` which is 1,000 Luna.
        - The default value is `0 NIM` and the user could then change it once they arrive at the safe.
      - `message`
        - The message that the developer is suggesting be attached with the requested transaction.
        - Must be a string, and if not given then no message will be suggested to the user.
  - `getHTMLSymbol`
    - This function returns the HTML code needed to display the NIM (⬣) and Luna (☾) symbols.
    - Parameters
      - `whichSymbol`
        - A boolean value indicating whether the NIM symbol (`true`) or the Luna symbol (`false`) should be returned.

## Tutorials

### Minimum Code Needed

```
//Creates the NimiqWrapper using default callbacks.
let wrapper = new NimiqWrapper();

//Creates our node as a Light node, and connects to the mainnet.
wrapper.initNode();

//Now we can do whatever we want with NimiqWrapper!
//Remember to check wrapper.nodeReady to ensure the node is done starting.
```

### Customizing The Wrapper
```
//Creates the NimiqWrapper with a head changed callback that logs the block height.
let wrapper = new NimiqWrapper({
  headChangedCallback: () => {
    console.log("New block height: " + wrapper.blockHeight);
  }
});

let appLogic = () => {
  //Now we can do whatever we want with NimiqWrapper!
  //We don't need to check wrapper.nodeReady as this function is only called once the node is ready.
  let wallet = wrapper.accountHelper.createWallet();
  alert(wrapper.accountHelper.exportWalletToMnemonic(wallet).join(" "));
};


//Creates our node as a Light node, and connects to the testnet.
wrapper.initNode({
  network: "TEST",
  type: "LIGHT",
  whenReady: appLogic
});
```

## Licensing
NimiqWrapper is licensed under the Apache 2.0 license.  This license was chosen in order to restrict developers as little as possible and anything made using NimiqWrapper has no obligations to release source code, include the Apache 2.0 license, or pay me (the creator of NimiqWrapper) any money.

Any modifications made to either of the classes provided with NimiqWrapper won't require that the modified source be released, however I would appreciate if it would be.  Better yet, please submit pull requests for any modifications made that would benefit the community.

If you'd like to throw some money my way, I accept donations in the following ways:
 * Send NIM to:
   * NQ02 DT0F 2QLS X034 097D EJKF YUUJ X53X 2NQX
