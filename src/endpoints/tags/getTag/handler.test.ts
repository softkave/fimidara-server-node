import RequestData from '../../RequestData.js';
import {insertTagForTest} from '../../testUtils/helpers/tag.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
    const {tag: tag01} = await insertTagForTest(userToken, workspace.resourceId);

    const instData = RequestData.fromExpressRequest<GetTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag01.resourceId}
    );
    const result = await getTag(instData);
    assertEndpointResultOk(result);
    expect(result.tag).toEqual(tag01);
  });
});
