import RequestData from '../../RequestData';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getTag from './handler';
import {GetTagEndpointParams} from './types';

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
