import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../public-endpoints';
import {GetWorkspaceSummedUsageEndpointParams} from '../public-types';
import {ITestVars} from './utils';
import assert = require('assert');

export async function getWorkspaceSummedUsageTest(
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

export async function getUsageCosts(endpoint: FimidaraEndpoints) {
  const result = await endpoint.usageRecords.getUsageCosts();
  assert(result.body.costs['bin'] > 0);
  assert(result.body.costs['bout'] > 0);
  assert(result.body.costs['storage'] > 0);
  return result;
}
