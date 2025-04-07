import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {getResourceId, pathJoin} from '../../../utils/fns.js';
import addPermissionItems from '../../permissionItems/addItems/handler.js';
import {AddPermissionItemsEndpointParams} from '../../permissionItems/addItems/types.js';
import RequestData from '../../RequestData.js';
import {
  generateAndInsertTestFiles,
  generateTestFileName,
} from '../../testHelpers/generate/file.js';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
} from '../../testHelpers/generate/folder.js';
import {expectContainsExactly} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {addRootnameToPath, stringifyFolderpath} from '../utils.js';
import listFolderContent from './handler.js';
import {ListFolderContentEndpointParams} from './types.js';

/**
 * TODO:
 * - Test root path
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('listFolderContent', () => {
  test('folder content returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder: folder01} = await insertFolderForTest(userToken, workspace);
    const [{folder: folder02}, {file}] = await Promise.all([
      insertFolderForTest(userToken, workspace, {
        folderpath: addRootnameToPath(
          pathJoin(
            folder01.namepath.concat(
              generateTestFolderName({includeStraySeparators: true})
            )
          ),
          workspace.rootname
        ),
      }),
      insertFileForTest(userToken, workspace, {
        filepath: addRootnameToPath(
          pathJoin(
            folder01.namepath.concat(
              generateTestFileName({includeStraySlashes: true})
            )
          ),
          workspace.rootname
        ),
      }),
    ]);

    const reqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
      );
    const result = await listFolderContent(reqData);
    assertEndpointResultOk(result);

    const rFolder2 = result.folders.find(
      f => f.resourceId === folder02.resourceId
    );
    expect(rFolder2).toBeDefined();
    expect(rFolder2).toMatchObject(folder02);

    const rFile = result.files.find(f => f.resourceId === file.resourceId);
    expect(rFile).toBeDefined();
    expect(rFile).toMatchObject(file);
  });

  test('root folder content returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [{folder: folder02}, {file}] = await Promise.all([
      insertFolderForTest(userToken, workspace, {
        folderpath: addRootnameToPath(
          generateTestFolderName({includeStraySeparators: true}),
          workspace.rootname
        ),
      }),
      insertFileForTest(userToken, workspace, {
        filepath: addRootnameToPath(
          generateTestFileName({includeStraySlashes: true}),
          workspace.rootname
        ),
      }),
    ]);

    const reqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {folderpath: workspace.rootname}
      );
    const result = await listFolderContent(reqData);
    assertEndpointResultOk(result);

    const rFolder2 = result.folders.find(
      f => f.resourceId === folder02.resourceId
    );
    expect(rFolder2).toBeDefined();
    expect(rFolder2).toMatchObject(folder02);

    const rFile = result.files.find(f => f.resourceId === file.resourceId);
    expect(rFile).toBeDefined();
    expect(rFile).toMatchObject(file);
  });

  test('content type', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder: folder01} = await insertFolderForTest(userToken, workspace);
    const {folder: folder02} = await insertFolderForTest(userToken, workspace, {
      folderpath: addRootnameToPath(
        pathJoin(
          folder01.namepath.concat(
            generateTestFolderName({includeStraySeparators: true})
          )
        ),
        workspace.rootname
      ),
    });
    const {file} = await insertFileForTest(userToken, workspace, {
      filepath: addRootnameToPath(
        pathJoin(
          folder01.namepath.concat(
            generateTestFileName({includeStraySlashes: true})
          )
        ),
        workspace.rootname
      ),
    });

    const fetchFilesReqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderpath: addRootnameToPath(folder01.name, workspace.rootname),
          contentType: kFimidaraResourceType.File,
        }
      );
    const fetchFilesResult = await listFolderContent(fetchFilesReqData);
    assertEndpointResultOk(fetchFilesResult);
    expect(fetchFilesResult.files).toContainEqual(file);

    const fetchFoldersReqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderpath: addRootnameToPath(folder01.name, workspace.rootname),
          contentType: kFimidaraResourceType.Folder,
        }
      );
    const fetchFoldersResult = await listFolderContent(fetchFoldersReqData);
    assertEndpointResultOk(fetchFoldersResult);

    let rFolder2 = fetchFoldersResult.folders.find(
      f => f.resourceId === folder02.resourceId
    );
    expect(rFolder2).toBeDefined();
    expect(rFolder2).toMatchObject(folder02);

    const reqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
      );
    const result = await listFolderContent(reqData);
    assertEndpointResultOk(result);

    const rFile = fetchFilesResult.files.find(
      f => f.resourceId === file.resourceId
    );
    expect(rFile).toBeDefined();
    expect(rFile).toMatchObject(file);

    rFolder2 = result.folders.find(f => f.resourceId === folder02.resourceId);
    expect(rFolder2).toBeDefined();
    expect(rFolder2).toMatchObject(folder02);
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [foldersPage01, filesPage01] = await Promise.all([
      generateAndInsertTestFolders(10, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(10, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const [foldersPage02, filesPage02] = await Promise.all([
      generateAndInsertTestFolders(5, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(5, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const [foldersCount, filesCount] = await Promise.all([
      kIjxSemantic.folder().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      kIjxSemantic.file().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    expect(foldersCount).toBe(foldersPage01.length + foldersPage02.length);
    expect(filesCount).toBe(filesPage01.length + filesPage02.length);

    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, folderpath: workspace.rootname}
      );
    const result01 = await listFolderContent(reqData);
    assertEndpointResultOk(result01);
    expect(result01.page).toBe(page);
    expect(result01.folders).toHaveLength(
      calculatePageSize(foldersCount, pageSize, page)
    );
    expect(result01.files).toHaveLength(
      calculatePageSize(filesCount, pageSize, page)
    );
    // const resultFolders01Ids = extractResourceIdList(result01.folders);
    // const resultFiles01Ids = extractResourceIdList(result01.files);
    expectContainsExactly(result01.folders, foldersPage01, getResourceId);
    expectContainsExactly(result01.files, filesPage01, getResourceId);

    page = 1;
    reqData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, folderpath: workspace.rootname}
    );
    const result02 = await listFolderContent(reqData);
    assertEndpointResultOk(result02);
    expect(result02.page).toBe(page);
    expect(result02.folders).toHaveLength(
      calculatePageSize(foldersCount, pageSize, page)
    );
    expect(result02.files).toHaveLength(
      calculatePageSize(filesCount, pageSize, page)
    );
    // const resultFolders02Ids = extractResourceIdList(result01.folders);
    // const resultFiles02Ids = extractResourceIdList(result01.files);
    expectContainsExactly(result02.folders, foldersPage02, getResourceId);
    expectContainsExactly(result02.files, filesPage02, getResourceId);
  });

  test('permitted to read selected resources', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [[folder01], {token: agToken}] = await Promise.all([
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      insertAgentTokenForTest(userToken, workspace.resourceId),
    ]);
    const [[folder02], [file01]] = await Promise.all([
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: workspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await addPermissionItems(
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          items: [
            {
              targetId: folder02.resourceId,
              action: kFimidaraPermissionActions.readFolder,
              access: true,
              entityId: [agToken.resourceId],
            },
            {
              targetId: file01.resourceId,
              action: kFimidaraPermissionActions.readFile,
              access: true,
              entityId: [agToken.resourceId],
            },
          ],
        }
      )
    );

    const reqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(agToken),
        {folderpath: stringifyFolderpath(folder01, workspace.rootname)}
      );
    const result01 = await listFolderContent(reqData);

    assertEndpointResultOk(result01);
    expectContainsExactly(result01.folders, [folder02], getResourceId);
    expectContainsExactly(result01.files, [file01], getResourceId);
  });
});
