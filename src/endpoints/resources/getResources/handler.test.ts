import {faker} from '@faker-js/faker';
import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {File} from '../../../definitions/file.js';
import {Folder} from '../../../definitions/folder.js';
import {
  FimidaraPermissionAction,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {Resource, kFimidaraResourceType} from '../../../definitions/system.js';
import RequestData from '../../RequestData.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {collaboratorExtractor} from '../../collaborators/utils.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {stringifyFolderpath} from '../../folders/utils.js';
import {generateAndInsertTestFiles} from '../../testHelpers/generate/file.js';
import {generateAndInsertTestFolders} from '../../testHelpers/generate/folder.js';
import {generateAndInsertPermissionItemListForTest} from '../../testHelpers/generate/permissionItem.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {FetchResourceItem} from '../types.js';
import getResources from './handler.js';
import {GetResourcesEndpointParams} from './types.js';

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
      Object.values(kFimidaraPermissionActions).map(action =>
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
      action: FimidaraPermissionAction
    ) => {
      resourcesInput.push({action, resourceId: item.resourceId});
      resourcesMap[item.resourceId] = item;
    };

    addToExpectedResourcesById(
      workspace,
      kFimidaraPermissionActions.readWorkspace
    );
    addToExpectedResourcesById(
      permissionGroup,
      kFimidaraPermissionActions.updatePermission
    );
    addToExpectedResourcesById(
      collaboratorExtractor(
        await populateUserWorkspaces(rawUser),
        workspace.resourceId
      ),
      kFimidaraPermissionActions.readCollaborator
    );
    items.forEach(item =>
      addToExpectedResourcesById(
        item,
        kFimidaraPermissionActions.updatePermission
      )
    );
    folders.forEach(folder => {
      const folderpath = stringifyFolderpath(folder, workspace.rootname);
      filepathsMap[folderpath] = folder.resourceId;
      resourcesInput.push({
        folderpath,
        action: kFimidaraPermissionActions.readFolder,
      });
      resourcesMap[folder.resourceId] = folder;
    });
    files.forEach(file => {
      const filepath = stringifyFilenamepath(file, workspace.rootname);
      filepathsMap[filepath] = file.resourceId;
      resourcesInput.push({
        filepath,
        action: kFimidaraPermissionActions.readFolder,
      });
      resourcesMap[file.resourceId] = file;
    });

    const reqData = RequestData.fromExpressRequest<GetResourcesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, resources: resourcesInput}
    );
    const result = await getResources(reqData);

    assertEndpointResultOk(result);
    expect(result.resources).toHaveLength(resourcesInput.length);
    result.resources.forEach(resource => {
      expect(resourcesMap[resource.resourceId]).toMatchObject(
        resource.resource
      );

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
            stringifyFolderpath(
              resource.resource as unknown as Folder,
              workspace.rootname
            )
          ];
        expect(resourcesMap[folderId]).toMatchObject(resource.resource);
      }
    });
  });
});
