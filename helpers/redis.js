//  LIBRARIES:
const redis = require("redis");
const chalk = require("chalk");

const client = redis.createClient();

client.on("connect", () => {
  console.log(chalk.red.bold("Redis is connecting . . . "));
});

client.on("ready", () => {
  console.log(chalk.yellow.bold.underline("Redis is ready to be made of use."));
});

client.on("error", (err) => {
  console.error({ errorMsg: err });
});

client.on("end", () => {
  console.log(chalk.bold.blue("Redis is saying GoodBye."));
});

process.on("SIGINT", async () => {
  client.quit();
  process.exit(1);
});

process.on("uncaughtException", (reason, promise) => {
  console.error(chalk.red.bold("UncoughtError Found\n"));
  console.log({
    reason,
    promise,
  });
  process.exit(1);
});

module.exports = client;
