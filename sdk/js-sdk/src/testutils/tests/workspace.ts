import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  getWorkspaceTestExecFn,
  updateWorkspaceTestExecFn,
} from '../execFns/workspace.js';
import {ITestVars, getTestVars} from '../utils.common.js';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_getWorkspace = async () => {
  await updateWorkspaceTestExecFn(fimidara, vars);
};

export const test_updateWorkspace = async () => {
  await getWorkspaceTestExecFn(fimidara, vars);
};
