import {FimidaraEndpoints} from '..';
import {getTestVars, ITestVars} from '../testutils/utils';
import {getWorkspaceTest, updateWorkspaceTest} from '../testutils/workspace';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('workspace', () => {
  test('update workspace', async () => {
    await updateWorkspaceTest(fimidara, vars);
  });

  test('get workspace', async () => {
    await getWorkspaceTest(fimidara, vars);
  });
});
