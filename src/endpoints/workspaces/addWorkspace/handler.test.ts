import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {ResourceExistsError} from '../../errors.js';
import {fetchEntityAssignedPermissionGroupList} from '../../permissionGroups/getEntityAssignedPermissionGroups/utils.js';
import EndpointReusableQueries from '../../queries.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
import {
  assertWorkspace,
  makeRootnameFromName,
  workspaceExtractor,
} from '../utils.js';
import {AddWorkspaceEndpointParams} from './types.js';
import {
  DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
  DEFAULT_PUBLIC_PERMISSION_GROUP_NAME,
} from './utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addWorkspace', () => {
  test('workspace created', async () => {
    const {userToken} = await insertUserForTest();
    const companyName = faker.company.name();
    const companyInput: AddWorkspaceEndpointParams = {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
    };

    const result = await insertWorkspaceForTest(userToken, companyInput);
    expect(result.workspace).toMatchObject(companyInput);
    expect(result.workspace.publicPermissionGroupId).toBeTruthy();
    const workspace = await kIjxSemantic
      .workspace()
      .getOneByQuery(
        EndpointReusableQueries.getByResourceId(result.workspace.resourceId)
      );
    assertWorkspace(workspace);
    expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

    const adminPermissionGroup = await kIjxSemantic
      .permissionGroup()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByWorkspaceIdAndName(
          workspace.resourceId,
          DEFAULT_ADMIN_PERMISSION_GROUP_NAME
        )
      );
    await kIjxSemantic
      .permissionGroup()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByWorkspaceIdAndName(
          workspace.resourceId,
          DEFAULT_PUBLIC_PERMISSION_GROUP_NAME
        )
      );

    appAssert(userToken.forEntityId);
    const user = await populateUserWorkspaces(
      await kIjxSemantic
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(userToken.forEntityId)
        )
    );
    const userWorkspace = user.workspaces.find(
      item => item.workspaceId === workspace.resourceId
    );

    expect(userWorkspace).toBeTruthy();
    const userPermissionGroupsResult =
      await fetchEntityAssignedPermissionGroupList({
        workspaceId: workspace.resourceId,
        entityId: userToken.forEntityId,
        includeInheritedPermissionGroups: false,
      });
    const assignedAdminPermissionGroup =
      userPermissionGroupsResult.permissionGroups.find(
        item => item.resourceId === adminPermissionGroup.resourceId
      );
    expect(assignedAdminPermissionGroup).toBeTruthy();
  });

  test('fails if workspace name exists', async () => {
    const {userToken} = await insertUserForTest();
    const result = await insertWorkspaceForTest(userToken);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, {
        name: result.workspace.name,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if workspace root name exists', async () => {
    const {userToken} = await insertUserForTest();
    const result = await insertWorkspaceForTest(userToken);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, {
        rootname: result.workspace.rootname,
      });
    }, [ResourceExistsError.name]);
  });

  test('fails if user is on waitlist', async () => {
    kRegisterIjxUtils.suppliedConfig(
      mergeData(
        kIjxUtils.suppliedConfig(),
        {FLAG_waitlistNewSignups: true},
        {arrayUpdateStrategy: 'replace'}
      )
    );
    const {userToken} = await insertUserForTest();
    await expectErrorThrown(
      async () => {
        await insertWorkspaceForTest(userToken);
      },
      error => {
        expect((error as Error).message).toBe(
          kReuseableErrors.user.userOnWaitlist().message
        );
      },
      () => {
        // TODO: if we ever switch to concurrent tests, then create a context
        // for this test instead
        kRegisterIjxUtils.suppliedConfig(
          mergeData(
            kIjxUtils.suppliedConfig(),
            {FLAG_waitlistNewSignups: false},
            {arrayUpdateStrategy: 'replace'}
          )
        );
      }
    );
  });
});
