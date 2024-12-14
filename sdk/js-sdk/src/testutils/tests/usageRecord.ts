import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  getUsageCostsTestExecFn,
  getWorkspaceSummedUsageTestExecFn,
} from '../execFns/usageRecord.js';
import {ITestVars, getTestVars} from '../utils.common.js';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({
  authToken: vars.authToken,
  serverURL: vars.serverURL,
});

export const test_getUsageCosts = async () => {
  await getWorkspaceSummedUsageTestExecFn(fimidara, vars);
};

export const test_getWorkspaceSummedUsage = async () => {
  await getUsageCostsTestExecFn(fimidara);
};
