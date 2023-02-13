import {identity} from 'lodash';
import {PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {IUserToken} from '../../../../definitions/userToken';
import {IWorkspace} from '../../../../definitions/workspace';
import {containsExactly} from '../../../../utils/fns';
import {addAssignedPermissionGroupList} from '../../../assignedItems/addAssignedItems';
import updatePermissionGroup from '../../../permissionGroups/udpatePermissionGroup/handler';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../../permissionItems/addItems/types';
import RequestData from '../../../RequestData';
import {
  assertContext,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertFileForTest,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithClientToken,
  mockExpressRequestWithUserToken,
} from '../../../test-utils/test-utils';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../../user/errors';
import {IBaseContext} from '../../types';
import {
  checkAuthorization,
  getFilePermissionContainers,
  makeResourcePermissionContainerList,
  summarizeAgentPermissionItems,
} from '../checkAuthorizaton';

/**
 * TODO
 * - test for different entities, resource types, agents, containers, etc.
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function grantEveryPermission(
  workspace: IWorkspace,
  grantedBy: IUserToken,
  recipientUserId: string
) {
  assertContext(context);
  const items: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
    action: action as BasicCRUDActions,
    grantAccess: true,
    appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
    targetType: AppResourceType.All,
    permissionEntityId: recipientUserId,
    permissionEntityType: AppResourceType.User,
    containerId: workspace.resourceId,
    containerType: AppResourceType.Workspace,
  }));
  const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
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
    const {file} = await insertFileForTest(context, userToken, rawWorkspace);
    const agent = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
    );
    const permitted = await checkAuthorization({
      context,
      agent,
      resource: file,
      type: AppResourceType.File,
      permissionContainers: getFilePermissionContainers(
        rawWorkspace.resourceId,
        file,
        AppResourceType.File
      ),
      action: BasicCRUDActions.Read,
      workspace: rawWorkspace,
    });
    expect(permitted).toBeTruthy();
  });

  test('auth fails when agent does not have permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );
    const permitted = await checkAuthorization({
      context,
      workspace,
      agent: agent02,
      resource: file,
      type: AppResourceType.File,
      permissionContainers: getFilePermissionContainers(
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
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspace,
        agent: agent02,
        resource: file,
        type: AppResourceType.File,
        permissionContainers: getFilePermissionContainers(
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

  test('auth passes if action is read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );

    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );
    await grantEveryPermission(workspace, userToken, userToken02.userId);
    const permitted = await checkAuthorization({
      context,
      workspace,
      agent: agent02,
      resource: file,
      type: AppResourceType.File,
      permissionContainers: getFilePermissionContainers(
        workspace.resourceId,
        file,
        AppResourceType.File
      ),
      action: BasicCRUDActions.Read,
      nothrow: false,
    });
    expect(permitted).toBeTruthy();
  });

  test('auth fails if action is not read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    await grantEveryPermission(workspace, userToken, userToken02.userId);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspace,
        agent: agent02,
        resource: file,
        type: AppResourceType.File,
        permissionContainers: getFilePermissionContainers(
          workspace.resourceId,
          file,
          AppResourceType.File
        ),
        action: BasicCRUDActions.Update,
        nothrow: false,
      });
    } catch (error: any) {
      expect(error instanceof EmailAddressNotVerifiedError).toBeTruthy();
    }
  });

  test.skip('summarizeAgentPermissionItems can action type wildcard action', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.All,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        permissionEntityId: pg02.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        permissionEntityId: pg03.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          items: pg02Items.concat(pg03Items),
          workspaceId: workspace.resourceId,
        }
      )
    );
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        agent: clientTokenAgent,
        resource: workspace,
        type: AppResourceType.Workspace,
        permissionContainers: makeResourcePermissionContainerList(
          workspace.resourceId,
          AppResourceType.Workspace,
          workspace
        ),
        action: BasicCRUDActions.Read,
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toHaveLength(0);
    expect(deniedResourceIdList).toHaveLength(0);
  });

  test('summarizeAgentPermissionItems with wildcard resource type', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.All,
        permissionEntityId: pg02.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        permissionEntityId: pg03.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          items: pg02Items.concat(pg03Items),
          workspaceId: workspace.resourceId,
        }
      )
    );
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        agent: clientTokenAgent,
        resource: workspace,
        type: AppResourceType.Workspace,
        permissionContainers: makeResourcePermissionContainerList(
          workspace.resourceId,
          AppResourceType.Workspace,
          workspace
        ),
        action: BasicCRUDActions.Read,
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toBeFalsy();
    expect(deniedResourceIdList).toHaveLength(0);
  });

  test('summarizeAgentPermissionItems with target ID', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        permissionEntityId: pg02.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        permissionEntityId: pg03.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          items: pg02Items.concat(pg03Items),
          workspaceId: workspace.resourceId,
        }
      )
    );
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        agent: clientTokenAgent,
        resource: workspace,
        type: AppResourceType.Workspace,
        permissionContainers: makeResourcePermissionContainerList(
          workspace.resourceId,
          AppResourceType.Workspace,
          workspace
        ),
        action: BasicCRUDActions.Read,
      });
    expect(hasFullOrLimitedAccess).toBeFalsy();
    expect(noAccess).toBeFalsy();
    containsExactly(allowedResourceIdList ?? [], [workspace.resourceId], identity);
    expect(deniedResourceIdList).toBeFalsy();
  });

  test('summarizeAgentPermissionItems with target ID denied access', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        permissionEntityId: pg02.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        permissionEntityId: pg03.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          items: pg02Items.concat(pg03Items),
          workspaceId: workspace.resourceId,
        }
      )
    );
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        agent: clientTokenAgent,
        resource: workspace,
        type: AppResourceType.Workspace,
        permissionContainers: makeResourcePermissionContainerList(
          workspace.resourceId,
          AppResourceType.Workspace,
          workspace
        ),
        action: BasicCRUDActions.Read,
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toBeFalsy();
    containsExactly(deniedResourceIdList ?? [], [workspace.resourceId], identity);
  });

  test('summarizeAgentPermissionItems denied access', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        permissionEntityId: pg02.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        permissionEntityId: pg03.resourceId,
        permissionEntityType: AppResourceType.PermissionGroup,
        containerId: workspace.resourceId,
        containerType: AppResourceType.Workspace,
      },
    ];
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {
          items: pg02Items.concat(pg03Items),
          workspaceId: workspace.resourceId,
        }
      )
    );
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        agent: clientTokenAgent,
        resource: workspace,
        type: AppResourceType.Workspace,
        permissionContainers: makeResourcePermissionContainerList(
          workspace.resourceId,
          AppResourceType.Workspace,
          workspace
        ),
        action: BasicCRUDActions.Read,
      });
    expect(hasFullOrLimitedAccess).toBeFalsy();
    expect(noAccess).toBeTruthy();
    expect(allowedResourceIdList).toBeFalsy();
    expect(deniedResourceIdList).toBeFalsy();
  });
});

async function setupForSummarizeAgentPermissionItemsTest() {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const [
    {permissionGroup: pg01},
    {permissionGroup: pg02},
    {permissionGroup: pg03},
    {token},
    userAgent,
  ] = await Promise.all([
    insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    insertClientAssignedTokenForTest(context, userToken, workspace.resourceId),
    context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
    ),
  ]);
  await addAssignedPermissionGroupList(
    context,
    userAgent,
    workspace,
    [{permissionGroupId: pg01.resourceId, order: 0}],
    token.resourceId,
    AppResourceType.ClientAssignedToken,
    /** deleteExisting */ false,
    /** skipPermissionGroupsCheck */ false
  );
  const [clientTokenAgent] = await Promise.all([
    context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithClientToken(token))
    ),
    updatePermissionGroup(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken), {
        permissionGroupId: pg01.resourceId,
        data: {
          permissionGroups: [
            {permissionGroupId: pg02.resourceId, order: 1},
            {permissionGroupId: pg03.resourceId, order: 2},
          ],
        },
      })
    ),
  ]);
  return {userToken, workspace, pg02, pg03, userAgent, clientTokenAgent};
}
