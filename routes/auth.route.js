// LIBRARIES:
const { Router } = require("express");
const createHttpError = require("http-errors");
const route = Router();
const RateLimiter = require("express-rate-limit");

const requestThrottler = RateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: {
    status: "429",
    message: "Too many request",
  },
});

const loginThrottler = RateLimiter({
  windowMs: 20 * 60 * 1000,
  max: 30,
  message: {
    status: "429",
    message: "Too many request",
  },
});

// FILES:
const User = require("../models/user.model");
const { userSchemaValidation } = require("../helpers/validations");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/JWTCheck");
const { client } = require("../helpers/redis");

/**
 * @DDOS Redis Rate Limiter
 */

/**
 * @Route Register
 */
route.post("/register", requestThrottler, async (req, res, next) => {
  // TODO: Schema Validation / Sanitization CHECKED
  // TODO: Duplication User CHECKED
  // TODO: Add a new user to the DB CHECKED
  // TODO: Access Token for every user being added CHECKED
  try {
    const result = await userSchemaValidation.validateAsync(req.body);
    const user = await User.findOne({ email: { $eq: result.email } });
    if (user) throw createHttpError.Conflict("Email is already set");
    const newUser = await User.create(result);
    const newUserSaved = await newUser.save();
    const accessToken = await signAccessToken(newUserSaved._id);
    const refreshToken = await signRefreshToken(newUserSaved._id);
    res.send({ accessToken, refreshToken });
  } catch (error) {
    if (error.isJoi === true)
      next(createHttpError.UnprocessableEntity(error.message));
    next(error);
  }
});

/**
 * @Route Login Route
 */

route.post("/login", loginThrottler, async (req, res, next) => {
  // TODO: Login Fields Validation / Sanitization CHECKED
  // TODO: Check the availability of the user CHECKED
  // TODO: Check the password confimity  [ with its hash one in the DB ] ~CHECK~
  // TODO: Access | Refresh Token Generator CHECKED
  try {
    const result = await userSchemaValidation.validateAsync(req.body);
    const user = await User.findOne({ email: { $eq: result.email } });
    if (!user) throw createHttpError.NotFound("User is not registered yet");
    // const isMatched = await user.passValidator(result.password);
    // if (!isMatched)
    //   throw createHttpError.Unauthorized("User/Password is not matched.");
    const accessToken = await signAccessToken(user._id);
    const refreshToken = await signRefreshToken(user._id);
    res.send({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error.isJoi === true)
      next(createHttpError.BadRequest("Invalid User/Password"));
    next(error);
  }
});

/**
 * @route Refresh Token
 */

route.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;
  const userId = await verifyRefreshToken(refreshToken);
  console.log(userId);
  const accessToken = await signAccessToken(parseInt(userId));
  res.send({ accessToken, refreshToken });
});

/**
 * @route Logout Route
 */

route.delete("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createHttpError.BadRequest();
    const userId = await verifyRefreshToken(refreshToken);
    client.DEL(String(userId), (err, reply) => {
      if (err) throw createHttpError.InternalServerError();
      console.log(`Reply: ${reply}`);
      res.sendStatus(204);
    });
  } catch (error) {
    next(error);
  }
});

module.exports = route;
