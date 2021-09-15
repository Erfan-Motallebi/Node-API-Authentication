// LIBRARIES:
const express = require("express");
const morgan = require("morgan");
const chalk = require("chalk");
const createHttpError = require("http-errors");
const https = require("https");
const { readFileSync } = require("fs");
require("dotenv").config();

// FILES:
const { S_PORT, S_SERVER } = process.env;
const authRouter = require("./routes/auth.route");
const { verifyAccessToken } = require("./helpers/JWTCheck");
const path = require("path");
require("./helpers/database");
require("./helpers/redis");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", verifyAccessToken, (req, res) => {
  res.send("Home page");
});

app.use("/auth", authRouter);

app.all("*", (req, res, next) => {
  next(createHttpError.NotFound());
});

app.use((err, req, res, next) => {
  res.statusCode = err.status || 500;
  res.send({
    error: {
      status: err.status,
      message: err.message,
    },
  });
});

const server = https
  .createServer(
    {
      key: readFileSync(path.resolve(__dirname, "certificates", "key.pem")),
      cert: readFileSync(path.resolve(__dirname, "certificates", "cert.pem")),
    },
    app
  )
  .listen(S_PORT || 5857, S_SERVER, () => {
    const { port, address: hostname } = server.address();
    console.log(
      chalk.red.bold("Server is up and running"),
      chalk.yellowBright.bold(`https://${hostname}:${port}`)
    );
  });

// const server = app.listen(S_PORT || 5857, S_SERVER, () => {
//   const { port, address: hostname } = server.address();
//   console.log(
//     chalk.red.bold("Server is up and running"),
//     chalk.yellowBright.bold(`http://${hostname}:${port}`)
//   );
// });
