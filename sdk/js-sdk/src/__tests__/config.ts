import {FimidaraEndpoints} from '..';

describe('config', () => {
  test('config changes cascades', async () => {
    const oldAuthToken = Math.random().toString();
    const newAuthToken = Math.random().toString();
    const fimidara = new FimidaraEndpoints({authToken: oldAuthToken});
    expect(fimidara.files.getConfig_().authToken).toBe(oldAuthToken);
    fimidara.setConfig_({authToken: newAuthToken});
    expect(fimidara.files.getConfig_().authToken).toBe(newAuthToken);
  });
});
