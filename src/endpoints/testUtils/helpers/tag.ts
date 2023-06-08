import {faker} from '@faker-js/faker';
import {AgentToken} from '../../../definitions/agentToken';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import addTag from '../../tags/addTag/handler';
import {AddTagEndpointParams, NewTagInput} from '../../tags/addTag/types';
import {
  assertEndpointResultOk,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../testUtils';

export async function insertTagForTest(
  context: BaseContextType,
  userToken: AgentToken | null,
  workspaceId: string,
  tagInput: Partial<NewTagInput> = {}
) {
  const instData = RequestData.fromExpressRequest<AddTagEndpointParams>(
    userToken ? mockExpressRequestWithAgentToken(userToken) : mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      tag: {
        name: faker.random.words(),
        description: faker.lorem.paragraph(),
        ...tagInput,
      },
    }
  );

  const result = await addTag(context, instData);
  assertEndpointResultOk(result);
  return result;
}
