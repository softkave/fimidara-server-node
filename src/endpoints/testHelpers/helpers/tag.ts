import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken.js';
import RequestData from '../../RequestData.js';
import addTag from '../../tags/addTag/handler.js';
import {AddTagEndpointParams, NewTagInput} from '../../tags/addTag/types.js';
import {
  assertEndpointResultOk,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../utils.js';

export async function insertTagForTest(
  userToken: AgentToken | null,
  workspaceId: string,
  tagInput: Partial<NewTagInput> = {}
) {
  const reqData = RequestData.fromExpressRequest<AddTagEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      name: faker.lorem.words(),
      description: faker.lorem.paragraph(),
      ...tagInput,
    }
  );

  const result = await addTag(reqData);
  assertEndpointResultOk(result);
  return result;
}
