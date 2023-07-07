import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  getUsageCostsTestExecFn,
  getWorkspaceSummedUsageTestExecFn,
} from '../execFns/usageRecord';
import {ITestVars, getTestVars} from '../utils';

const vars: ITestVars = getTestVars();
const fimidara = new FimidaraEndpoints({authToken: vars.authToken});

export const test_getUsageCosts = async () => {
  await getWorkspaceSummedUsageTestExecFn(fimidara, vars);
};

export const test_getWorkspaceSummedUsage = async () => {
  await getUsageCostsTestExecFn(fimidara);
};
