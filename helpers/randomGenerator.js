const crypto = require("crypto");

/**
 * @var ACCESS TOKEN PRIVATE KEY
 * @var REFRESH TOKEN PRIVATE KEY
 */

const ATRandomBytes = crypto.randomBytes(32).toString("hex");
const RTRandomBytes = crypto.randomBytes(32).toString("hex");

console.log({
  ATRandomBytes,
  RTRandomBytes,
});
