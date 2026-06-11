import { describe, expect, test } from 'vitest';

import {
  buildIndexNowPayload,
  parseSitemapUrls,
  parseSubmitIndexNowArgs,
  submitIndexNow,
} from './submit-indexnow.mjs';

describe('parseSitemapUrls', () => {
  test('extracts loc values from the sitemap', () => {
    const urls = parseSitemapUrls(`
      <urlset>
        <url><loc>https://focus.nemi.love/</loc></url>
        <url><loc>https://focus.nemi.love/support/</loc></url>
      </urlset>
    `);

    expect(urls).toEqual([
      'https://focus.nemi.love/',
      'https://focus.nemi.love/support/',
    ]);
  });
});

describe('buildIndexNowPayload', () => {
  test('rejects URLs from a different host', () => {
    expect(() =>
      buildIndexNowPayload({
        host: 'focus.nemi.love',
        key: '1234567890abcdef1234567890abcdef',
        keyLocation:
          'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
        urls: ['https://example.com/'],
      }),
    ).toThrow('IndexNow URLs must belong to focus.nemi.love');
  });
});

describe('parseSubmitIndexNowArgs', () => {
  test('accepts dry-run mode', () => {
    expect(parseSubmitIndexNowArgs(['--dry-run'])).toEqual({ dryRun: true });
  });

  test('rejects unknown arguments', () => {
    expect(() => parseSubmitIndexNowArgs(['--noop'])).toThrow(
      'Unknown argument: --noop',
    );
  });
});

describe('submitIndexNow', () => {
  test('posts the sitemap URLs with the hosted key location', async () => {
    const requests = [];
    const fetchImpl = async (url, init) => {
      requests.push({ init, url });

      if (url === 'https://focus.nemi.love/sitemap.xml') {
        return {
          ok: true,
          text: async () => `
            <urlset>
              <url><loc>https://focus.nemi.love/</loc></url>
              <url><loc>https://focus.nemi.love/privacy/</loc></url>
            </urlset>
          `,
        };
      }

      if (
        url === 'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt'
      ) {
        return {
          ok: true,
          text: async () => '1234567890abcdef1234567890abcdef',
        };
      }

      return {
        ok: true,
        status: 200,
        text: async () => '',
      };
    };

    const result = await submitIndexNow({
      fetchImpl,
      host: 'focus.nemi.love',
      key: '1234567890abcdef1234567890abcdef',
      keyLocation:
        'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
      sitemapUrl: 'https://focus.nemi.love/sitemap.xml',
    });

    const post = requests.at(-1);
    expect(result).toEqual({ dryRun: false, status: 200, submitted: 2 });
    expect(post.url).toBe('https://api.indexnow.org/indexnow');
    expect(JSON.parse(post.init.body)).toEqual({
      host: 'focus.nemi.love',
      key: '1234567890abcdef1234567890abcdef',
      keyLocation:
        'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
      urlList: ['https://focus.nemi.love/', 'https://focus.nemi.love/privacy/'],
    });
  });

  test('retries until the hosted key file is available', async () => {
    let keyAttempts = 0;
    const fetchImpl = async (url, init) => {
      if (
        url === 'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt'
      ) {
        keyAttempts += 1;

        if (keyAttempts === 1) {
          return {
            ok: false,
            status: 404,
            text: async () => '',
          };
        }

        return {
          ok: true,
          text: async () => '1234567890abcdef1234567890abcdef',
        };
      }

      if (url === 'https://focus.nemi.love/sitemap.xml') {
        return {
          ok: true,
          text: async () => `
            <urlset>
              <url><loc>https://focus.nemi.love/</loc></url>
            </urlset>
          `,
        };
      }

      return {
        init,
        ok: true,
        status: 200,
        text: async () => '',
      };
    };

    const result = await submitIndexNow({
      fetchImpl,
      host: 'focus.nemi.love',
      key: '1234567890abcdef1234567890abcdef',
      keyFileAttempts: 2,
      keyFileRetryDelayMs: 0,
      keyLocation:
        'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
      sitemapUrl: 'https://focus.nemi.love/sitemap.xml',
    });

    expect(result).toEqual({ dryRun: false, status: 200, submitted: 1 });
    expect(keyAttempts).toBe(2);
  });

  test('dry-run verifies inputs without posting to IndexNow', async () => {
    const requests = [];
    const fetchImpl = async (url, init) => {
      requests.push({ init, url });

      if (
        url === 'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt'
      ) {
        return {
          ok: true,
          text: async () => '1234567890abcdef1234567890abcdef',
        };
      }

      if (url === 'https://focus.nemi.love/sitemap.xml') {
        return {
          ok: true,
          text: async () => `
            <urlset>
              <url><loc>https://focus.nemi.love/</loc></url>
            </urlset>
          `,
        };
      }

      throw new Error(`Unexpected request: ${url}`);
    };

    const result = await submitIndexNow({
      dryRun: true,
      fetchImpl,
      host: 'focus.nemi.love',
      key: '1234567890abcdef1234567890abcdef',
      keyLocation:
        'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
      sitemapUrl: 'https://focus.nemi.love/sitemap.xml',
    });

    expect(result).toEqual({ dryRun: true, status: null, submitted: 1 });
    expect(requests).toEqual([
      {
        init: undefined,
        url: 'https://focus.nemi.love/1234567890abcdef1234567890abcdef.txt',
      },
      {
        init: undefined,
        url: 'https://focus.nemi.love/sitemap.xml',
      },
    ]);
  });
});
