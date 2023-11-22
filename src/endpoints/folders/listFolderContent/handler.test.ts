import {AppResourceTypeMap} from '../../../definitions/system';
import {calculatePageSize, getResourceId} from '../../../utils/fns';
import {BaseContextType} from '../../contexts/types';
import addPermissionItems from '../../permissionItems/addItems/handler';
import RequestData from '../../RequestData';
import {
  generateAndInsertTestFiles,
  generateTestFileName,
} from '../../testUtils/generateData/file';
import {
  generateAndInsertTestFolders,
  generateTestFolderName,
} from '../../testUtils/generateData/folder';
import {expectContainsExactly} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {folderConstants} from '../constants';
import {addRootnameToPath, stringifyFolderNamePath} from '../utils';
import listFolderContent from './handler';
import {ListFolderContentEndpointParams} from './types';

/**
 * TODO:
 * - Test root path
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('listFolderContent', () => {
  test('folder content returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {folder: folder01} = await insertFolderForTest(context, userToken, workspace);
    const [{folder: folder02}, {file}] = await Promise.all([
      insertFolderForTest(context, userToken, workspace, {
        folderpath: addRootnameToPath(
          folder01.namePath
            .concat(generateTestFolderName({includeStraySlashes: true}))
            .join(folderConstants.nameSeparator),
          workspace.rootname
        ),
      }),
      insertFileForTest(context, userToken, workspace, {
        filepath: addRootnameToPath(
          folder01.namePath
            .concat(generateTestFileName({includeStraySlashes: true}))
            .join(folderConstants.nameSeparator),
          workspace.rootname
        ),
      }),
    ]);

    const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
    );
    const result = await listFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.folders).toContainEqual(folder02);
    expect(result.files).toContainEqual(file);
  });

  test('root folder content returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{folder: folder02}, {file}] = await Promise.all([
      insertFolderForTest(context, userToken, workspace, {
        folderpath: addRootnameToPath(
          generateTestFolderName({includeStraySlashes: true}),
          workspace.rootname
        ),
      }),
      insertFileForTest(context, userToken, workspace, {
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
    const result = await listFolderContent(context, instData);
    assertEndpointResultOk(result);
    expect(result.folders).toContainEqual(folder02);
    expect(result.files).toContainEqual(file);
  });

  test('content type', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {folder: folder01} = await insertFolderForTest(context, userToken, workspace);
    const {folder: folder02} = await insertFolderForTest(context, userToken, workspace, {
      folderpath: addRootnameToPath(
        folder01.namePath
          .concat(generateTestFolderName({includeStraySlashes: true}))
          .join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });
    const {file} = await insertFileForTest(context, userToken, workspace, {
      filepath: addRootnameToPath(
        folder01.namePath
          .concat(generateTestFileName({includeStraySlashes: true}))
          .join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });

    const fetchFilesReqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderpath: addRootnameToPath(folder01.name, workspace.rootname),
          contentType: AppResourceTypeMap.File,
        }
      );
    const fetchFilesResult = await listFolderContent(context, fetchFilesReqData);
    assertEndpointResultOk(fetchFilesResult);
    expect(fetchFilesResult.files).toContainEqual(file);

    const fetchFoldersReqData =
      RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          folderpath: addRootnameToPath(folder01.name, workspace.rootname),
          contentType: AppResourceTypeMap.Folder,
        }
      );
    const fetchFoldersResult = await listFolderContent(context, fetchFoldersReqData);
    assertEndpointResultOk(fetchFoldersResult);
    expect(fetchFoldersResult.folders).toContainEqual(folder02);

    const reqData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
    );
    const result = await listFolderContent(context, reqData);
    assertEndpointResultOk(result);
    expect(fetchFilesResult.files).toContainEqual(file);
    expect(result.folders).toContainEqual(folder02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [foldersPage01, filesPage01] = await Promise.all([
      generateAndInsertTestFolders(context, 10, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(context, 10, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const [foldersPage02, filesPage02] = await Promise.all([
      generateAndInsertTestFolders(context, 5, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(context, 5, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const [foldersCount, filesCount] = await Promise.all([
      context.semantic.folder.countByQuery({
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      context.semantic.file.countByQuery({
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
    const result01 = await listFolderContent(context, instData);
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
    const result02 = await listFolderContent(context, instData);
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
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [[folder01], {token: agToken}] = await Promise.all([
      generateAndInsertTestFolders(context, 1, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      insertAgentTokenForTest(context, userToken, workspace.resourceId),
    ]);
    const [[folder02], [file01]] = await Promise.all([
      generateAndInsertTestFolders(context, 1, {
        workspaceId: workspace.resourceId,
        parentId: folder01.resourceId,
      }),
      generateAndInsertTestFiles(context, 1, {
        workspaceId: workspace.resourceId,
        parentId: folder01.resourceId,
      }),
    ]);
    await addPermissionItems(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        items: [
          {
            target: {targetId: folder02.resourceId},
            action: 'readFolder',
            access: true,
            entityId: [agToken.resourceId],
          },
          {
            target: {targetId: file01.resourceId},
            action: 'readFile',
            access: true,
            entityId: [agToken.resourceId],
          },
        ],
      })
    );

    const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestWithAgentToken(agToken),
      {folderpath: stringifyFolderNamePath(folder01, workspace.rootname)}
    );
    const result01 = await listFolderContent(context, instData);

    assertEndpointResultOk(result01);
    expectContainsExactly(result01.folders, [folder02], getResourceId);
    expectContainsExactly(result01.files, [file01], getResourceId);
  });
});
