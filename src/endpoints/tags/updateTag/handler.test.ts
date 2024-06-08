import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../../queries.js';
import {insertTagForTest} from '../../testUtils/helpers/tag.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {tagExtractor} from '../utils.js';
import updateTag from './handler.js';
import {UpdateTagEndpointParams, UpdateTagInput} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
