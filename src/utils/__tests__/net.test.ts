import {describe, expect, test} from 'vitest';
import {getLocalIp} from '../net.js';

describe('net', () => {
  test('should get local ip', () => {
    const {ipv4, ipv6} = getLocalIp();
    const ip = ipv4 ?? ipv6;

    expect(ip).toBeDefined();

    if (ipv4) {
      expect(ipv4).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    }

    if (ipv6) {
      expect(ipv6).toMatch(/^[0-9a-fA-F:]+$/);
    }
  });
});
