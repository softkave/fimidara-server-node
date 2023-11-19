import assert from 'assert';
import {PermissionAction, PermissionItem} from '../../../../definitions/permissionItem';
import {SYSTEM_SESSION_AGENT} from '../../../../utils/agent';
import {toArray} from '../../../../utils/fns';
import RequestData from '../../../RequestData';
import {assignWorkspaceToUser} from '../../../assignedItems/addAssignedItems';
import {generateAndInsertTestFiles} from '../../../testUtils/generateData/file';
import {generateAndInsertTestFolders} from '../../../testUtils/generateData/folder';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../testUtils/generateData/permissionGroup';
import {generatePermissionItemForTest} from '../../../testUtils/generateData/permissionItem';
import {expectErrorThrown} from '../../../testUtils/helpers/error';
import {completeTest} from '../../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../testUtils/testUtils';
import {EmailAddressNotVerifiedError, PermissionDeniedError} from '../../../users/errors';
import {SignupEndpointParams} from '../../../users/signup/types';
import {BaseContextType} from '../../types';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../checkAuthorizaton';

/**
 * - returns correct access permission
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('checkAuthorization', () => {
  test('check auth with target + entity, access & no access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file02, file03] = await generateAndInsertTestFiles(context, 3, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file03.resourceId,
        access: false,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file02, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file03, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with target + inherited entity, access & no access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[file01, file02, file03, file04], [pg01, pg02]] = await Promise.all([
      generateAndInsertTestFiles(context, 3, {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }),
      generateAndInsertPermissionGroupListForTest(context, 2, {
        workspaceId: rawWorkspace.resourceId,
      }),
    ]);

    await Promise.all([
      // Add readFile access to file01 for pg01
      addPermissions(rawWorkspace.resourceId, pg01.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      // Add readFile access to file02 for pg02
      addPermissions(rawWorkspace.resourceId, pg02.resourceId, 'readFile', {
        targetId: file02.resourceId,
      }),
      // Add deny readFile access to file04 for pg01
      addPermissions(rawWorkspace.resourceId, pg02.resourceId, 'readFile', {
        targetId: file02.resourceId,
        access: false,
      }),
      // Assign pg02 to pg01
      generateAndInsertAssignedItemListForTest(context, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg02.resourceId,
        assigneeId: pg01.resourceId,
      }),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(context, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
        action: 'readFile',
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file02, true),
        action: 'readFile',
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file03, true),
          action: 'readFile',
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file04, true),
          action: 'readFile',
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with parent + entity, access & no access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01, folder02, folder03] = await generateAndInsertTestFolders(
      context,
      3,
      {workspaceId: rawWorkspace.resourceId, parentId: null}
    );
    const [[file01], [file02], [file03]] = await Promise.all([
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder02.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder03.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder03.resourceId,
        access: false,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file02, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file03, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with parent + inherited entity, access & no access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[folder01, folder02, folder03, folder04], [pg01, pg02]] = await Promise.all([
      generateAndInsertTestFolders(context, 3, {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }),
      generateAndInsertPermissionGroupListForTest(context, 2, {
        workspaceId: rawWorkspace.resourceId,
      }),
    ]);
    const [[file01], [file02], [file03], [file04]] = await Promise.all([
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder02.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder03.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder04.resourceId,
      }),
    ]);
    await Promise.all([
      // Add readFile access to folder01 for pg01
      addPermissions(rawWorkspace.resourceId, pg01.resourceId, 'readFile', {
        targetId: folder01.resourceId,
      }),
      // Add readFile access to folder02 for pg02
      addPermissions(rawWorkspace.resourceId, pg02.resourceId, 'readFile', {
        targetId: folder02.resourceId,
      }),
      // Add deny readFile access to folder04 for pg02
      addPermissions(rawWorkspace.resourceId, pg02.resourceId, 'readFile', {
        targetId: folder04.resourceId,
        access: false,
      }),
      // Assign pg02 to pg01
      generateAndInsertAssignedItemListForTest(context, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg02.resourceId,
        assigneeId: pg01.resourceId,
      }),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(context, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file02, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file03, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file04, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('no throw', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file02] = await generateAndInsertTestFiles(context, 2, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file02.resourceId,
        access: false,
      }),
    ]);

    const check01 = await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
      nothrow: true,
    });
    const check02 = await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file02, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
      nothrow: true,
    });

    expect(check01.hasAccess).toBeFalsy();
    expect(check01.item).toBeFalsy();
    expect(check02.hasAccess).toBeFalsy();
    expect(check02.item).toBeTruthy();
  });

  test('wildcard', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file03] = await generateAndInsertTestFiles(context, 2, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'wildcard', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'wildcard', {
        targetId: file03.resourceId,
        access: false,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file03, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('entity > inherited entity weight', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[file01], [pg01]] = await Promise.all([
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }),
      generateAndInsertPermissionGroupListForTest(context, 1, {
        workspaceId: rawWorkspace.resourceId,
      }),
    ]);

    await Promise.all([
      // Add readFile access to file01 for user02
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      // Add deny readFile access to file01 for pg01
      addPermissions(rawWorkspace.resourceId, pg01.resourceId, 'readFile', {
        targetId: file01.resourceId,
        access: false,
      }),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(context, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
        action: 'readFile',
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('target > parent weight', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(context, 1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
        access: false,
      }),
    ]);

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('date weight', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01] = await generateAndInsertTestFiles(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    // Assign deny permission to file
    await addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
      targetId: file01.resourceId,
      access: false,
    });
    // Assign allow permission which should override deny permission
    await addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
      targetId: file01.resourceId,
    });

    await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('agent not verified', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId, {}, true);
    const [file01] = await generateAndInsertTestFiles(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
    ]);

    await expectErrorThrown(async () => {
      assertContext(context);
      await checkAuthorizationWithAgent({
        context,
        agent: user02SessionAgent,
        target: {
          action: 'readFile',
          targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [EmailAddressNotVerifiedError.name]);
  });

  test('resolve target children full access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
      }),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === 'full');
    expect(resolveResult.item).toBeTruthy();
    expect(resolveResult.partialDenyIds.length).toBe(0);
    expect(resolveResult.partialDenyItems.length).toBe(0);
  });

  test('resolve target children no access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01, folder02] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
        access: false,
      }),
    ]);

    const resolveResult01 = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    const resolveResult02 = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder02, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult01.access === 'deny');
    expect(resolveResult01.item).toBeTruthy();

    assert(resolveResult02.access === 'partial');
    expect(resolveResult02.item).toBeFalsy();
    expect(resolveResult02.partialAllowIds.length).toBe(0);
    expect(resolveResult02.partialAllowItems.length).toBe(0);
  });

  test('resolve target children partial access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01, file02]] = await Promise.all([
      generateAndInsertTestFiles(context, 2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file02.resourceId,
        access: false,
      }),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === 'partial');
    expect(resolveResult.item).toBeFalsy();
    expect(resolveResult.partialAllowIds?.length).toBe(1);
    expect(resolveResult.partialAllowItems?.length).toBe(1);
    expect(resolveResult.partialAllowIds).toContain(file02.resourceId);
  });

  test('resolve target children partial access with parent deny and some children access', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(context, 2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
        access: false,
      }),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === 'partial');
    expect(resolveResult.item).toBeFalsy();
    expect(resolveResult.partialAllowIds?.length).toBe(1);
    expect(resolveResult.partialAllowItems?.length).toBe(1);
    expect(resolveResult.partialAllowIds).toContain(file01.resourceId);
  });

  test('resolve target children partial access with parent allow and some children deny', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(context, 2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: file01.resourceId,
        access: false,
      }),
      addPermissions(rawWorkspace.resourceId, user02.resourceId, 'readFile', {
        targetId: folder01.resourceId,
      }),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, folder01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === 'full');
    expect(resolveResult.item).toBeFalsy();
    expect(resolveResult.partialDenyIds?.length).toBe(1);
    expect(resolveResult.partialDenyItems?.length).toBe(1);
    expect(resolveResult.partialDenyIds).toContain(file01.resourceId);
  });

  test('returns correct access permission', async () => {
    assertContext(context);
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01] = await generateAndInsertTestFiles(context, 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [pItem01] = await addPermissions(
      rawWorkspace.resourceId,
      user02.resourceId,
      'readFile',
      {targetId: file01.resourceId}
    );

    const checkResult = await checkAuthorizationWithAgent({
      context,
      agent: user02SessionAgent,
      target: {
        action: 'readFile',
        targetId: getFilePermissionContainers(rawWorkspace.resourceId, file01, true),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    expect(checkResult.hasAccess).toBeTruthy();
    expect(checkResult.item?.resourceId).toBe(pItem01.resourceId);
  });
});

async function addPermissions(
  workspaceId: string,
  recipientUserId: string,
  permissions: PermissionAction | PermissionAction[],
  other?: Partial<PermissionItem>
) {
  assertContext(context);
  const items = toArray(permissions).map(action =>
    generatePermissionItemForTest({
      action,
      access: true,
      targetId: workspaceId,
      entityId: recipientUserId,
      ...other,
    })
  );
  await context.semantic.utils.withTxn(context, opts =>
    context!.data.permissionItem.insertList(items, opts)
  );
  return items;
}

async function generateUserAndWorkspace(
  userInput: Partial<SignupEndpointParams> = {},
  skipAutoVerifyEmail = false
) {
  assertContext(context);
  const usersResult = await insertUserForTest(context, userInput, skipAutoVerifyEmail);
  const {userToken} = usersResult;
  const workspaceResult = await insertWorkspaceForTest(context, userToken);
  const sessionAgent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  return {...usersResult, ...workspaceResult, sessionAgent};
}

async function generateUserAndAddToWorkspace(
  workspaceId: string,
  userInput: Partial<SignupEndpointParams> = {},
  skipAutoVerifyEmail = false
) {
  assertContext(context);
  const usersResult = await insertUserForTest(context, userInput, skipAutoVerifyEmail);
  const {user, userToken} = usersResult;
  await context.semantic.utils.withTxn(context, opts =>
    assignWorkspaceToUser(
      context!,
      SYSTEM_SESSION_AGENT,
      workspaceId,
      user.resourceId,
      opts
    )
  );
  const sessionAgent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken))
  );
  return {...usersResult, sessionAgent};
}
