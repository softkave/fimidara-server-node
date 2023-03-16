import {faker} from '@faker-js/faker';
import {IAgentToken} from '../../../definitions/agentToken';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import addTag from '../../tags/addTag/handler';
import {IAddTagEndpointParams, INewTagInput} from '../../tags/addTag/types';
import {
  assertEndpointResultOk,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../testUtils';

export async function insertTagForTest(
  context: IBaseContext,
  userToken: IAgentToken | null,
  workspaceId: string,
  tagInput: Partial<INewTagInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddTagEndpointParams>(
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
