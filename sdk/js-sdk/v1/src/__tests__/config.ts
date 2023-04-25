import {FimidaraEndpoints} from '..';

describe('config', () => {
  test('config changes cascades', async () => {
    const oldAuthToken = Math.random().toString();
    const newAuthToken = Math.random().toString();
    const fimidara = new FimidaraEndpoints({authToken: oldAuthToken});
    expect(fimidara.files.getConfig().authToken).toBe(oldAuthToken);
    fimidara.setConfig({authToken: newAuthToken});
    expect(fimidara.files.getConfig().authToken).toBe(newAuthToken);
  });
});
