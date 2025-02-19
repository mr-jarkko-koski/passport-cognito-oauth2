/**
 * Module dependencies.
 */
const util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , { CognitoIdentityProviderClient, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');


/**
 * Creates an instance of `OAuth2Strategy`.
 *
 * The Cognito OAuth 2.0 authentication strategy authenticates requests using the OAuth
 * 2.0 framework and retrieves user data from AWS Cognito User Pools
 *
 * Applications must supply a `verify` callback, for which the function
 * signature is:
 *
 *     function(accessToken, refreshToken, profile, done) { ... }
 *
 * The verify callback is responsible for finding or creating the user, and
 * invoking `done` with the following arguments:
 *
 *     done(err, user, info);
 *
 * `user` should be set to `false` to indicate an authentication failure.
 * Additional `info` can optionally be passed as a third argument, typically
 * used to display informational messages.  If an exception occured, `err`
 * should be set.
 *
 * Options:
 *  const clientDomain = ''; // https://innovation-dev.auth.us-west-2.amazoncognito.com
 *   - `callbackURL`       URL to which the service provider will redirect the user after obtaining authorization
 *   - `clientDomain`      AWS Cognito user pool domain name
 *   - `clientID`          AWS Cognito user pool app client
 *   - `clientSecret`      AWS Cognito user pool app client secret
 *   - `passReqToCallback` when `true`, `req` is the first argument to the verify callback (default: `false`)
 *   - `region`            AWS Cognito user pool region
 *
 * Examples:
 *
 *     passport.use(new OAuth2CognitoStrategy({
 *         callbackURL: 'https://myapp.com/auth/cognito/callback',
 *         clientDomain: 'https://myapp.auth.us-west-2.amazoncognito.com',
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret',
 *         region: 'us-west-2'
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @constructor
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */

function Strategy({clientDomain, clientID, clientSecret, callbackURL, passReqToCallback, clientRegion}, verify) {
  const options = {
    authorizationURL: `${clientDomain}/oauth2/authorize`,
    clientID,
    clientSecret,
    callbackURL,
    passReqToCallback,
    tokenURL: `${clientDomain}/oauth2/token`
  };

  OAuth2Strategy.call(this, options, verify);

  this.cognitoClient = new CognitoIdentityProviderClient({ region: clientRegion });
  this.name = 'cognito-oauth2';
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from AWS Cognito.
 *
 * @param {String} AccessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(userAccessToken, done) {

  const command = new GetUserCommand({ AccessToken: userAccessToken });

  this.cognitoClient.send(command).then((getUserResponse) => {
    const profile = {
      username: getUserResponse.Username
    };

    for(const attribute of getUserResponse.UserAttributes) {
      profile[attribute.Name] = attribute.Value;
    };
    
    return done(null, profile);
  }).catch((userGetError) => {
    return done(userGetError, null);
  });

}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
