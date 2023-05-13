import {FimidaraEndpoints} from '..';
import {
  addAgentTokenTest,
  deleteTokenTest,
  getTokenTest,
  getWorkspaceAgentTokensTest,
  setupWorkspaceAgentTokensTest,
  updateTokenTest,
} from '../testutils/agentToken';
import {
  ITestVars,
  containsNoneIn,
  getTestVars,
  indexByResourceId,
} from '../testutils/utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

describe('agent tokens', () => {
  test('add client token', async () => {
    await addAgentTokenTest(fimidara, vars);
  });

  test('update token', async () => {
    await updateTokenTest(fimidara, vars);
  });

  test('delete token', async () => {
    await deleteTokenTest(fimidara, vars);
  });

  test('get token', async () => {
    await getTokenTest(fimidara, vars);
  });

  test('get workspace tokens paginated', async () => {
    const count = 15;
    const pageSize = 10;
    await setupWorkspaceAgentTokensTest(fimidara, vars, count);
    const [result00, result01] = await Promise.all([
      getWorkspaceAgentTokensTest(fimidara, vars, {
        pageSize,
        page: 0,
      }),
      getWorkspaceAgentTokensTest(fimidara, vars, {
        pageSize,
        page: 1,
      }),
    ]);
    expect(result00.body.page).toBe(0);
    expect(result01.body.page).toBe(1);
    containsNoneIn(
      result00.body.tokens,
      result01.body.tokens,
      indexByResourceId
    );
  });
});
