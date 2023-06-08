import {faker} from '@faker-js/faker';
import {appAssert} from '../../../utils/assertion';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import {fetchEntityAssignedPermissionGroupList} from '../../permissionGroups/getEntityAssignedPermissionGroups/utils';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {UserOnWaitlistError} from '../../users/errors';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors';
import {assertWorkspace, makeRootnameFromName, workspaceExtractor} from '../utils';
import {AddWorkspaceEndpointParams} from './types';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME, DEFAULT_PUBLIC_PERMISSION_GROUP_NAME} from './utils';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('addWorkspace', () => {
  test('workspace created', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const companyName = faker.company.name();
    const companyInput: AddWorkspaceEndpointParams = {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
    };

    const result = await insertWorkspaceForTest(context, userToken, companyInput);
    expect(result.workspace).toMatchObject(companyInput);
    expect(result.workspace.publicPermissionGroupId).toBeTruthy();
    const workspace = await context.semantic.workspace.getOneByQuery(
      EndpointReusableQueries.getByResourceId(result.workspace.resourceId)
    );
    assertWorkspace(workspace);
    expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

    const adminPermissionGroup = await context.semantic.permissionGroup.assertGetOneByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndName(
        workspace.resourceId,
        DEFAULT_ADMIN_PERMISSION_GROUP_NAME
      )
    );
    await context.semantic.permissionGroup.assertGetOneByQuery(
      EndpointReusableQueries.getByWorkspaceIdAndName(
        workspace.resourceId,
        DEFAULT_PUBLIC_PERMISSION_GROUP_NAME
      )
    );

    appAssert(userToken.separateEntityId);
    const user = await populateUserWorkspaces(
      context,
      await context.semantic.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(userToken.separateEntityId)
      )
    );
    const userWorkspace = user.workspaces.find(item => item.workspaceId === workspace.resourceId);

    expect(userWorkspace).toBeTruthy();
    const userPermissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      context,
      userToken.separateEntityId
    );
    const assignedAdminPermissionGroup = userPermissionGroupsResult.permissionGroups.find(
      item => item.resourceId === adminPermissionGroup.resourceId
    );
    expect(assignedAdminPermissionGroup).toBeTruthy();
  });

  test('fails if workspace name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const result = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      await insertWorkspaceForTest(context, userToken, {
        name: result.workspace.name,
      });
    }, [WorkspaceExistsError.name]);
  });

  test('fails if workspace root name exists', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const result = await insertWorkspaceForTest(context, userToken);
    await expectErrorThrown(async () => {
      assertContext(context);
      await insertWorkspaceForTest(context, userToken, {
        rootname: result.workspace.rootname,
      });
    }, [WorkspaceRootnameExistsError.name]);
  });

  test('fails if user is on waitlist', async () => {
    assertContext(context);
    context.appVariables.FLAG_waitlistNewSignups = true;
    const {userToken} = await insertUserForTest(context);
    await expectErrorThrown(
      async () => {
        assertContext(context);
        await insertWorkspaceForTest(context, userToken);
      },
      [UserOnWaitlistError.name],
      () => {
        assertContext(context);

        // TODO: if we ever switch to concurrent tests, then create a context
        // for this test instead
        context.appVariables.FLAG_waitlistNewSignups = false;
      }
    );
  });
});
