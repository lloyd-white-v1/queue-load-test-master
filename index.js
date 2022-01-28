const puppeteer = require("puppeteer");
const urlParse = require("url-parse");
require("events").EventEmitter.defaultMaxListeners = 0;

const url = "https://eani-tst.outsystemsenterprise.com/postprimary/Login";
const targetHostname = "eani-tst.outsystemsenterprise.com";
const queueHostname = "eani.queue-it.net";

const args = require("minimist")(process.argv.slice(2), {
  default: { n: 10, c: 5 },
});

const userCount = args.n;
const maxConcurrent = args.c;

const urlCheckInterval = 1000;
let openedCounter = 0;
let resolvedCounter = 0;

console.info(`Run test with ${userCount} users`);

// Run initial instances
for (let i = 0; i < maxConcurrent; i++) {
  openInstance();
}

function openInstance() {
  (async () => {
    openedCounter++;
    let startTime = new Date();

    const browser = await puppeteer.launch({ headless: false });
    const [page] = await browser.pages();
    await page.goto(url);

    let hasEnteredQueue = false;
    let intervalVar = setInterval(() => {
      // If browser is in the queue
      if (urlParse(page.url()).hostname === queueHostname) {
        hasEnteredQueue = true;
      }

      if (hasEnteredQueue && urlParse(page.url()).hostname === targetHostname) {
        resolvedCounter++;

        console.log(
          resolvedCounter,
          "RESOLVED",
          getElapsedTime(startTime, new Date()) + "s"
        );

        clearInterval(intervalVar);
        browser.close();

        if (openedCounter < userCount) {
          openInstance();
        }
      }
    }, urlCheckInterval);
  })();
}

function getElapsedTime(startTime, endTime) {
  return (
    Math.round(((endTime.getTime() - startTime.getTime()) / 1000) * 10) / 10
  );
}
