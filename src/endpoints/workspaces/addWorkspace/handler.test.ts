import {faker} from '@faker-js/faker';
import {appAssert} from '../../../utils/assertion';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {fetchEntityAssignedPermissionGroupList} from '../../permissionGroups/getEntityAssignedPermissionGroups/utils';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {insertUserForTest, insertWorkspaceForTest} from '../../testUtils/testUtils';
import {UserOnWaitlistError} from '../../users/errors';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors';
import {assertWorkspace, makeRootnameFromName, workspaceExtractor} from '../utils';
import {AddWorkspaceEndpointParams} from './types';
import {
  DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
  DEFAULT_PUBLIC_PERMISSION_GROUP_NAME,
} from './utils';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
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

    appAssert(userToken.separateEntityId);
    const user = await populateUserWorkspaces(
      await kSemanticModels
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(userToken.separateEntityId)
        )
    );
    const userWorkspace = user.workspaces.find(
      item => item.workspaceId === workspace.resourceId
    );

    expect(userWorkspace).toBeTruthy();
    const userPermissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      userToken.separateEntityId
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
    kUtilsInjectables.config().FLAG_waitlistNewSignups = true;
    const {userToken} = await insertUserForTest();
    await expectErrorThrown(
      async () => {
        await insertWorkspaceForTest(userToken);
      },
      [UserOnWaitlistError.name],
      () => {
        // TODO: if we ever switch to concurrent tests, then create a context
        // for this test instead
        kUtilsInjectables.config().FLAG_waitlistNewSignups = false;
      }
    );
  });
});
