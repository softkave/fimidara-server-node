import {faker} from '@faker-js/faker';
import {flatten} from 'lodash';
import {File} from '../../../definitions/file';
import {PermissionAction, kPermissionsMap} from '../../../definitions/permissionItem';
import {AppResourceTypeMap, Resource} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {BaseContextType} from '../../contexts/types';
import {stringifyFilenamepath} from '../../files/utils';
import {stringifyFoldernamepath} from '../../folders/utils';
import {generateAndInsertTestFiles} from '../../testUtils/generateData/file';
import {generateAndInsertTestFolders} from '../../testUtils/generateData/folder';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {FetchResourceItem} from '../types';
import getResources from './handler';
import {GetResourcesEndpointParams} from './types';

/**
 * TODO:
 * - test resources that the agent doesn't have read permission to
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getResources', () => {
  test('resources returned', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{permissionGroup}, folders, files] = await Promise.all([
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      generateAndInsertTestFolders(context, 2, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(context, 2, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const itemsList = await Promise.all(
      Object.values(kPermissionsMap).map(action =>
        generateAndInsertPermissionItemListForTest(context!, 1, {
          action: action,
          access: faker.datatype.boolean(),
          targetId: workspace.resourceId,
          targetType: AppResourceTypeMap.Workspace,
          workspaceId: workspace.resourceId,
          entityId: permissionGroup.resourceId,
        })
      )
    );
    const items = flatten(itemsList);
    const resourcesInput: FetchResourceItem[] = [];
    const resourcesMap: Record<string, any> = {};
    const filepathsMap: Record<string, string> = {};

    const addToExpectedResourcesById = (
      item: Pick<Resource, 'resourceId'>,
      action: PermissionAction
    ) => {
      resourcesInput.push({action, resourceId: item.resourceId});
      resourcesMap[item.resourceId] = item;
    };

    addToExpectedResourcesById(workspace, 'readWorkspace');
    addToExpectedResourcesById(permissionGroup, 'updatePermission');
    addToExpectedResourcesById(
      collaboratorExtractor(
        await populateUserWorkspaces(context, rawUser),
        workspace.resourceId
      ),
      'readCollaborator'
    );
    items.forEach(item => addToExpectedResourcesById(item, 'updatePermission'));
    folders.forEach(folder => {
      const folderpath = stringifyFoldernamepath(folder);
      filepathsMap[folderpath] = folder.resourceId;
      resourcesInput.push({folderpath, action: 'readFolder'});
      resourcesMap[folder.resourceId] = folder;
    });
    files.forEach(file => {
      const filepath = stringifyFilenamepath(file);
      filepathsMap[filepath] = file.resourceId;
      resourcesInput.push({filepath, action: 'readFolder'});
      resourcesMap[file.resourceId] = file;
    });

    const instData = RequestData.fromExpressRequest<GetResourcesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, resources: resourcesInput}
    );
    const result = await getResources(context, instData);

    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);
    result.resources.forEach(resource => {
      expect(resourcesMap[resource.resourceId]).toMatchObject(resource.resource);

      if (resource.resourceType === 'file') {
        const fileId =
          filepathsMap[stringifyFilenamepath(resource.resource as unknown as File)];
        expect(resourcesMap[fileId]).toMatchObject(resource.resource);
      } else if (resource.resourceType === 'folder') {
        const folderId =
          filepathsMap[stringifyFoldernamepath(resource.resource as unknown as File)];
        expect(resourcesMap[folderId]).toMatchObject(resource.resource);
      }
    });
  });
});
