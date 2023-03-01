import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  initTestBaseContext,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {getPublicProgramToken, programAccessTokenExtractor} from '../utils';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if permissionGroups don't exist
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('program access token added', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertProgramAccessTokenForTest(context, userToken, workspace.resourceId);
  const savedToken = getPublicProgramToken(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.data.programAccessToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token.resourceId)
      )
    )
  );
  expect(programAccessTokenExtractor(savedToken)).toMatchObject(token);
});
