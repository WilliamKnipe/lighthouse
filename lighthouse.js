import { createObjectCsvWriter } from "csv-writer";
import chromeLauncher from "chrome-launcher"
import lighthouse from "lighthouse";

const urls = ["https://trinnylondon.com/uk/", "https://www.sephora.co.uk/", "https://www.beautypie.com/", "https://sokoglam.com/", "https://www.thebodyshop.com/", "https://uk.glossier.com/", "https://milkmakeup.com/", "https://kyliejennercosmetics.co.uk/", "https://fentybeauty.com/?lang=en-uk", "https://www.maccosmetics.co.uk/", "https://www.lauramercier.co.uk/", "https://www.cerave.co.uk/", "https://www.elfcosmetics.co.uk/"];

const options = {
  output: "json",
  logLevel: "info",
  onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
  maxWaitForLoad: 60000,
  emulatedFormFactor: "none"
};

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  options.port = chrome.port;
  console.log('port', chrome.port);
  const results = await lighthouse(url, options);
  await chrome.kill();

  const {
    performance,
    accessibility,
    "best-practices": bestPractices,
    seo,
  } = results.lhr.categories;
  const audits = results.lhr.audits;

  return {
    url,
    accessibility: accessibility.score * 100,
    bestPractices: bestPractices.score * 100,
    seo: seo.score * 100,
    performance: performance.score * 100,
    firstContentfulPaint: audits["first-contentful-paint"].numericValue,
    largestContentfulPaint: audits["largest-contentful-paint"].numericValue,
    speedIndex: audits["speed-index"].numericValue,
    interactive: audits["interactive"].numericValue,
    serverResponseTime: audits["server-response-time"].numericValue,
    totalBlockingTime: audits["total-blocking-time"].numericValue,
    cumulativeLayoutShift: audits["cumulative-layout-shift"].numericValue,
  };
}

function getDateString() {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
}

async function runLighthouseBatch(urls) {
  const csvWriter = createObjectCsvWriter({
    path: `lighthouse-scores-${getDateString()}.csv`,
    header: [
      { id: "url", title: "URL" },
      { id: "accessibility", title: "Accessibility" },
      { id: "bestPractices", title: "Best Practices" },
      { id: "seo", title: "SEO" },
      { id: "performance", title: "Performance" },
      { id: "firstContentfulPaint", title: "firstContentfulPaint" },
      { id: "largestContentfulPaint", title: "largestContentfulPaint" },
      { id: "speedIndex", title: "speedIndex" },
      { id: "interactive", title: "interactive" },
      { id: "serverResponseTime", title: "serverResponseTime" },
      { id: "totalBlockingTime", title: "totalBlockingTime" },
      { id: "cumulativeLayoutShift", title: "cumulativeLayoutShift" },
    ],
  });

  await chromeLauncher.killAll();

  const results = [];
  for (const url of urls) {
    const result = await runLighthouse(url);
    results.push(result);
  }

  await csvWriter.writeRecords(results);
}

runLighthouseBatch(urls);
