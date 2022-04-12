import {
  AppResourceType,
  BasicCRUDActions,
} from '../../../../definitions/system';
import RequestData from '../../../RequestData';
import {
  getTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  insertFileForTest,
  mockExpressRequestWithUserToken,
  assertContext,
} from '../../../test-utils/test-utils';
import {PermissionDeniedError} from '../../../user/errors';
import {IBaseContext} from '../../BaseContext';
import {
  checkAuthorization,
  getFilePermissionOwners,
} from '../checkAuthorizaton';

/**
 * TODO
 * - test for different entities, resource types, agents, owners, etc.
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('checkAuthorization', () => {
  test('auth is granted when agent has permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const agent = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
    );

    const permitted = await checkAuthorization({
      context,
      agent,
      workspace,
      resource: file,
      type: AppResourceType.File,
      permissionOwners: getFilePermissionOwners(
        workspace.resourceId,
        file,
        AppResourceType.File
      ),
      action: BasicCRUDActions.Read,
    });

    expect(permitted).toBeTruthy();
  });

  test('auth fails when agent does not have permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(
        mockExpressRequestWithUserToken(userToken02)
      )
    );

    const permitted = await checkAuthorization({
      context,
      workspace,
      agent: agent02,
      resource: file,
      type: AppResourceType.File,
      permissionOwners: getFilePermissionOwners(
        workspace.resourceId,
        file,
        AppResourceType.File
      ),
      action: BasicCRUDActions.Read,
      nothrow: true,
    });

    expect(permitted).toBeFalsy();
  });

  test('should throw error when nothrow is turned off', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(
        mockExpressRequestWithUserToken(userToken02)
      )
    );

    try {
      await checkAuthorization({
        context,
        workspace,
        agent: agent02,
        resource: file,
        type: AppResourceType.File,
        permissionOwners: getFilePermissionOwners(
          workspace.resourceId,
          file,
          AppResourceType.File
        ),
        action: BasicCRUDActions.Read,
        nothrow: false,
      });
    } catch (error: any) {
      expect(error instanceof PermissionDeniedError).toBeTruthy();
    }
  });
});
