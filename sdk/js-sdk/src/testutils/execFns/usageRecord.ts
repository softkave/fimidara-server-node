import assert from 'assert';
import {isNumber} from 'lodash-es';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints.js';
import {GetWorkspaceSummedUsageEndpointParams} from '../../publicTypes.js';
import {ITestVars} from '../utils.js';

export async function getWorkspaceSummedUsageTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetWorkspaceSummedUsageEndpointParams> = {}
) {
  const input: GetWorkspaceSummedUsageEndpointParams = {
    ...(props as any),
  };
  const result = await endpoint.usageRecords.getWorkspaceSummedUsage({
    body: input,
  });
  result.body.records.forEach(record => {
    assert(record.workspaceId === vars.workspaceId);
  });
}

export async function getUsageCostsTestExecFn(endpoint: FimidaraEndpoints) {
  const result = await endpoint.usageRecords.getUsageCosts();
  assert(isNumber(result.body.costs['bin']));
  assert(isNumber(result.body.costs['bout']));
  assert(isNumber(result.body.costs['storage']));
  assert(isNumber(result.body.costs['storageEver']));
  return result;
}
