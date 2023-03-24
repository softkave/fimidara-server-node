import {identity} from 'lodash';
import {IAgentToken} from '../../../../definitions/agentToken';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {IWorkspace} from '../../../../definitions/workspace';
import {appAssert} from '../../../../utils/assertion';
import {addAssignedPermissionGroupList} from '../../../assignedItems/addAssignedItems';
import {assignPgListToIdList, toAssignedPgListInput} from '../../../permissionGroups/testUtils';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {IAddPermissionItemsEndpointParams} from '../../../permissionItems/addItems/types';
import {IPermissionItemInput} from '../../../permissionItems/types';
import RequestData from '../../../RequestData';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {completeTest} from '../../../testUtils/helpers/test';
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
import {executeWithMutationRunOptions} from '../../semantic/utils';
import {IBaseContext} from '../../types';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getResourcePermissionContainers,
  summarizeAgentPermissionItems,
} from '../checkAuthorizaton';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function grantEveryPermission(
  workspace: IWorkspace,
  grantedBy: IAgentToken,
  recipientUserId: string
) {
  assertContext(context);
  const items: IPermissionItemInput[] = getWorkspaceActionList().map(action => ({
    action: action as AppActionType,
    grantAccess: true,
    target: {targetType: AppResourceType.All},
    container: {containerId: workspace.resourceId},
    entity: {entityId: recipientUserId},
  }));
  const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(grantedBy),
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
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
    );
    await checkAuthorization({
      context,
      agent,
      targets: [{targetId: file.resourceId}],
      action: AppActionType.Read,
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
      action: AppActionType.Read,
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
        action: AppActionType.Read,
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
      action: AppActionType.Read,
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
        action: AppActionType.Update,
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
    const pg02Items: IPermissionItemInput[] = [
      {
        action: AppActionType.All,
        grantAccess: true,
        target: {targetType: AppResourceType.Workspace},
      },
    ];
    const pg03Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
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
            entity: {entityId: pg02.resourceId},
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
            entity: {entityId: pg03.resourceId},
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
        action: AppActionType.Read,
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
    const pg02Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.All},
      },
    ];
    const pg03Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
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
            entity: {entityId: pg02.resourceId},
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
            entity: {entityId: pg03.resourceId},
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
        action: AppActionType.Read,
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
    const pg02Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetId: workspace.resourceId},
      },
    ];
    const pg03Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetType: AppResourceType.Workspace},
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
            entity: {entityId: pg02.resourceId},
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
            entity: {entityId: pg03.resourceId},
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
        action: AppActionType.Read,
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
    const pg02Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
      },
    ];
    const pg03Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.Workspace},
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
            entity: {entityId: pg02.resourceId},
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
            entity: {entityId: pg03.resourceId},
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
        action: AppActionType.Read,
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
    const pg02Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetType: AppResourceType.Workspace},
      },
    ];
    const pg03Items: IPermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.Workspace},
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
            entity: {entityId: pg02.resourceId},
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
            entity: {entityId: pg03.resourceId},
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
        action: AppActionType.Read,
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
    executeWithMutationRunOptions(context, opts =>
      addAssignedPermissionGroupList(
        context!,
        userAgent,
        workspace.resourceId,
        [{permissionGroupId: pg01.resourceId}],
        token.resourceId,
        /** deleteExisting */ false,
        /** skip permission groups check */ false,
        /** skip auth check */ false,
        opts
      )
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
