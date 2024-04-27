import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {kFimidaraResourceType} from '../../../definitions/system';
import {calculatePageSize, getResourceId, pathJoin} from '../../../utils/fns';
import {kSemanticModels} from '../../contexts/injection/injectables';
import addPermissionItems from '../../permissionItems/addItems/handler';
import RequestData from '../../RequestData';
import {
  generateAndInsertTestFiles,
  generateTestFileName,
} from '../../testUtils/generate/file';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
} from '../../testUtils/generate/folder';
import {expectContainsExactly} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {addRootnameToPath, stringifyFoldernamepath} from '../utils';
import listFolderContent from './handler';
import {ListFolderContentEndpointParams} from './types';

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
            folder01.namepath.concat(generateTestFileName({includeStraySlashes: true}))
          ),
          workspace.rootname
        ),
      }),
    ]);

    const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
    );
    const result = await listFolderContent(instData);
    assertEndpointResultOk(result);
    expect(result.folders).toContainEqual(folder02);
    expect(result.files).toContainEqual(file);
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

    const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: workspace.rootname}
    );
    const result = await listFolderContent(instData);
    assertEndpointResultOk(result);
    expect(result.folders).toContainEqual(folder02);
    expect(result.files).toContainEqual(file);
  });

  test('content type', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder: folder01} = await insertFolderForTest(userToken, workspace);
    const {folder: folder02} = await insertFolderForTest(userToken, workspace, {
      folderpath: addRootnameToPath(
        pathJoin(
          folder01.namepath.concat(generateTestFolderName({includeStraySeparators: true}))
        ),
        workspace.rootname
      ),
    });
    const {file} = await insertFileForTest(userToken, workspace, {
      filepath: addRootnameToPath(
        pathJoin(
          folder01.namepath.concat(generateTestFileName({includeStraySlashes: true}))
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
    expect(fetchFoldersResult.folders).toContainEqual(folder02);

    const reqData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
    );
    const result = await listFolderContent(reqData);
    assertEndpointResultOk(result);
    expect(fetchFilesResult.files).toContainEqual(file);
    expect(result.folders).toContainEqual(folder02);
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
      kSemanticModels.folder().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      kSemanticModels.file().countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    expect(foldersCount).toBe(foldersPage01.length + foldersPage02.length);
    expect(filesCount).toBe(filesPage01.length + filesPage02.length);

    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, folderpath: workspace.rootname}
    );
    const result01 = await listFolderContent(instData);
    assertEndpointResultOk(result01);
    expect(result01.page).toBe(page);
    expect(result01.folders).toHaveLength(
      calculatePageSize(foldersCount, pageSize, page)
    );
    expect(result01.files).toHaveLength(calculatePageSize(filesCount, pageSize, page));
    // const resultFolders01Ids = extractResourceIdList(result01.folders);
    // const resultFiles01Ids = extractResourceIdList(result01.files);
    expectContainsExactly(result01.folders, foldersPage01, getResourceId);
    expectContainsExactly(result01.files, filesPage01, getResourceId);

    page = 1;
    instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, folderpath: workspace.rootname}
    );
    const result02 = await listFolderContent(instData);
    assertEndpointResultOk(result02);
    expect(result02.page).toBe(page);
    expect(result02.folders).toHaveLength(
      calculatePageSize(foldersCount, pageSize, page)
    );
    expect(result02.files).toHaveLength(calculatePageSize(filesCount, pageSize, page));
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
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        items: [
          {
            target: {targetId: folder02.resourceId},
            action: kFimidaraPermissionActionsMap.readFolder,
            access: true,
            entityId: [agToken.resourceId],
          },
          {
            target: {targetId: file01.resourceId},
            action: kFimidaraPermissionActionsMap.readFile,
            access: true,
            entityId: [agToken.resourceId],
          },
        ],
      })
    );

    const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(agToken),
      {folderpath: stringifyFoldernamepath(folder01, workspace.rootname)}
    );
    const result01 = await listFolderContent(instData);

    assertEndpointResultOk(result01);
    expectContainsExactly(result01.folders, [folder02], getResourceId);
    expectContainsExactly(result01.files, [file01], getResourceId);
  });
});
