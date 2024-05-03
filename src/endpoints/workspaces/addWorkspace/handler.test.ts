import {faker} from '@faker-js/faker';
import {appAssert} from '../../../utils/assertion.js';
import {mergeData} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register.js';
import {fetchEntityAssignedPermissionGroupList} from '../../permissionGroups/getEntityAssignedPermissionGroups/utils.js';
import EndpointReusableQueries from '../../queries.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils.js';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors.js';
import {assertWorkspace, makeRootnameFromName, workspaceExtractor} from '../utils.js';
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
    const workspace = await kSemanticModels
      .workspace()
      .getOneByQuery(
        EndpointReusableQueries.getByResourceId(result.workspace.resourceId)
      );
    assertWorkspace(workspace);
    expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

    const adminPermissionGroup = await kSemanticModels
      .permissionGroup()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByWorkspaceIdAndName(
          workspace.resourceId,
          DEFAULT_ADMIN_PERMISSION_GROUP_NAME
        )
      );
    await kSemanticModels
      .permissionGroup()
      .assertGetOneByQuery(
        EndpointReusableQueries.getByWorkspaceIdAndName(
          workspace.resourceId,
          DEFAULT_PUBLIC_PERMISSION_GROUP_NAME
        )
      );

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
    const userPermissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      userToken.forEntityId
    );
    const assignedAdminPermissionGroup = userPermissionGroupsResult.permissionGroups.find(
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
    }, [WorkspaceExistsError.name]);
  });

  test('fails if workspace root name exists', async () => {
    const {userToken} = await insertUserForTest();
    const result = await insertWorkspaceForTest(userToken);
    await expectErrorThrown(async () => {
      await insertWorkspaceForTest(userToken, {
        rootname: result.workspace.rootname,
      });
    }, [WorkspaceRootnameExistsError.name]);
  });

  test('fails if user is on waitlist', async () => {
    kRegisterUtilsInjectables.suppliedConfig(
      mergeData(
        kUtilsInjectables.suppliedConfig(),
        {FLAG_waitlistNewSignups: true},
        {arrayUpdateStrategy: 'replace'}
      )
    );
    const {userToken} = await insertUserForTest();
    await expectErrorThrown(
      async () => {
        await insertWorkspaceForTest(userToken);
      },
      error =>
        expect((error as Error).message).toBe(
          kReuseableErrors.user.userOnWaitlist().message
        ),
      () => {
        // TODO: if we ever switch to concurrent tests, then create a context
        // for this test instead
        kRegisterUtilsInjectables.suppliedConfig(
          mergeData(
            kUtilsInjectables.suppliedConfig(),
            {FLAG_waitlistNewSignups: false},
            {arrayUpdateStrategy: 'replace'}
          )
        );
      }
    );
  });
});
