import {
  hmacSha256Base64Url,
  safeEqualHex,
  sha256Hex,
  stableStringify,
  timingSafeEqualString,
  tokenizeValue,
  verifyHmacSha256Base64Url
} from './security.util';

describe('security.util', () => {
  describe('stableStringify', () => {
    it('sorts object keys recursively', () => {
      const input = {
        b: 2,
        a: {
          z: true,
          c: 'x'
        }
      };

      expect(stableStringify(input)).toBe('{"a":{"c":"x","z":true},"b":2}');
    });
  });

  describe('safeEqualHex', () => {
    it('returns true for equal hashes', () => {
      const hash = sha256Hex('save-sabi');
      expect(safeEqualHex(hash, hash)).toBe(true);
    });

    it('returns false for different hashes', () => {
      expect(safeEqualHex(sha256Hex('left'), sha256Hex('right'))).toBe(false);
    });
  });

  describe('hmac verification', () => {
    it('verifies valid signatures', () => {
      const secret = 'super-secret';
      const payload = 'partner.1234567890.idempotency-key.{}';
      const signature = hmacSha256Base64Url(secret, payload);

      expect(verifyHmacSha256Base64Url(secret, payload, signature)).toBe(true);
    });

    it('rejects invalid signatures', () => {
      const secret = 'super-secret';
      const payload = 'partner.1234567890.idempotency-key.{}';
      const signature = hmacSha256Base64Url(secret, payload);
      const tampered = `${signature.slice(0, -1)}x`;

      expect(verifyHmacSha256Base64Url(secret, payload, tampered)).toBe(false);
    });
  });

  describe('timingSafeEqualString', () => {
    it('handles equal and unequal strings', () => {
      expect(timingSafeEqualString('provider-a', 'provider-a')).toBe(true);
      expect(timingSafeEqualString('provider-a', 'provider-b')).toBe(false);
    });
  });

  describe('tokenizeValue', () => {
    it('produces deterministic tokenized values', () => {
      const tokenA = tokenizeValue('acct_12345', 'token-secret');
      const tokenB = tokenizeValue('acct_12345', 'token-secret');
      const tokenC = tokenizeValue('acct_12345', 'another-secret');

      expect(tokenA).toEqual(tokenB);
      expect(tokenA).toMatch(/^tok_[a-f0-9]+$/);
      expect(tokenC).not.toEqual(tokenA);
    });
  });
});
