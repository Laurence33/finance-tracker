import { describe, it, expect } from 'vitest';
import { isLocalApiUrl } from './isLocalApi';

describe('isLocalApiUrl', () => {
  it.each([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000/',
  ])('treats %s as local', (url) => {
    expect(isLocalApiUrl(url)).toBe(true);
  });

  // Testing on a phone means pointing the frontend at the machine's LAN address.
  it.each([
    'http://192.168.100.199:3000',
    'http://192.168.1.5:3000',
    'http://10.0.0.4:3000',
    'http://172.16.3.9:3000',
    'http://172.31.255.1:3000',
    'http://macbook.local:3000',
  ])('treats %s as local', (url) => {
    expect(isLocalApiUrl(url)).toBe(true);
  });

  it.each([
    'https://z84um15pqk.execute-api.ap-southeast-1.amazonaws.com/Prod/',
    'https://finance-tracker.laurencecortez.com',
    // 172.15 and 172.32 sit outside the private range.
    'http://172.15.0.1:3000',
    'http://172.32.0.1:3000',
    // A public host that merely starts with the same digits.
    'http://192.1680.1.1:3000',
  ])('treats %s as remote', (url) => {
    expect(isLocalApiUrl(url)).toBe(false);
  });

  it('is false when nothing is configured', () => {
    expect(isLocalApiUrl(undefined)).toBe(false);
    expect(isLocalApiUrl('')).toBe(false);
  });
});
