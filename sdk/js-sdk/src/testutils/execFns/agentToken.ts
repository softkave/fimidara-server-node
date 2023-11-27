import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  AddAgentTokenEndpointParams,
  DeleteAgentTokenEndpointParams,
  GetAgentTokenEndpointParams,
  GetWorkspaceAgentTokensEndpointParams,
  UpdateAgentTokenEndpointParams,
} from '../../publicTypes';
import {ITestVars, loopAndCollate} from '../utils';
import assert = require('assert');

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
    token: {
      expires: getTokenExpiryDate(),
      providedResourceId: faker.string.uuid(),
    },
  };
  const inputs = merge(genInput, props);
  const result = await endpoint.agentTokens.addToken({body: inputs});
  return result;
}

export async function setupWorkspaceAgentTokensTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  tokenCount = 2
) {
  const tokens = await Promise.all(
    loopAndCollate(tokenCount, () => addAgentTokenTestExecFn(endpoint, vars))
  );
  return {tokens};
}

export async function getWorkspaceAgentTokensTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: GetWorkspaceAgentTokensEndpointParams
) {
  const result = await endpoint.agentTokens.getWorkspaceTokens({body: props});
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
    tokenId = token.body.token.resourceId;
  }
  assert.ok(tokenId);
  const input: GetAgentTokenEndpointParams = {
    tokenId,
  };
  const result = await endpoint.agentTokens.getToken({body: input});
  assert(result.body.token.resourceId === tokenId);
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
    tokenId = token.body.token.resourceId;
  }
  assert.ok(tokenId);
  const input: DeleteAgentTokenEndpointParams = {
    tokenId,
  };
  await endpoint.agentTokens.deleteToken({body: input});
}

export async function updateTokenTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateAgentTokenEndpointParams> = {}
) {
  let tokenId = props.tokenId;

  if (!tokenId) {
    const token = await addAgentTokenTestExecFn(endpoint, vars);
    tokenId = token.body.token.resourceId;
  }

  assert.ok(tokenId);
  const input: UpdateAgentTokenEndpointParams = {
    tokenId,
    token: {
      expires: getTokenExpiryDate(),
      providedResourceId: faker.string.uuid(),
    },
  };
  const result = await endpoint.agentTokens.updateToken({body: input});
  return result;
}
