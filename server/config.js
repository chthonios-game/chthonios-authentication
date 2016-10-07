/* config polyfill */
var config = config || {};

/** Authenticator configuration */
config.authenticator = {};

config.authenticator.port = null || 8081;
config.authenticator.security = {

	/**
	 * Disable to prevent checking of log-in tokens. All tokens and sessions are
	 * considered valid.
	 */
	onlineMode : true,

	/**
	 * The Access-Control-Allow-Origin string presented by the authenticator.
	 * This prevents unlisted different-origin domains from sending us
	 * XMLHttpRequest/etc via browsers which respect the CORS (HTTP access
	 * control).
	 * 
	 * You must configure CORS rules here to allow cross-domain access from your
	 * host domain(s) to the authenticator; else, the browser will disallow the
	 * request and the client will crash.
	 * 
	 * If you want to disable CORS to allow any host, use '*'.
	 */
	acao : '*',
	
	

}