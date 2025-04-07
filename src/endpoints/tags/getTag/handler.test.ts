import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {insertTagForTest} from '../../testHelpers/helpers/tag.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import getTag from './handler.js';
import {GetTagEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getTag', () => {
  test('tag returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {tag: tag01} = await insertTagForTest(
      userToken,
      workspace.resourceId
    );

    const reqData = RequestData.fromExpressRequest<GetTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag01.resourceId}
    );
    const result = await getTag(reqData);
    assertEndpointResultOk(result);
    expect(result.tag).toEqual(tag01);
  });
});
