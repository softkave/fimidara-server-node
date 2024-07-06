import {describe, expect, test} from 'vitest';
import {FimidaraEndpoints} from '../index.js';

describe('config', () => {
  test('config changes cascades', async () => {
    const oldAuthToken = Math.random().toString();
    const newAuthToken = Math.random().toString();
    const fimidara = new FimidaraEndpoints({authToken: oldAuthToken});
    expect(fimidara.files.getSdkConfig().authToken).toBe(oldAuthToken);
    fimidara.setSdkConfig({authToken: newAuthToken});
    expect(fimidara.files.getSdkConfig().authToken).toBe(newAuthToken);
  });
});
