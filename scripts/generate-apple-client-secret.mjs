#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { SignJWT, importPKCS8 } from 'jose';

function readFlag(name) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) {
    return undefined;
  }
  return match.slice(prefix.length);
}

const keyPath = readFlag('key');
const teamId = readFlag('team') ?? process.env.APPLE_TEAM_ID;
const keyId = readFlag('key-id') ?? process.env.APPLE_KEY_ID;
const servicesId = readFlag('services-id') ?? process.env.APPLE_SERVICES_ID;

if (!keyPath || !teamId || !keyId || !servicesId) {
  console.error(
    `Usage:
  node scripts/generate-apple-client-secret.mjs \\
    --key=./AuthKey_XXXXXXXXXX.p8 \\
    --team=ABCDE12345 \\
    --key-id=XXXXXXXXXX \\
    --services-id=com.yourbound.fucus.si

Produces a 6-month JWT suitable for APPLE_CLIENT_SECRET on Convex:
  npx convex env set APPLE_CLIENT_SECRET "<output>"`,
  );
  process.exit(1);
}

const pem = await readFile(keyPath, 'utf8');
const privateKey = await importPKCS8(pem, 'ES256');

const now = Math.floor(Date.now() / 1000);
const sixMonths = 60 * 60 * 24 * 180;

const jwt = await new SignJWT({})
  .setProtectedHeader({ alg: 'ES256', kid: keyId })
  .setIssuer(teamId)
  .setIssuedAt(now)
  .setExpirationTime(now + sixMonths)
  .setAudience('https://appleid.apple.com')
  .setSubject(servicesId)
  .sign(privateKey);

process.stdout.write(jwt);
