import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {kLoopAsyncSettlementType, loopAndCollateAsync} from 'softkave-js-utils';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  AddAgentTokenEndpointParams,
  DeleteAgentTokenEndpointParams,
  GetAgentTokenEndpointParams,
  GetWorkspaceAgentTokensEndpointParams,
  UpdateAgentTokenEndpointParams,
} from '../../endpoints/publicTypes.js';
import {ITestVars} from '../utils.common.js';

function getTokenExpiryDate(
  days: number = faker.number.int({min: 1, max: 10})
) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).valueOf();
}

export async function addAgentTokenTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<AddAgentTokenEndpointParams> = {}
) {
  const genInput: AddAgentTokenEndpointParams = {
    expiresAt: getTokenExpiryDate(),
    providedResourceId: faker.string.uuid(),
  };
  const inputs = merge(genInput, props);
  const result = await endpoint.agentTokens.addToken(inputs);
  return result;
}

export async function setupWorkspaceAgentTokensTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  tokenCount = 2
) {
  const tokens = await loopAndCollateAsync(
    async () => await addAgentTokenTestExecFn(endpoint, vars),
    tokenCount,
    kLoopAsyncSettlementType.all
  );
  return {tokens};
}

export async function getWorkspaceAgentTokensTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: GetWorkspaceAgentTokensEndpointParams
) {
  const result = await endpoint.agentTokens.getWorkspaceTokens(props);
  return result;
}

export async function getTokenTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetAgentTokenEndpointParams> = {}
) {
  let tokenId = props.tokenId;
  if (!tokenId) {
    const token = await addAgentTokenTestExecFn(endpoint, vars);
    tokenId = token.token.resourceId;
  }
  assert.ok(tokenId);
  const input: GetAgentTokenEndpointParams = {
    tokenId,
  };
  const result = await endpoint.agentTokens.getToken(input);
  assert(result.token.resourceId === tokenId);
  return result;
}

export async function deleteTokenTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteAgentTokenEndpointParams> = {}
) {
  let tokenId = props.tokenId;
  if (!tokenId) {
    const token = await addAgentTokenTestExecFn(endpoint, vars);
    tokenId = token.token.resourceId;
  }
  assert.ok(tokenId);
  const input: DeleteAgentTokenEndpointParams = {
    tokenId,
  };
  await endpoint.agentTokens.deleteToken(input);
}

export async function updateTokenTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateAgentTokenEndpointParams> = {}
) {
  let tokenId = props.tokenId;

  if (!tokenId) {
    const token = await addAgentTokenTestExecFn(endpoint, vars);
    tokenId = token.token.resourceId;
  }

  assert.ok(tokenId);
  const input: UpdateAgentTokenEndpointParams = {
    tokenId,
    token: {
      expiresAt: getTokenExpiryDate(),
      providedResourceId: faker.string.uuid(),
    },
  };
  const result = await endpoint.agentTokens.updateToken(input);
  return result;
}
