import {FimidaraEndpoints} from '..';
import {
  getUsageCosts,
  getWorkspaceSummedUsageTest,
} from '../testutils/usageRecord';
import {ITestVars, getTestVars} from '../testutils/utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('usageRecords', () => {
  test('getWorkspaceSummedUsage', async () => {
    await getWorkspaceSummedUsageTest(fimidara, vars);
  });

  test('getUsageCosts', async () => {
    await getUsageCosts(fimidara);
  });
});
