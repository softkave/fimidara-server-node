import {faker} from '@faker-js/faker';
import {IUserToken} from '../../../definitions/userToken';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import addTag from '../../tags/addTag/handler';
import {IAddTagEndpointParams, INewTagInput} from '../../tags/addTag/types';
import {
  mockExpressRequestWithUserToken,
  mockExpressRequestForPublicAgent,
  assertEndpointResultOk,
} from '../test-utils';

export async function insertTagForTest(
  context: IBaseContext,
  userToken: IUserToken | null,
  workspaceId: string,
  tagInput: Partial<INewTagInput> = {}
) {
  const instData = RequestData.fromExpressRequest<IAddTagEndpointParams>(
    userToken
      ? mockExpressRequestWithUserToken(userToken)
      : mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      tag: {
        name: faker.random.word(),
        description: faker.lorem.paragraph(),
        ...tagInput,
      },
    }
  );

  const result = await addTag(context, instData);
  assertEndpointResultOk(result);
  return result;
}
