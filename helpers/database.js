// LIBRARIES:
const { connect, connection } = require("mongoose");
const chalk = require("chalk");

const { MONGO_URL, MONGO_DB_NAME } = process.env;

connect(MONGO_URL, {
  dbName: MONGO_DB_NAME,
});

connection.on("connected", () => {
  console.log(chalk.yellow.bold("Db is connected NOW."));
});

connection.on("error", (err) => {
  console.log(
    chalk.red.bold({
      errorName: error.name,
      errorMsg: error.message,
    })
  );
});

connection.on("close", async () => {
  console.log(chalk.green("SERVER IS DOWN RIGHT NOW. BYE~"));
});

process.on("SIGINT", () => {
  connection.close();
  process.exit(1);
});
