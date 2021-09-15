const { Schema, model, SchemaTypes } = require("mongoose");
const bcrypt = require("bcrypt");

const { SALT } = process.env;

const userSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: SchemaTypes.String,
      minlength: 5,
      required: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  try {
    const saltRound = await bcrypt.genSalt(+SALT);
    this.password = await bcrypt.hash(this.password, saltRound);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.method("passValidator", async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
});

module.exports = model("User", userSchema);
