// LIBRARIES:
const express = require("express");
const morgan = require("morgan");
const chalk = require("chalk");
const createHttpError = require("http-errors");
const https = require("https");
const { readFileSync } = require("fs");
const path = require("path");
const compression = require("compression");
const responseTime = require("response-time");
require("dotenv").config();

// FILES:
const { S_PORT, S_SERVER } = process.env;
const authRouter = require("./routes/auth.route");
const { verifyAccessToken } = require("./helpers/JWTCheck");
require("./helpers/database");
require("./helpers/redis");

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  compression({
    level: 7,
    threshold: "500kb",
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
app.use(responseTime());

app.get("/", (req, res) => {
  res.send("home page".repeat(100000));
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
