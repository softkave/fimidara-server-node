import {makeKey} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {
  assignPgListToIdList,
  toAssignedPgListInput,
} from '../../permissionGroups/testUtils';
import {generateAndInsertTestFiles} from '../../testUtils/generate/file';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../workspaces/addWorkspace/utils';
import {PermissionItemInput} from '../types';
import resolveEntityPermissions from './handler';
import {
  ResolveEntityPermissionsEndpointParams,
  ResolvedEntityPermissionItem,
  ResolvedEntityPermissionItemTarget,
} from './types';

// TODO: test container and target appliesTo

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('resolveEntityPermissions', () => {
  test('correct results returned', async () => {
    // TODO: add more tests for target and appliesTo

    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [[pg01, pg02, pg03, pg04, pg05], [file01]] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(/** count */ 5, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertTestFiles(/** count */ 1, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);

    // Allows access to all files
    const pItem01: PermissionItemInput = {
      action: 'readFile',
      target: {targetId: workspace.resourceId},
      access: true,
      entityId: pg01.resourceId,
    };

    // Allows access to a single file
    const pItem02: PermissionItemInput = {
      action: 'readFile',
      target: {targetId: file01.resourceId},
      access: true,
      entityId: pg02.resourceId,
    };

    // Denies access to all files
    const pItem03: PermissionItemInput = {
      action: 'readFile',
      target: {targetId: workspace.resourceId},
      access: false,
      entityId: pg03.resourceId,
    };
    await insertPermissionItemsForTest(userToken, workspace.resourceId, [
      pItem01,
      pItem02,
      pItem03,
    ]);

    // Assign pg01 to another to grant it it's permissions
    const sessionAgent = makeUserSessionAgent(rawUser, userToken);
    await assignPgListToIdList(
      sessionAgent,
      workspace.resourceId,
      [pg04.resourceId],
      toAssignedPgListInput([pg01])
    );

    // Test
    const reqData =
      RequestData.fromExpressRequest<ResolveEntityPermissionsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          items: [
            {
              action: 'readFile',
              target: {targetId: workspace.resourceId},
              entityId: [
                pg01.resourceId,
                pg02.resourceId,
                pg03.resourceId,
                pg04.resourceId,
                pg05.resourceId,
              ],
            },
            {
              action: 'readFile',
              target: {targetId: file01.resourceId},
              entityId: [pg02.resourceId, pg04.resourceId],
            },
          ],
        }
      );
    const result = await resolveEntityPermissions(reqData);
    assertEndpointResultOk(result);

    const expected = [
      indexResolvedPermissions({
        entityId: pg01.resourceId,
        action: 'readFile',
        access: true,
        target: {targetId: workspace.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg02.resourceId,
        action: 'readFile',
        access: true,
        target: {targetId: file01.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg03.resourceId,
        action: 'readFile',
        access: false,
        target: {targetId: workspace.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg02.resourceId,
        action: 'readFile',
        access: false,
        target: {targetId: workspace.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg04.resourceId,
        action: 'readFile',
        access: true,
        target: {targetId: workspace.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg05.resourceId,
        action: 'readFile',
        access: false,
        target: {targetId: workspace.resourceId},
      }),
      indexResolvedPermissions({
        entityId: pg04.resourceId,
        action: 'readFile',
        access: true,
        target: {targetId: file01.resourceId},
      }),
    ];

    const resolved = result.items.map(indexResolvedPermissions);
    expected.forEach(nextExpected => expect(resolved).toContain(nextExpected));
    expect(result.items.length).toBe(expected.length);
  });

  test('combination of wildcard and appliesTo', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder} = await insertFolderForTest(userToken, workspace);
    const adminPg = await kSemanticModels.permissionGroup().assertGetOneByQuery({
      name: DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
      workspaceId: workspace.resourceId,
    });

    const reqData =
      RequestData.fromExpressRequest<ResolveEntityPermissionsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          items: [
            {
              action: 'readFolder',
              target: {targetId: folder.resourceId},
              entityId: [adminPg.resourceId],
            },
          ],
        }
      );
    const result = await resolveEntityPermissions(reqData);
    assertEndpointResultOk(result);

    const expected = [
      indexResolvedPermissions({
        entityId: adminPg.resourceId,
        action: 'readFolder',
        access: true,
        target: {targetId: folder.resourceId},
      }),
    ];
    const resolved = result.items.map(indexResolvedPermissions);
    expected.forEach(nextExpected => expect(resolved).toContain(nextExpected));
  });
});

function indexResolvedPermissions(item: ResolvedEntityPermissionItem) {
  return makeKey([
    item.entityId,
    indexResolvedPermissionItemTarget(item.target),
    item.action,
    item.access,
  ]);
}

function indexResolvedPermissionItemTarget(item: ResolvedEntityPermissionItemTarget) {
  const targetIdentifier =
    item.filepath || item.folderpath || item.targetId || item.workspaceRootname;
  return targetIdentifier;
}
