import {faker} from '@faker-js/faker';
import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {IRootLevelWorkspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {fetchEntityAssignedPermissionGroupList} from '../../permissionGroups/getEntityAssignedPermissionGroups/utils.js';
import EndpointReusableQueries from '../../queries.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors.js';
import {
  assertWorkspace,
  makeRootnameFromName,
  workspaceExtractor,
} from '../utils.js';
import {
  kDefaultAdminPermissionGroupName,
  kDefaultPublicPermissionGroupName,
} from './utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe.each([true, false])('addWorkspace, sub=%s', isSubWorkspace => {
  let u1: Awaited<ReturnType<typeof insertUserForTest>> | undefined;
  let w1: Awaited<ReturnType<typeof insertWorkspaceForTest>> | undefined;

  const getW2Input = () => {
    const wName = faker.company.name();
    if (isSubWorkspace) {
      assert.ok(w1);
      return {
        name: wName,
        rootname: makeRootnameFromName(wName),
        description: faker.company.catchPhraseDescriptor(),
        workspaceId: w1.workspace.resourceId,
      };
    } else {
      return {
        name: wName,
        rootname: makeRootnameFromName(wName),
        description: faker.company.catchPhraseDescriptor(),
      };
    }
  };

  beforeAll(async () => {
    u1 = await insertUserForTest();
    if (isSubWorkspace) {
      w1 = await insertWorkspaceForTest(u1.userToken);
    }
  });

  test('workspace created', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    const result = await insertWorkspaceForTest(userToken, w2Input);

    const rWorkspace = result.workspace as IRootLevelWorkspace;
    expect(rWorkspace).toMatchObject(w2Input);

    if (isSubWorkspace) {
      appAssert(w1);

      // rootnamepath and workspaceId should be the same as the parent workspace
      // being subclassed
      expect(rWorkspace.rootnamepath).toEqual(
        w1.workspace.rootnamepath?.concat(rWorkspace.rootname)
      );
      expect(rWorkspace.workspaceId).toEqual(w1.workspace.resourceId);
    } else {
      expect(rWorkspace.publicPermissionGroupId).toBeTruthy();

      // rootnamepath and workspaceId should be the same as the root workspace
      expect(rWorkspace.rootnamepath).toEqual([rWorkspace.rootname]);
      expect(rWorkspace.workspaceId).toEqual(rWorkspace.resourceId);

      // check that the workspace was persisted and matches the input
      const workspace = await kSemanticModels
        .workspace()
        .getOneByQuery(
          EndpointReusableQueries.getByResourceId(rWorkspace.resourceId)
        );
      assertWorkspace(workspace);
      expect(workspaceExtractor(workspace)).toMatchObject(rWorkspace);

      const [adminPermissionGroup] = await Promise.all([
        kSemanticModels
          .permissionGroup()
          .assertGetOneByQuery(
            EndpointReusableQueries.getByWorkspaceIdAndName(
              workspace.resourceId,
              kDefaultAdminPermissionGroupName
            )
          ),
        kSemanticModels
          .permissionGroup()
          .assertGetOneByQuery(
            EndpointReusableQueries.getByWorkspaceIdAndName(
              workspace.resourceId,
              kDefaultPublicPermissionGroupName
            )
          ),
      ]);

      // check workspace is assigned to user
      appAssert(userToken.forEntityId);
      const user = await populateUserWorkspaces(
        await kSemanticModels
          .user()
          .assertGetOneByQuery(
            EndpointReusableQueries.getByResourceId(userToken.forEntityId)
          )
      );
      const userWorkspace = user.workspaces.find(
        item => item.workspaceId === workspace.resourceId
      );
      expect(userWorkspace).toBeTruthy();

      // check that the user has the admin permission group
      const userPermissionGroupsResult =
        await fetchEntityAssignedPermissionGroupList(userToken.forEntityId);
      const assignedAdminPermissionGroup =
        userPermissionGroupsResult.permissionGroups.find(
          item => item.resourceId === adminPermissionGroup.resourceId
        );
      expect(assignedAdminPermissionGroup).toBeTruthy();
    }
  });

  test('fails if workspace name exists', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    await insertWorkspaceForTest(userToken, w2Input);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, w2Input);
    }, [WorkspaceExistsError.name]);
  });

  test('fails if workspace root name exists', async () => {
    assert.ok(u1);
    const {userToken} = u1;
    const w2Input = getW2Input();

    await insertWorkspaceForTest(userToken, w2Input);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, w2Input);
    }, [WorkspaceRootnameExistsError.name]);
  });

  test('fails if user is on waitlist', async () => {
    kRegisterUtilsInjectables.suppliedConfig(
      mergeData(
        kUtilsInjectables.suppliedConfig(),
        /** source */ {FLAG_waitlistNewSignups: true},
        /** meta */ {arrayUpdateStrategy: 'replace'}
      )
    );
    assert.ok(u1);
    const {userToken} = u1;

    if (isSubWorkspace) {
      // should not fail because only root level workspaces are checked
      await insertWorkspaceForTest(userToken);
    } else {
      await expectErrorThrown(
        async () => {
          await insertWorkspaceForTest(userToken);
        },
        /** expected */ error => {
          expect((error as Error).message).toBe(
            kReuseableErrors.user.userOnWaitlist().message
          );
        },
        /** finally */ () => {
          // TODO: if we ever switch to concurrent tests, then create a context
          // for this test instead
          kRegisterUtilsInjectables.suppliedConfig(
            mergeData(
              kUtilsInjectables.suppliedConfig(),
              /** source */ {FLAG_waitlistNewSignups: false},
              /** meta */ {arrayUpdateStrategy: 'replace'}
            )
          );
        }
      );
    }
  });
});
