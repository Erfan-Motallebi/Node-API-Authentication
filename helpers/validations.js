const JOI = require("joi");

const userSchemaValidation = JOI.object({
  email: JOI.string().trim().email().required(),
  password: JOI.string().min(5).required(),
});

module.exports = {
  userSchemaValidation,
};
