import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {cleanupContext} from '../../test-utils/context/cleanup';
import {
  assertContext,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {getPublicClientToken} from '../utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await cleanupContext(context);
});

test('client assigned token added', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId);
  const savedToken = getPublicClientToken(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.data.clientAssignedToken.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(token.resourceId)
      )
    )
  );
  expect(savedToken).toMatchObject(token);
});
