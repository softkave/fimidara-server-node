import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  getWorkspaceTestExecFn,
  updateWorkspaceTestExecFn,
} from '../execFns/workspace';
import {ITestVars, getTestVars} from '../utils';

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
