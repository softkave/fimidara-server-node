import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import RequestData from '../../RequestData';
import addTag from '../../tags/addTag/handler';
import {AddTagEndpointParams, NewTagInput} from '../../tags/addTag/types';
import {
  assertEndpointResultOk,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../testUtils';

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
