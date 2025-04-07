import assert from 'assert';
import {waitTimeout} from 'softkave-js-utils';
import {describe, expect, test} from 'vitest';
import {
  FimidaraPermissionAction,
  PermissionItem,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import RequestData from '../../../endpoints/RequestData.js';
import {assignWorkspaceToUser} from '../../../endpoints/assignedItems/addAssignedItems.js';
import {generateAndInsertTestFiles} from '../../../endpoints/testHelpers/generate/file.js';
import {generateAndInsertTestFolders} from '../../../endpoints/testHelpers/generate/folder.js';
import {
  generateAndInsertAssignedItemListForTest,
  generateAndInsertPermissionGroupListForTest,
} from '../../../endpoints/testHelpers/generate/permissionGroup.js';
import {generatePermissionItemForTest} from '../../../endpoints/testHelpers/generate/permissionItem.js';
import {expectErrorThrown} from '../../../endpoints/testHelpers/helpers/error.js';
import {startTesting} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../../endpoints/testHelpers/utils.js';
import {
  EmailAddressNotVerifiedError,
  PermissionDeniedError,
} from '../../../endpoints/users/errors.js';
import {SignupEndpointParams} from '../../../endpoints/users/signup/types.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {convertToArray} from '../../../utils/fns.js';
import {kSessionUtils} from '../../SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../ijx/injectables.js';
import {
  checkAuthorizationWithAgent,
  getFilePermissionContainers,
  kResolvedTargetChildrenAccess,
  resolveTargetChildrenAccessCheckWithAgent,
} from '../checkAuthorizaton.js';

startTesting();

describe('checkAuthorization', () => {
  test('check auth with target + entity, access & no access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file02, file03] = await generateAndInsertTestFiles(3, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file03.resourceId, access: false}
      ),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file02,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file03,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with target + inherited entity, access & no access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[file01, file02, file03, file04], [pg01, pg02]] = await Promise.all([
      generateAndInsertTestFiles(4, {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }),
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: rawWorkspace.resourceId,
      }),
    ]);

    await Promise.all([
      // Add readFile access to file01 for pg01
      addPermissions(
        rawWorkspace.resourceId,
        pg01.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId}
      ),
      // Add readFile access to file02 for pg02
      addPermissions(
        rawWorkspace.resourceId,
        pg02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file02.resourceId}
      ),
      // Add deny readFile access to file04 for pg01
      addPermissions(
        rawWorkspace.resourceId,
        pg02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file04.resourceId, access: false}
      ),
      // Assign pg02 to pg01
      generateAndInsertAssignedItemListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg02.resourceId,
        assigneeId: pg01.resourceId,
      }),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
        action: kFimidaraPermissionActions.readFile,
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file02,
          true
        ),
        action: kFimidaraPermissionActions.readFile,
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file03,
            true
          ),
          action: kFimidaraPermissionActions.readFile,
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file04,
            true
          ),
          action: kFimidaraPermissionActions.readFile,
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with parent + entity, access & no access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01, folder02, folder03] = await generateAndInsertTestFolders(
      3,
      {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }
    );
    const [[file01], [file02], [file03]] = await Promise.all([
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder02.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder03.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder03.resourceId, access: false}
      ),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file02,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file03,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('check auth with parent + inherited entity, access & no access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[folder01, folder02, folder03, folder04], [pg01, pg02]] =
      await Promise.all([
        generateAndInsertTestFolders(4, {
          workspaceId: rawWorkspace.resourceId,
          parentId: null,
        }),
        generateAndInsertPermissionGroupListForTest(2, {
          workspaceId: rawWorkspace.resourceId,
        }),
      ]);
    const [[file01], [file02], [file03], [file04]] = await Promise.all([
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder02.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder03.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder04.resourceId,
      }),
    ]);
    await Promise.all([
      // Add readFile access to folder01 for pg01
      addPermissions(
        rawWorkspace.resourceId,
        pg01.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId}
      ),
      // Add readFile access to folder02 for pg02
      addPermissions(
        rawWorkspace.resourceId,
        pg02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder02.resourceId}
      ),
      // Add deny readFile access to folder04 for pg02
      addPermissions(
        rawWorkspace.resourceId,
        pg02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder04.resourceId, access: false}
      ),
      // Assign pg02 to pg01
      generateAndInsertAssignedItemListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg02.resourceId,
        assigneeId: pg01.resourceId,
      }),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file02,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file03,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file04,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('no throw', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file02] = await generateAndInsertTestFiles(2, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file02.resourceId, access: false}
      ),
    ]);

    const [check01] = await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
      nothrow: true,
    });
    const [check02] = await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file02,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
      nothrow: true,
    });

    expect(check01.hasAccess).toBeTruthy();
    expect(check01.item).toBeTruthy();
    expect(check02.hasAccess).toBeFalsy();
    expect(check02.item).toBeTruthy();
  });

  test('wildcard', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01, file03] = await generateAndInsertTestFiles(2, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.wildcard,
        {targetId: file01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.wildcard,
        {targetId: file03.resourceId, access: false}
      ),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.readFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file03,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [PermissionDeniedError.name]);
  });

  test('entity > inherited entity weight', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [[file01], [pg01]] = await Promise.all([
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: null,
      }),
      generateAndInsertPermissionGroupListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
      }),
    ]);

    await Promise.all([
      // Add readFile access to file01 for user02
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId}
      ),
      // Add deny readFile access to file01 for pg01
      addPermissions(
        rawWorkspace.resourceId,
        pg01.resourceId,
        kFimidaraPermissionActions.readFile,
        {
          targetId: file01.resourceId,
          access: false,
        }
      ),
      // Assign pg01 to user02
      generateAndInsertAssignedItemListForTest(1, {
        workspaceId: rawWorkspace.resourceId,
        assignedItemId: pg01.resourceId,
        assigneeId: user02.resourceId,
      }),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
        action: kFimidaraPermissionActions.readFile,
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('target > parent weight', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(1, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId, access: false}
      ),
    ]);

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('date weight', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01] = await generateAndInsertTestFiles(/** count */ 1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });

    // Assign deny permission to file
    await addPermissions(
      rawWorkspace.resourceId,
      user02.resourceId,
      kFimidaraPermissionActions.readFile,
      {targetId: file01.resourceId, access: false}
    );
    await waitTimeout(/** ms */ 50);

    // Assign allow permission which should override deny permission
    await addPermissions(
      rawWorkspace.resourceId,
      user02.resourceId,
      kFimidaraPermissionActions.readFile,
      {targetId: file01.resourceId, access: true}
    );

    await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          /** includeResourceId */ true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
  });

  test('agent not verified', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId, {}, true);
    const [file01] = await generateAndInsertTestFiles(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.uploadFile,
        {targetId: file01.resourceId}
      ),
    ]);

    assert(user02.isEmailVerified === false);
    await expectErrorThrown(async () => {
      await checkAuthorizationWithAgent({
        agent: user02SessionAgent,
        target: {
          action: kFimidaraPermissionActions.uploadFile,
          targetId: getFilePermissionContainers(
            rawWorkspace.resourceId,
            file01,
            true
          ),
        },
        workspaceId: rawWorkspace.resourceId,
        workspace: rawWorkspace,
      });
    }, [EmailAddressNotVerifiedError.name]);
  });

  test('resolve target children full access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId}
      ),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === kResolvedTargetChildrenAccess.full);
    expect(resolveResult.item).toBeTruthy();
    expect(resolveResult.partialDenyIds.length).toBe(0);
    expect(resolveResult.partialDenyItems.length).toBe(0);
  });

  test('resolve target children no access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01, folder02] = await generateAndInsertTestFolders(2, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId, access: false}
      ),
    ]);

    const resolveResult01 = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });
    const resolveResult02 = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder02,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult01.access === kResolvedTargetChildrenAccess.deny);
    expect(resolveResult01.item).toBeTruthy();

    assert(resolveResult02.access === kResolvedTargetChildrenAccess.partial);
    expect(resolveResult02.item).toBeFalsy();
    expect(resolveResult02.partialAllowIds.length).toBe(0);
    expect(resolveResult02.partialAllowItems.length).toBe(0);
  });

  test('resolve target children partial access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01, file02]] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId, targetParentId: folder01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {
          targetId: file02.resourceId,
          access: false,
          targetParentId: folder01.resourceId,
        }
      ),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === kResolvedTargetChildrenAccess.partial);
    expect(resolveResult.item).toBeFalsy();
    expect(resolveResult.partialAllowIds?.length).toBe(1);
    expect(resolveResult.partialAllowItems?.length).toBe(1);
    expect(resolveResult.partialAllowIds).toContain(file01.resourceId);
  });

  test('resolve target children partial access with parent deny and some children access', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: file01.resourceId, targetParentId: folder01.resourceId}
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId, access: false}
      ),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    expect(resolveResult.access).toBe(kResolvedTargetChildrenAccess.partial);
    assert(resolveResult.access === kResolvedTargetChildrenAccess.partial);
    expect(resolveResult.item).toBeFalsy();
    expect(resolveResult.partialAllowIds?.length).toBe(1);
    expect(resolveResult.partialAllowItems?.length).toBe(1);
    expect(resolveResult.partialAllowIds).toContain(file01.resourceId);
  });

  test('resolve target children partial access with parent allow and some children deny', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [[file01]] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: rawWorkspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await Promise.all([
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {
          targetId: file01.resourceId,
          access: false,
          targetParentId: folder01.resourceId,
        }
      ),
      addPermissions(
        rawWorkspace.resourceId,
        user02.resourceId,
        kFimidaraPermissionActions.readFile,
        {targetId: folder01.resourceId}
      ),
    ]);

    const resolveResult = await resolveTargetChildrenAccessCheckWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          folder01,
          true
        ),
      },
      workspaceId: rawWorkspace.resourceId,
      workspace: rawWorkspace,
    });

    assert(resolveResult.access === kResolvedTargetChildrenAccess.full);
    expect(resolveResult.item).toBeTruthy();
    expect(resolveResult.partialDenyIds?.length).toBe(1);
    expect(resolveResult.partialDenyItems?.length).toBe(1);
    expect(resolveResult.partialDenyIds).toContain(file01.resourceId);
  });

  test('returns correct access permission', async () => {
    const {rawWorkspace} = await generateUserAndWorkspace();
    const {user: user02, sessionAgent: user02SessionAgent} =
      await generateUserAndAddToWorkspace(rawWorkspace.resourceId);
    const [file01] = await generateAndInsertTestFiles(1, {
      workspaceId: rawWorkspace.resourceId,
      parentId: null,
    });
    const [pItem01] = await addPermissions(
      rawWorkspace.resourceId,
      user02.resourceId,
      kFimidaraPermissionActions.readFile,
      {targetId: file01.resourceId}
    );

    const [checkResult] = await checkAuthorizationWithAgent({
      agent: user02SessionAgent,
      target: {
        action: kFimidaraPermissionActions.readFile,
        targetId: getFilePermissionContainers(
          rawWorkspace.resourceId,
          file01,
          true
        ),
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
  permissions: FimidaraPermissionAction | FimidaraPermissionAction[],
  other?: Partial<PermissionItem>
) {
  const items = convertToArray(permissions).map(action => {
    return generatePermissionItemForTest({
      action,
      access: true,
      targetId: workspaceId,
      entityId: recipientUserId,
      ...other,
    });
  });

  await kIjxSemantic
    .utils()
    .withTxn(opts => kIjxSemantic.permissionItem().insertItem(items, opts));

  return items;
}

async function generateUserAndWorkspace(
  userInput: Partial<SignupEndpointParams> = {},
  skipAutoVerifyEmail = false
) {
  const usersResult = await insertUserForTest(userInput, skipAutoVerifyEmail);
  const {userToken} = usersResult;
  const workspaceResult = await insertWorkspaceForTest(userToken);
  const sessionAgent = await kIjxUtils
    .session()
    .getAgentFromReq(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken)
      ),
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  return {...usersResult, ...workspaceResult, sessionAgent};
}

async function generateUserAndAddToWorkspace(
  workspaceId: string,
  userInput: Partial<SignupEndpointParams> = {},
  skipAutoVerifyEmail = false
) {
  const usersResult = await insertUserForTest(userInput, skipAutoVerifyEmail);
  const {user, userToken} = usersResult;
  await kIjxSemantic
    .utils()
    .withTxn(opts =>
      assignWorkspaceToUser(
        kSystemSessionAgent,
        workspaceId,
        user.resourceId,
        opts
      )
    );
  const sessionAgent = await kIjxUtils
    .session()
    .getAgentFromReq(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken)
      ),
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  return {...usersResult, sessionAgent};
}
