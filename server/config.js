/* config polyfill */
var config = config || {};

/** Authenticator configuration */
config.authenticator = {};

config.authenticator.servername = null || "Default Server";
config.authenticator.port = null || 8081;
config.authenticator.security = {

	/**
	 * Disable to prevent checking of log-in tokens. All tokens and sessions are considered valid.
	 */
	onlineMode : true,

	/**
	 * The Access-Control-Allow-Origin string presented by the authenticator. This prevents unlisted different-origin
	 * domains from sending us XMLHttpRequest/etc via browsers which respect the CORS (HTTP access control).
	 * 
	 * You must configure CORS rules here to allow cross-domain access from your host domain(s) to the authenticator;
	 * else, the browser will disallow the request and the client will crash.
	 * 
	 * If you want to disable CORS to allow any host, use '*'.
	 */
	acao : '*',

	/**
	 * The password to access the authenticator. If you do not wish to enable password for access, set this property to
	 * null.
	 * 
	 * You must specify the hash method and the password as a string separated by a colon (:) below. The hash method
	 * must be supported by openssl on the system (use `openssl list-message-digest-algorithms`) or specify `plain` if
	 * the password is plain-text. If the password is not plain-text, the password hash must be stored in hex format. It
	 * is suggested the hash be sha256 or greater.
	 */
	accessPassword : null,

	/**
	 * The password to announce a new server on the network. If you do not wish to enable password for access, set this
	 * property to null. It is strongly recommended you set this password, since not doing so allows anyone to advertise
	 * game servers on your gateway!
	 * 
	 * You must specify the hash method and the password as a string separated by a colon (:) below. The hash method
	 * must be supported by openssl on the system (use `openssl list-message-digest-algorithms`) or specify `plain` if
	 * the password is plain-text. If the password is not plain-text, the password hash must be stored in hex format. It
	 * is suggested the hash be sha256 or greater.
	 */
	announcePassword : null

}

module.exports = {
	config : config
};