import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken.js';
import RequestData from '../../RequestData.js';
import addTag from '../../tags/addTag/handler.js';
import {AddTagEndpointParams, NewTagInput} from '../../tags/addTag/types.js';
import {
  assertEndpointResultOk,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../testUtils.js';

export async function insertTagForTest(
  userToken: AgentToken | null,
  workspaceId: string,
  tagInput: Partial<NewTagInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddTagEndpointParams>(
    userToken
      ? mockExpressRequestWithAgentToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      tag: {
        name: faker.lorem.words(),
        description: faker.lorem.paragraph(),
        ...tagInput,
      },
    }
  );

  const result = await addTag(instData);
  assertEndpointResultOk(result);
  return result;
}
