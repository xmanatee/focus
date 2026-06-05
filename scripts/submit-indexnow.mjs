const HOST = 'focus.nemi.love';
const INDEXNOW_KEY = '8e91ca00fd340d625f5aeddb1f2a4787';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_FILE_ATTEMPTS = 6;
const KEY_FILE_RETRY_DELAY_MS = 10_000;

export function parseSitemapUrls(sitemapXml) {
  const urls = Array.from(sitemapXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g))
    .map((match) => match[1].trim())
    .filter((url) => url.length > 0);

  if (urls.length === 0) {
    throw new Error('Sitemap does not contain any loc entries');
  }

  return urls;
}

export function buildIndexNowPayload({ host, key, keyLocation, urls }) {
  const urlList = Array.from(new Set(urls));

  for (const rawUrl of urlList) {
    const url = new URL(rawUrl);

    if (url.hostname !== host) {
      throw new Error(`IndexNow URLs must belong to ${host}`);
    }

    if (url.protocol !== 'https:') {
      throw new Error('IndexNow URLs must use HTTPS');
    }
  }

  return {
    host,
    key,
    keyLocation,
    urlList,
  };
}

async function fetchText(fetchImpl, url, label) {
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }

  return response.text();
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function verifyKeyFile({
  attempts,
  fetchImpl,
  key,
  keyLocation,
  retryDelayMs,
}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const hostedKey = (
        await fetchText(fetchImpl, keyLocation, 'IndexNow key file')
      ).trim();

      if (hostedKey !== key) {
        throw new Error(
          'Hosted IndexNow key does not match the configured key',
        );
      }

      return;
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await delay(retryDelayMs);
      }
    }
  }

  throw lastError;
}

export async function submitIndexNow({
  fetchImpl = globalThis.fetch,
  host,
  key,
  keyFileAttempts = KEY_FILE_ATTEMPTS,
  keyFileRetryDelayMs = KEY_FILE_RETRY_DELAY_MS,
  keyLocation,
  sitemapUrl,
}) {
  await verifyKeyFile({
    attempts: keyFileAttempts,
    fetchImpl,
    key,
    keyLocation,
    retryDelayMs: keyFileRetryDelayMs,
  });

  const sitemapXml = await fetchText(fetchImpl, sitemapUrl, 'Sitemap');
  const payload = buildIndexNowPayload({
    host,
    key,
    keyLocation,
    urls: parseSitemapUrls(sitemapXml),
  });

  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    method: 'POST',
  });

  if (response.status !== 200 && response.status !== 202) {
    const body = await response.text();
    throw new Error(`IndexNow returned HTTP ${response.status}: ${body}`);
  }

  return {
    status: response.status,
    submitted: payload.urlList.length,
  };
}

async function main() {
  const result = await submitIndexNow({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    sitemapUrl: SITEMAP_URL,
  });

  console.log(`Submitted ${result.submitted} URL(s) to IndexNow.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
