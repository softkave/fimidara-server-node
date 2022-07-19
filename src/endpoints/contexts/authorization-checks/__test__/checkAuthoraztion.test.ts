import {PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {IUserToken} from '../../../../definitions/userToken';
import {IWorkspace} from '../../../../definitions/workspace';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../../permissionItems/addItems/types';
import RequestData from '../../../RequestData';
import {waitForRequestPendingJobs} from '../../../test-utils/helpers/reqData';
import {
  assertContext,
  getTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../../test-utils/test-utils';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../../user/errors';
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

async function grantEveryPermission(
  workspace: IWorkspace,
  grantedBy: IUserToken,
  recipientUserId: string
) {
  assertContext(context);
  const items: INewPermissionItemInput[] = getWorkspaceActionList().map(
    action => ({
      action: action as BasicCRUDActions,
      grantAccess: true,
      appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
      itemResourceType: AppResourceType.All,
      permissionEntityId: recipientUserId,
      permissionEntityType: AppResourceType.User,
      permissionOwnerId: workspace.resourceId,
      permissionOwnerType: AppResourceType.Workspace,
    })
  );

  const instData =
    RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(grantedBy),
      {items, workspaceId: workspace.resourceId}
    );

  await addPermissionItems(context, instData);
}

describe('checkAuthorization', () => {
  test('auth is granted when agent has permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {rawWorkspace} = await insertWorkspaceForTest(context, userToken);
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      rawWorkspace
    );

    const agent = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
    );

    const permitted = await checkAuthorization({
      context,
      agent,
      resource: file,
      type: AppResourceType.File,
      permissionOwners: getFilePermissionOwners(
        rawWorkspace.resourceId,
        file,
        AppResourceType.File
      ),
      action: BasicCRUDActions.Read,
      workspace: rawWorkspace,
    });

    expect(permitted).toBeTruthy();
    await waitForRequestPendingJobs(reqData);
  });

  test('auth fails when agent does not have permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(
      context,
      userToken
    );
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace
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
    await waitForRequestPendingJobs(reqData);
  });

  test('should throw error when nothrow is turned off', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(
      context,
      userToken
    );
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace
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
    } finally {
      await waitForRequestPendingJobs(reqData);
    }
  });

  test('auth passes if action is read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );

    const {rawWorkspace: workspace} = await insertWorkspaceForTest(
      context,
      userToken
    );
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace
    );

    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(
        mockExpressRequestWithUserToken(userToken02)
      )
    );

    await grantEveryPermission(workspace, userToken, userToken02.userId);
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
      nothrow: false,
    });

    expect(permitted).toBeTruthy();
    await waitForRequestPendingJobs(reqData);
  });

  test('auth fails if action is not read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(
      context,
      userToken
    );
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace
    );

    await grantEveryPermission(workspace, userToken, userToken02.userId);
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
        action: BasicCRUDActions.Update,
        nothrow: false,
      });
    } catch (error: any) {
      expect(error instanceof EmailAddressNotVerifiedError).toBeTruthy();
    } finally {
      await waitForRequestPendingJobs(reqData);
    }
  });
});
