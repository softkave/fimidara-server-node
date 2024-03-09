import {faker} from '@faker-js/faker';
import {flatten} from 'lodash';
import {File} from '../../../definitions/file';
import {Folder} from '../../../definitions/folder';
import {PermissionAction, kPermissionsMap} from '../../../definitions/permissionItem';
import {Resource, kFimidaraResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {collaboratorExtractor} from '../../collaborators/utils';
import {stringifyFilenamepath} from '../../files/utils';
import {stringifyFoldernamepath} from '../../folders/utils';
import {generateAndInsertTestFiles} from '../../testUtils/generate/file';
import {generateAndInsertTestFolders} from '../../testUtils/generate/folder';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
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

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getResources', () => {
  test('resources returned', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{permissionGroup}, folders, files] = await Promise.all([
      insertPermissionGroupForTest(userToken, workspace.resourceId),
      generateAndInsertTestFolders(2, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(2, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const itemsList = await Promise.all(
      Object.values(kPermissionsMap).map(action =>
        generateAndInsertPermissionItemListForTest(1, {
          action,
          access: faker.datatype.boolean(),
          targetId: workspace.resourceId,
          targetType: kFimidaraResourceType.Workspace,
          workspaceId: workspace.resourceId,
          entityId: permissionGroup.resourceId,
        })
      )
    );
    const items = flatten(itemsList);
    const resourcesInput: FetchResourceItem[] = [];
    const resourcesMap: Record<string, unknown> = {};
    const filepathsMap: Record<string, string> = {};

    const addToExpectedResourcesById = (
      item: Pick<Resource, 'resourceId'>,
      action: PermissionAction
    ) => {
      resourcesInput.push({action, resourceId: item.resourceId});
      resourcesMap[item.resourceId] = item;
    };

    addToExpectedResourcesById(workspace, kPermissionsMap.readWorkspace);
    addToExpectedResourcesById(permissionGroup, kPermissionsMap.updatePermission);
    addToExpectedResourcesById(
      collaboratorExtractor(await populateUserWorkspaces(rawUser), workspace.resourceId),
      kPermissionsMap.readCollaborator
    );
    items.forEach(item =>
      addToExpectedResourcesById(item, kPermissionsMap.updatePermission)
    );
    folders.forEach(folder => {
      const folderpath = stringifyFoldernamepath(folder, workspace.rootname);
      filepathsMap[folderpath] = folder.resourceId;
      resourcesInput.push({folderpath, action: kPermissionsMap.readFolder});
      resourcesMap[folder.resourceId] = folder;
    });
    files.forEach(file => {
      const filepath = stringifyFilenamepath(file, workspace.rootname);
      filepathsMap[filepath] = file.resourceId;
      resourcesInput.push({filepath, action: kPermissionsMap.readFolder});
      resourcesMap[file.resourceId] = file;
    });

    const instData = RequestData.fromExpressRequest<GetResourcesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, resources: resourcesInput}
    );
    const result = await getResources(instData);

    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);
    result.resources.forEach(resource => {
      expect(resourcesMap[resource.resourceId]).toMatchObject(resource.resource);

      if (resource.resourceType === kFimidaraResourceType.File) {
        const fileId =
          filepathsMap[
            stringifyFilenamepath(
              resource.resource as unknown as File,
              workspace.rootname
            )
          ];
        expect(resourcesMap[fileId]).toMatchObject(resource.resource);
      } else if (resource.resourceType === kFimidaraResourceType.Folder) {
        const folderId =
          filepathsMap[
            stringifyFoldernamepath(
              resource.resource as unknown as Folder,
              workspace.rootname
            )
          ];
        expect(resourcesMap[folderId]).toMatchObject(resource.resource);
      }
    });
  });
});
