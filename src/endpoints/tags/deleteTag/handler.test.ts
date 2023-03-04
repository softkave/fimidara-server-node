import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteTag from './handler';
import {IDeleteTagEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('deleteTag', () => {
  test('tag deleted', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {tag} = await insertTagForTest(context, userToken, workspace.resourceId);

    const instData = RequestData.fromExpressRequest<IDeleteTagEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tagId: tag.resourceId}
    );

    const result = await deleteTag(context, instData);
    assertEndpointResultOk(result);
    const deletedTagExists = await context.data.tag.existsByQuery(
      EndpointReusableQueries.getByResourceId(tag.resourceId)
    );

    expect(deletedTagExists).toBeFalsy();
  });
});
