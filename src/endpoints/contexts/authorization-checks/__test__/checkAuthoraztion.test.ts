import {identity} from 'lodash';
import {PermissionItemAppliesTo} from '../../../../definitions/permissionItem';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../../definitions/system';
import {IUserToken} from '../../../../definitions/userToken';
import {IWorkspace} from '../../../../definitions/workspace';
import {addAssignedPermissionGroupList} from '../../../assignedItems/addAssignedItems';
import {assignPgListToIdList, toAssignedPgListInput} from '../../../permissionGroups/testUtils';
import addPermissionItems from '../../../permissionItems/addItems/handler';
import {
  IAddPermissionItemsEndpointParams,
  INewPermissionItemInput,
} from '../../../permissionItems/addItems/types';
import RequestData from '../../../RequestData';
import {expectContainsExactly} from '../../../test-utils/helpers/assertion';
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
    entityId: recipientUserId,
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
    await checkAuthorization({
      context,
      agent,
      targets: [
        {
          targetId: file.resourceId,
          type: AppResourceType.File,
          containerId: getFilePermissionContainers(rawWorkspace.resourceId, file),
        },
      ],
      action: BasicCRUDActions.Read,
      workspaceId: rawWorkspace.resourceId,
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
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );
    await checkAuthorization({
      context,
      workspaceId: workspace.resourceId,
      agent: agent02,
      targets: [
        {
          targetId: file.resourceId,
          type: AppResourceType.File,
          containerId: getFilePermissionContainers(workspace.resourceId, file),
        },
      ],
      action: BasicCRUDActions.Read,
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
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: [
          {
            targetId: file.resourceId,
            type: AppResourceType.File,
            containerId: getFilePermissionContainers(workspace.resourceId, file),
          },
        ],
        action: BasicCRUDActions.Read,
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
    await checkAuthorization({
      context,
      workspaceId: workspace.resourceId,
      agent: agent02,
      targets: [
        {
          targetId: file.resourceId,
          type: AppResourceType.File,
          containerId: getFilePermissionContainers(workspace.resourceId, file),
        },
      ],
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
    await grantEveryPermission(workspace, userToken, userToken02.userId);
    const agent02 = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken02))
    );

    try {
      await checkAuthorization({
        context,
        workspaceId: workspace.resourceId,
        agent: agent02,
        targets: [
          {
            targetId: file.resourceId,
            type: AppResourceType.File,
            containerId: getFilePermissionContainers(workspace.resourceId, file),
          },
        ],
        action: BasicCRUDActions.Update,
        nothrow: false,
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
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        entityId: pg02.resourceId,
        containerId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        entityId: pg03.resourceId,
        containerId: workspace.resourceId,
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
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [
          {
            targetId: workspace.resourceId,
            type: AppResourceType.Workspace,
            containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
          },
        ],
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
        entityId: pg02.resourceId,
        containerId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        entityId: pg03.resourceId,
        containerId: workspace.resourceId,
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
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [
          {
            targetId: workspace.resourceId,
            type: AppResourceType.Workspace,
            containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
          },
        ],
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
        entityId: pg02.resourceId,
        containerId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: false,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        entityId: pg03.resourceId,
        containerId: workspace.resourceId,
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
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [
          {
            targetId: workspace.resourceId,
            type: AppResourceType.Workspace,
            containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
          },
        ],
        action: BasicCRUDActions.Read,
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
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
        entityId: pg02.resourceId,
        containerId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        entityId: pg03.resourceId,
        containerId: workspace.resourceId,
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
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [
          {
            targetId: workspace.resourceId,
            type: AppResourceType.Workspace,
            containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
          },
        ],
        action: BasicCRUDActions.Read,
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
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        entityId: pg02.resourceId,
        containerId: workspace.resourceId,
      },
    ];
    const pg03Items: INewPermissionItemInput[] = [
      {
        action: BasicCRUDActions.Read,
        grantAccess: true,
        appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
        targetType: AppResourceType.Workspace,
        entityId: pg03.resourceId,
        containerId: workspace.resourceId,
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
        workspaceId: workspace.resourceId,
        agent: clientTokenAgent,
        targets: [
          {
            targetId: workspace.resourceId,
            type: AppResourceType.Workspace,
            containerId: getResourcePermissionContainers(workspace.resourceId, workspace),
          },
        ],
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
  const [clientTokenAgent] = await Promise.all([
    context.session.getAgent(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithClientToken(token))
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
      workspace,
      [pg01.resourceId],
      toAssignedPgListInput([pg02, pg03])
    ),
  ]);
  return {userToken, workspace, pg02, pg03, userAgent, clientTokenAgent};
}
