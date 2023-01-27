import {faker} from '@faker-js/faker';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {WorkspaceExistsError, WorkspaceRootnameExistsError} from '../errors';
import {assertWorkspace, makeRootnameFromName, workspaceExtractor} from '../utils';
import {IAddWorkspaceEndpointParams} from './types';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME, DEFAULT_PUBLIC_PERMISSION_GROUP_NAME} from './utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('addWorkspace', () => {
  test('workspace created', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const companyName = faker.company.name();
    const companyInput: IAddWorkspaceEndpointParams = {
      name: companyName,
      rootname: makeRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
    };

    const result = await insertWorkspaceForTest(context, userToken, companyInput);
    expect(result.workspace).toMatchObject(companyInput);
    expect(result.workspace.publicPermissionGroupId).toBeTruthy();
    const workspace = await context.data.workspace.getOneByQuery(
      EndpointReusableQueries.getById(result.workspace.resourceId)
    );
    assertWorkspace(workspace);
    expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

    const adminPermissionGroup = await context.data.permissiongroup.assertGetOneByQuery(
      EndpointReusableQueries.getByWorkspaceAndName(workspace.resourceId, DEFAULT_ADMIN_PERMISSION_GROUP_NAME)
    );

    await context.data.permissiongroup.assertGetOneByQuery(
      EndpointReusableQueries.getByWorkspaceAndName(workspace.resourceId, DEFAULT_PUBLIC_PERMISSION_GROUP_NAME)
    );

    const user = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(EndpointReusableQueries.getById(userToken.userId))
    );

    const userWorkspace = user.workspaces.find(item => item.workspaceId === workspace.resourceId);

    expect(userWorkspace).toBeTruthy();
    const assignedAdminPermissionGroup = userWorkspace?.permissionGroups.find(
      item => item.permissionGroupId === adminPermissionGroup.resourceId
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
});
