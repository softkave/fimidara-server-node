import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {insertTagForTest} from '../../test-utils/helpers/tag';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {tagExtractor} from '../utils';
import updateTag from './handler';
import {IUpdateTagEndpointParams, IUpdateTagInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('updateTag', () => {
  test('tag updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const tagUpdateInput: IUpdateTagInput = {
      name: faker.lorem.words(3),
      description: faker.lorem.words(10),
    };

    const instData = RequestData.fromExpressRequest<IUpdateTagEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        tagId: tag01.resourceId,
        tag: tagUpdateInput,
      }
    );

    const result = await updateTag(context, instData);
    assertEndpointResultOk(result);

    const updatedTag = await context.data.tag.assertGetItem(
      EndpointReusableQueries.getById(tag01.resourceId)
    );

    expect(tagExtractor(updatedTag)).toMatchObject(result.tag);
    expect(updatedTag.name).toBe(tagUpdateInput.name);
    expect(updatedTag.description).toBe(tagUpdateInput.description);
  });
});
