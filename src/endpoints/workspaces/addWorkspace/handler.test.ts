import {faker} from '@faker-js/faker';
import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  getTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../test-utils/test-utils';
import {WorkspaceExistsError, WorkspaceRootNameExistsError} from '../errors';
import {
  assertWorkspace,
  getRootnameFromName,
  workspaceExtractor,
} from '../utils';
import {IAddWorkspaceParams} from './types';
import {
  DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
  DEFAULT_PUBLIC_PERMISSION_GROUP_NAME,
} from './utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('addWorkspace', () => {
  test('workspace created', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const companyName = faker.company.companyName();
    const companyInput: IAddWorkspaceParams = {
      name: companyName,
      rootname: getRootnameFromName(companyName),
      description: faker.company.catchPhraseDescriptor(),
    };

    const result = await insertWorkspaceForTest(
      context,
      userToken,
      companyInput
    );
    expect(result.workspace).toMatchObject(companyInput);
    expect(result.workspace.publicPermissionGroupId).toBeTruthy();
    const workspace = await context.cacheProviders.workspace.getById(
      context,
      result.workspace.resourceId
    );
    assertWorkspace(workspace);
    expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

    const adminPermissionGroup =
      await context.data.permissiongroup.assertGetItem(
        EndpointReusableQueries.getByWorkspaceAndName(
          workspace.resourceId,
          DEFAULT_ADMIN_PERMISSION_GROUP_NAME
        )
      );

    await context.data.permissiongroup.assertGetItem(
      EndpointReusableQueries.getByWorkspaceAndName(
        workspace.resourceId,
        DEFAULT_PUBLIC_PERMISSION_GROUP_NAME
      )
    );

    const user = await withUserWorkspaces(
      context,
      await context.data.user.assertGetItem(
        EndpointReusableQueries.getById(userToken.userId)
      )
    );

    const userWorkspace = user.workspaces.find(
      item => item.workspaceId === workspace.resourceId
    );

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
    }, [WorkspaceRootNameExistsError.name]);
  });
});
