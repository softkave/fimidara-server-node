import {identity} from 'lodash';
import {IAgentToken} from '../../../../definitions/agentToken';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {IWorkspace} from '../../../../definitions/workspace';
import {appAssert} from '../../../../utils/assertion';
import {addAssignedPermissionGroupList} from '../../../assignedItems/addAssignedItems';
import {disposeGlobalUtils} from '../../../globalUtils';
import {assignPgListToIdList, toAssignedPgListInput} from '../../../permissionGroups/testUtils';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../../permissionItems/addItems/types';
import RequestData from '../../../RequestData';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {
  assertContext,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertFileForTest,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../testUtils/testUtils';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../../user/errors';
import {IBaseContext} from '../../types';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getResourcePermissionContainers,
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
  await disposeGlobalUtils();
  await context?.dispose();
});

async function grantEveryPermission(
  workspace: IWorkspace,
  grantedBy: IAgentToken,
  recipientUserId: string
) {
  assertContext(context);
  const items: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
    action: action as BasicCRUDActions,
    grantAccess: true,
    targetType: AppResourceType.All,
    containerId: workspace.resourceId,
    containerType: AppResourceType.Workspace,
  }));
  const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(grantedBy),
    {items, workspaceId: workspace.resourceId, entityId: recipientUserId}
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
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
    );
    await checkAuthorization({
      context,
      agent,
      targets: [{targetId: file.resourceId}],
      action: BasicCRUDActions.Read,
      workspaceId: rawWorkspace.resourceId,
      containerId: getFilePermissionContainers(rawWorkspace.resourceId, file),
    });
  });

  test('auth fails when agent does not have permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );
    await checkAuthorization({
      context,
      workspaceId: workspace.resourceId,
      agent: agent02,
      targets: [{targetId: file.resourceId}],
      action: BasicCRUDActions.Read,
      containerId: getFilePermissionContainers(workspace.resourceId, file),
    });
  });

  test('should throw error when nothrow is turned off', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: [{targetId: file.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, file),
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
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );
    appAssert(userToken02.separateEntityId);
    await grantEveryPermission(workspace, userToken, userToken02.separateEntityId);
    await checkAuthorization({
      context,
      workspaceId: workspace.resourceId,
      agent: agent02,
      targets: [{targetId: file.resourceId}],
      containerId: getFilePermissionContainers(workspace.resourceId, file),
      action: BasicCRUDActions.Read,
    });
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
    appAssert(userToken02.separateEntityId);
    await grantEveryPermission(workspace, userToken, userToken02.separateEntityId);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: [{targetId: file.resourceId}],
        action: BasicCRUDActions.Update,
        containerId: getFilePermissionContainers(workspace.resourceId, file),
      });
    } catch (error: any) {
      expect(error instanceof EmailAddressNotVerifiedError).toBeTruthy();
    }
  });

  test('auth passes if grant permission out-weighs deny permission', async () => {
    throw new Error();
  });

  test('auth fails if deny permission out-weighs grant permission', async () => {
    throw new Error();
  });

  test.skip('summarizeAgentPermissionItems can action type wildcard action', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.All,
        grantAccess: true,
        targetType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,

        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg02.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg03.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
    ]);
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [{targetId: workspace.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
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
        targetType: AppResourceType.All,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg02.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg03.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
    ]);
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [{targetId: workspace.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
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
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        targetType: AppResourceType.Workspace,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg02.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg03.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
    ]);
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [{targetId: workspace.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
      });
    expect(hasFullOrLimitedAccess).toBeFalsy();
    expect(noAccess).toBeFalsy();
    expectContainsExactly(allowedResourceIdList ?? [], [workspace.resourceId], identity);
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
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        targetType: AppResourceType.Workspace,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg02.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg03.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
    ]);
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [{targetId: workspace.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toBeFalsy();
    expectContainsExactly(deniedResourceIdList ?? [], [workspace.resourceId], identity);
  });

  test('summarizeAgentPermissionItems denied access', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        targetType: AppResourceType.Workspace,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        targetType: AppResourceType.Workspace,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg02.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {
            items: pg02Items.concat(pg03Items),
            workspaceId: workspace.resourceId,
            entityId: pg03.resourceId,
            containerId: workspace.resourceId,
          }
        )
      ),
    ]);
    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [{targetId: workspace.resourceId}],
        action: BasicCRUDActions.Read,
        containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
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
    insertAgentTokenForTest(context, userToken, workspace.resourceId),
    context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
    ),
  ]);
  const [clientTokenAgent] = await Promise.all([
    context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(token))
    ),
    addAssignedPermissionGroupList(
      context,
      userAgent,
      workspace.resourceId,
      [{permissionGroupId: pg01.resourceId}],
      token.resourceId,
      /** deleteExisting */ false
    ),
  ]);
  await Promise.all([
    assignPgListToIdList(
      context,
      clientTokenAgent,
      workspace.resourceId,
      [pg01.resourceId],
      toAssignedPgListInput([pg02, pg03])
    ),
  ]);
  return {userToken, workspace, pg02, pg03, userAgent, clientTokenAgent};
}
