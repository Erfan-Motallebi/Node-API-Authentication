// LIBRARIES:
const createHttpError = require("http-errors");
const JWT = require("jsonwebtoken");

// FILES:
const { client } = require("../helpers/redis");
const { PRIVATE_ACCESS_TOKEN, PRIVATE_REFRESH_TOKEN } = process.env;

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      JWT.sign(
        {
          name: "Eric",
          iss: "NodeApiAuth",
        },
        PRIVATE_ACCESS_TOKEN,
        {
          expiresIn: "1h",
          audience: String(userId),
        },
        (err, result) => {
          if (err) return reject(createHttpError.InternalServerError());
          return resolve(result);
        }
      );
    });
  },
  signRefreshToken: (userId) => {
    return new Promise((pass, fail) => {
      JWT.sign(
        {
          name: "Eric",
          iss: "NodeApiAuth",
        },
        PRIVATE_REFRESH_TOKEN,
        { expiresIn: "1y", audience: String(userId) },
        (err, token) => {
          if (err) return fail(createHttpError.InternalServerError());
          client.SET(
            String(userId),
            token,
            "EX",
            365 * 24 * 60 * 60,
            (err, reply) => {
              if (err) {
                fail(createHttpError.InternalServerError());
                return;
              }
              return pass(token);
            }
          );
        }
      );
    });
  },
  verifyAccessToken: (req, res, next) => {
    try {
      const authToken = req.headers["authorization"];
      if (!authToken)
        throw createHttpError.Unauthorized("Authorization is required");
      const token = authToken.split("Bearer ")[1];
      if (!token) throw createHttpError.BadRequest("Access Token is not valid");
      JWT.verify(token, PRIVATE_ACCESS_TOKEN, (error, payload) => {
        if (error) {
          if (error.name === "JsonWebTokenError")
            throw createHttpError.InternalServerError();
          throw createHttpError.InternalServerError(error.message);
        }
        req.payload = payload.aud;
        next();
      });
    } catch (error) {
      next(error);
    }
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((pass, fail) => {
      JWT.verify(refreshToken, PRIVATE_REFRESH_TOKEN, (err, payload) => {
        if (err) {
          if (err.name === "JsonWebTokenError")
            throw createHttpError.Unauthorized();
          throw createHttpError.InternalServerError(err.message);
        }
        client.GET(payload.aud, (err, reply) => {
          if (err) throw createHttpError.InternalServerError();
          if (reply) pass(payload.aud);
        });
      });
    });
  },
};
