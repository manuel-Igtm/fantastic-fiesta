import { createHash, createHmac, timingSafeEqual } from 'crypto';

type JsonLike = string | number | boolean | null | JsonLike[] | { [key: string]: JsonLike };

function sortObjectKeys(value: JsonLike): JsonLike {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, JsonLike>>((acc, key) => {
        acc[key] = sortObjectKeys(value[key] as JsonLike);
        return acc;
      }, {});
  }

  return value;
}

export function stableStringify(value: unknown): string {
  const normalized = sortObjectKeys((value ?? null) as JsonLike);
  return JSON.stringify(normalized);
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function hashSha256(value: string): string {
  return sha256Hex(value);
}

export function hmacSha256Hex(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function hmacSha256Base64Url(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function safeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length || left.length % 2 !== 0) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
  } catch {
    return false;
  }
}

export function safeEqualsHex(left: string, right: string): boolean {
  return safeEqualHex(left, right);
}

export function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyHmacSha256Base64Url(
  secret: string,
  payload: string,
  signature: string
): boolean {
  const expected = hmacSha256Base64Url(secret, payload);
  return timingSafeEqualString(expected, signature);
}

export function tokenizeValue(value: string, secret: string): string {
  return `tok_${hmacSha256Hex(secret, value)}`;
}

export function tokenFingerprint(token: string): string {
  return sha256Hex(token).slice(0, 12);
}
