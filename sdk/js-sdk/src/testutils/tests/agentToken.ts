import {expect} from 'vitest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  addAgentTokenTestExecFn,
  deleteTokenTestExecFn,
  getTokenTestExecFn,
  getWorkspaceAgentTokensTestExecFn,
  setupWorkspaceAgentTokensTestExecFn,
  updateTokenTestExecFn,
} from '../execFns/agentToken.js';
import {
  ITestVars,
  getTestVars,
  containsNoneIn,
  indexByResourceId,
} from '../utils.common.js';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_addAgentToken = async () => {
  await addAgentTokenTestExecFn(fimidara, vars);
};

export const test_deleteToken = async () => {
  await deleteTokenTestExecFn(fimidara, vars);
};

export const test_getToken = async () => {
  await getTokenTestExecFn(fimidara, vars);
};

export const test_getWorkspaceAgentTokens = async () => {
  const count = 15;
  const pageSize = 10;
  await setupWorkspaceAgentTokensTestExecFn(fimidara, vars, count);
  const [result00, result01] = await Promise.all([
    getWorkspaceAgentTokensTestExecFn(fimidara, vars, {
      pageSize,
      page: 0,
    }),
    getWorkspaceAgentTokensTestExecFn(fimidara, vars, {
      pageSize,
      page: 1,
    }),
  ]);
  expect(result00.page).toBe(0);
  expect(result01.page).toBe(1);
  containsNoneIn(result00.tokens, result01.tokens, indexByResourceId);
};

export const test_updateToken = async () => {
  await updateTokenTestExecFn(fimidara, vars);
};
