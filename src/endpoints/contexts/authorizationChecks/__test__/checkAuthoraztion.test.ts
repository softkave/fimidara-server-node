import {identity} from 'lodash';
import {AgentToken} from '../../../../definitions/agentToken';
import {PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {Workspace} from '../../../../definitions/workspace';
import {SYSTEM_SESSION_AGENT} from '../../../../utils/agent';
import {appAssert} from '../../../../utils/assertion';
import {makeWorkspaceAgentTokenAgent} from '../../../../utils/sessionUtils';
import RequestData from '../../../RequestData';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../../assignedItems/addAssignedItems';
import {assignPgListToIdList, toAssignedPgListInput} from '../../../permissionGroups/testUtils';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {AddPermissionItemsEndpointParams} from '../../../permissionItems/addItems/types';
import {PermissionItemInput} from '../../../permissionItems/types';
import {generateAndInsertAgentTokenListForTest} from '../../../testUtils/generateData/agentToken';
import {generateAndInsertTestFolders} from '../../../testUtils/generateData/folder';
import {generateAndInsertPermissionItemListForTest} from '../../../testUtils/generateData/permissionItem';
import {expectContainsExactly} from '../../../testUtils/helpers/assertion';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
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
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../../users/errors';
import {executeWithMutationRunOptions} from '../../semantic/utils';
import {BaseContextType} from '../../types';
import {
  checkAuthorization,
  getFilePermissionContainers,
  getWorkspacePermissionContainers,
  summarizeAgentPermissionItems,
} from '../checkAuthorizaton';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function grantEveryPermission(
  workspace: Workspace,
  grantedBy: AgentToken,
  recipientUserId: string
) {
  assertContext(context);
  const items = getWorkspaceActionList().map(
    (action): PermissionItemInput => ({
      action: action as AppActionType,
      grantAccess: true,
      target: {targetType: AppResourceType.All, targetId: workspace.resourceId},
      entity: {entityId: recipientUserId},
      appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
    })
  );
  const instData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
      targets: {targetId: file.resourceId},
      action: AppActionType.Read,
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
      containerId: getFilePermissionContainers(rawWorkspace.resourceId, file, false),
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

    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: {targetId: file.resourceId},
        action: AppActionType.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, file, false),
      });
    }, [PermissionDeniedError.name]);
  });

  test('auth passes if action is read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02, user: user02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );

    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    await executeWithMutationRunOptions(context, opts =>
      assignWorkspaceToUser(
        context!,
        SYSTEM_SESSION_AGENT,
        workspace.resourceId,
        user02.resourceId,
        opts
      )
    );
    const {file} = await insertFileForTest(context, userToken, workspace);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );
    appAssert(userToken02.separateEntityId);
    await grantEveryPermission(workspace, userToken, userToken02.separateEntityId);
    await checkAuthorization({
      context,
      workspace,
      workspaceId: workspace.resourceId,
      agent: agent02,
      targets: {targetId: file.resourceId},
      containerId: getFilePermissionContainers(workspace.resourceId, file, false),
      action: AppActionType.Read,
    });
  });

  test('auth fails if action is not read and user is not email verified', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {userToken: userToken02, user: user02} = await insertUserForTest(
      context,
      /** userInput */ {},
      /** skipAutoVerifyEmail */ true
    );
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    await executeWithMutationRunOptions(context, opts =>
      assignWorkspaceToUser(
        context!,
        SYSTEM_SESSION_AGENT,
        workspace.resourceId,
        user02.resourceId,
        opts
      )
    );
    const {file} = await insertFileForTest(context, userToken, workspace);
    appAssert(userToken02.separateEntityId);
    await grantEveryPermission(workspace, userToken, userToken02.separateEntityId);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken02))
    );

    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: {targetId: file.resourceId},
        action: AppActionType.Update,
        containerId: getFilePermissionContainers(workspace.resourceId, file, false),
      });
    }, [EmailAddressNotVerifiedError.name]);
  });

  test('auth with appliesTo', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {rawWorkspace: workspace} = await insertWorkspaceForTest(context, userToken);
    const tokenList = await generateAndInsertAgentTokenListForTest(context, 1, {
      workspaceId: workspace.resourceId,
    });
    const [token01] = tokenList;

    const outerFolders = await generateAndInsertTestFolders(context, 4, {
      workspaceId: workspace.resourceId,
      parentId: null,
    });
    const [outerFolder01, outerFolder02, outerFolder03, outerFolder04] = outerFolders;
    const [[innerFolder01], [innerFolder02]] = await Promise.all([
      generateAndInsertTestFolders(context, 1, {
        workspaceId: workspace.resourceId,
        parentId: outerFolder03.resourceId,
      }),
      generateAndInsertTestFolders(context, 1, {
        workspaceId: workspace.resourceId,
        parentId: outerFolder04.resourceId,
      }),
    ]);

    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
          workspaceId: workspace.resourceId,
          entity: {entityId: token01.resourceId},
          items: [],
        })
      ),
    ]);

    await Promise.all([
      generateAndInsertPermissionItemListForTest(context, 1, {
        workspaceId: workspace.resourceId,
        entityId: token01.resourceId,
        targetId: outerFolder01.resourceId,
        action: AppActionType.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.Self,
        targetParentId: workspace.resourceId,
        targetParentType: AppResourceType.Workspace,
      }),
      generateAndInsertPermissionItemListForTest(context, 1, {
        workspaceId: workspace.resourceId,
        entityId: token01.resourceId,
        targetId: outerFolder02.resourceId,
        action: AppActionType.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
        targetParentId: workspace.resourceId,
        targetParentType: AppResourceType.Workspace,
      }),
      generateAndInsertPermissionItemListForTest(context, 1, {
        workspaceId: workspace.resourceId,
        entityId: token01.resourceId,
        targetId: outerFolder03.resourceId,
        action: AppActionType.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
        targetParentId: workspace.resourceId,
        targetParentType: AppResourceType.Workspace,
      }),
      generateAndInsertPermissionItemListForTest(context, 1, {
        workspaceId: workspace.resourceId,
        entityId: token01.resourceId,
        targetId: outerFolder04.resourceId,
        action: AppActionType.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ChildrenOfType,
        targetParentId: workspace.resourceId,
        targetParentType: AppResourceType.Workspace,
      }),
    ]);

    const tAgent = makeWorkspaceAgentTokenAgent(token01);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: tAgent,
        targets: {
          targetId: outerFolder01.resourceId,
          targetAppliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
        },
        action: AppActionType.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, outerFolder01, false),
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: tAgent,
        targets: {
          targetId: outerFolder02.resourceId,
          targetAppliesTo: PermissionItemAppliesTo.Self,
        },
        action: AppActionType.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, outerFolder02, false),
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: tAgent,
        targets: {
          targetId: innerFolder01.resourceId,
          containerAppliesTo: PermissionItemAppliesTo.ChildrenOfType,
        },
        action: AppActionType.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, innerFolder01, false),
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorization({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: tAgent,
        targets: {
          targetId: innerFolder02.resourceId,
          containerAppliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
        },
        action: AppActionType.Read,
        containerId: getFilePermissionContainers(workspace.resourceId, innerFolder02, false),
      });
    }, [PermissionDeniedError.name]);
  });

  // TODO
  test.skip('auth passes if access permission outweighs deny permission', async () => {});

  // TODO
  test.skip('auth fails if deny permission outweighs access permission', async () => {});

  // TODO: why skip? Also check for skip in other tests.
  test.skip('summarizeAgentPermissionItems with wildcard action', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();
    const pg02Items: PermissionItemInput[] = [
      {
        action: AppActionType.All,
        grantAccess: true,
        target: {
          targetType: AppResourceType.Workspace,
          targetId: PermissionItemAppliesTo.SelfAndChildrenOfType,
        },
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];
    const pg03Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
        RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
        workspace,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: {targetId: workspace.resourceId},
        action: AppActionType.Read,
        containerId: getWorkspacePermissionContainers(workspace.resourceId),
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toHaveLength(0);
    expect(deniedResourceIdList).toHaveLength(0);
  });

  test('summarizeAgentPermissionItems with wildcard resource type overrides others', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();

    const pg02Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.All, targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];
    const pg03Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];

    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg03Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg03.resourceId},
        }
      )
    );
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg02Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg02.resourceId},
        }
      )
    );

    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: {targetId: workspace.resourceId},
        action: AppActionType.Read,
        containerId: getWorkspacePermissionContainers(workspace.resourceId),
      });
    expect(hasFullOrLimitedAccess).toBeTruthy();
    expect(noAccess).toBeFalsy();
    expect(allowedResourceIdList).toBeFalsy();
    expect(deniedResourceIdList).toBeFalsy();
  });

  test('summarizeAgentPermissionItems with target ID', async () => {
    assertContext(context);
    const {userToken, workspace, pg02, pg03, clientTokenAgent} =
      await setupForSummarizeAgentPermissionItemsTest();

    const pg02Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.Self,
      },
    ];
    const pg03Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetType: AppResourceType.Workspace, targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];

    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg03Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg03.resourceId},
        }
      )
    );
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg02Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg02.resourceId},
        }
      )
    );

    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: {targetId: workspace.resourceId},
        action: AppActionType.Read,
        containerId: getWorkspacePermissionContainers(workspace.resourceId),
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

    const pg02Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.Self,
      },
    ];
    const pg03Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.Workspace, targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];

    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg03Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg03.resourceId},
        }
      )
    );
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          items: pg02Items,
          workspaceId: workspace.resourceId,
          entity: {entityId: pg02.resourceId},
        }
      )
    );

    const {hasFullOrLimitedAccess, allowedResourceIdList, deniedResourceIdList, noAccess} =
      await summarizeAgentPermissionItems({
        context,
        workspace,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: {targetId: workspace.resourceId},
        action: AppActionType.Read,
        containerId: getWorkspacePermissionContainers(workspace.resourceId),
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
    const pg02Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: false,
        target: {targetType: AppResourceType.Workspace, targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];
    const pg03Items: PermissionItemInput[] = [
      {
        action: AppActionType.Read,
        grantAccess: true,
        target: {targetType: AppResourceType.Workspace, targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.SelfAndChildrenOfType,
      },
    ];
    await Promise.all([
      addPermissionItems(
        context,
        RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
        RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
        workspace,
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: {targetId: workspace.resourceId},
        action: AppActionType.Read,
        containerId: getWorkspacePermissionContainers(workspace.resourceId),
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
