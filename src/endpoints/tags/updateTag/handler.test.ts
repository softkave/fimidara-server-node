import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {BaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {tagExtractor} from '../utils';
import updateTag from './handler';
import {UpdateTagEndpointParams, UpdateTagInput} from './types';

let context: BaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('updateTag', () => {
  test('tag updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(context, userToken, workspace.resourceId);
    const tagUpdateInput: UpdateTagInput = {
      name: faker.lorem.words(3),
      description: faker.lorem.words(10),
    };

    const instData = RequestData.fromExpressRequest<UpdateTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag01.resourceId, tag: tagUpdateInput}
    );
    const result = await updateTag(context, instData);
    assertEndpointResultOk(result);

    const updatedTag = await context.semantic.tag.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(tag01.resourceId)
    );
    expect(tagExtractor(updatedTag)).toMatchObject(result.tag);
    expect(updatedTag.name).toBe(tagUpdateInput.name);
    expect(updatedTag.description).toBe(tagUpdateInput.description);
  });
});
