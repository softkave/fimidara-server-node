import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import EndpointReusableQueries from '../../queries';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {tagExtractor} from '../utils';
import updateTag from './handler';
import {UpdateTagEndpointParams, UpdateTagInput} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('updateTag', () => {
  test('tag updated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {tag: tag01} = await insertTagForTest(userToken, workspace.resourceId);
    const tagUpdateInput: UpdateTagInput = {
      name: faker.lorem.words(3),
      description: faker.lorem.words(10),
    };

    const instData = RequestData.fromExpressRequest<UpdateTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag01.resourceId, tag: tagUpdateInput}
    );
    const result = await updateTag(instData);
    assertEndpointResultOk(result);

    const updatedTag = await kSemanticModels
      .tag()
      .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(tag01.resourceId));
    expect(tagExtractor(updatedTag)).toMatchObject(result.tag);
    expect(updatedTag.name).toBe(tagUpdateInput.name);
    expect(updatedTag.description).toBe(tagUpdateInput.description);
  });
});
