import {Promise} from 'mongoose';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {getFilepathInfo, stringifyFileNamePath} from '../utils';
import {UploadFileEndpointParams} from './types';
import {uploadFileBaseTest} from './uploadFileTestUtils';

/**
 * TODO:
 * - test multiple files with the same path but different extensions
 * - stale versions removed
 * - sets correct size
 * - marks file not write available
 * - fails if file is not write available
 * - file versioned correctly
 * - read is not available if file is new
 * - read is available if file is existing
 * - reads new file after upload / head points to right file
 * - file recovers on error / file is marked write available on error
 */

let context: BaseContextType | null = null;

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('uploadFile', () => {
  test('file uploaded', async () => {
    assertContext(context);
    await uploadFileBaseTest(context);
  });

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      context,
      /** seed */ {},
      /** type */ 'png'
    );
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };

    const {savedFile: updatedFile} = await uploadFileBaseTest(
      context,
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const agent = await context.session.getAgent(
      context,
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(insertUserResult.userToken)
      )
    );
    expect(savedFile.resourceId).toBe(updatedFile.resourceId);
    expect(savedFile.name).toBe(updatedFile.name);
    expect(savedFile.extension).toBe(updatedFile.extension);
    expect(savedFile.idPath).toEqual(expect.arrayContaining(updatedFile.idPath));
    expect(savedFile.namePath).toEqual(expect.arrayContaining(updatedFile.namePath));
    expect(savedFile.description).not.toBe(updatedFile.description);
    expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
    expect(savedFile.size).not.toBe(updatedFile.size);
    expect(savedFile.encoding).not.toBe(updatedFile.encoding);
    expect(updatedFile.lastUpdatedAt).toBeTruthy();
    expect(updatedFile.lastUpdatedBy).toMatchObject({
      agentId: agent.agentId,
      agentType: agent.agentType,
    });
  });

  test('file not duplicated', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      context
    );
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };
    await uploadFileBaseTest(
      context,
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const files = await context.semantic.file.getManyByQuery({
      workspaceId: savedFile.workspaceId,
      extension: savedFile.extension,
      namePath: {$all: savedFile.namePath, $size: savedFile.namePath.length},
    });
    expect(files.length).toBe(1);
  });

  test('file versioned correctly', async () => {
    assertContext(context);

    const result01 = await uploadFileBaseTest(context, /** seeed */ {}, 'png');
    const {insertUserResult, insertWorkspaceResult} = result01;
    let {savedFile} = result01;

    expect(savedFile.version).toBe(1);

    ({savedFile} = await uploadFileBaseTest(
      context,
      /** seed */ {},
      'png',
      insertUserResult,
      insertWorkspaceResult
    ));

    expect(savedFile.version).toBe(2);

    const dbFile = await context.semantic.file.getOneById(savedFile.resourceId);
    expect(dbFile?.version).toBe(2);
  });

  test('files with same name but diff ext are separate', async () => {
    assertContext(context);

    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const filepath01 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt01',
    });
    const filepath02 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt02',
    });
    const filepath03 = generateTestFileName({
      rootname: workspace.rootname,
      extension: 'txt03',
    });

    await Promise.all([
      insertFileForTest(context, userToken, workspace, {filepath: filepath01}, 'txt'),
      insertFileForTest(context, userToken, workspace, {filepath: filepath02}, 'txt'),
      insertFileForTest(context, userToken, workspace, {filepath: filepath03}, 'txt'),
    ]);

    const pathinfo01 = getFilepathInfo(filepath01);
    const pathinfo02 = getFilepathInfo(filepath02);
    const pathinfo03 = getFilepathInfo(filepath03);
    const [dbFile01, dbFile02, dbFile03] = await Promise.all([
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo01.filepathExcludingExt,
        pathinfo01.extension
      ),
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo02.filepathExcludingExt,
        pathinfo02.extension
      ),
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo03.filepathExcludingExt,
        pathinfo03.extension
      ),
    ]);

    expect(dbFile01).toBeTruthy();
    expect(dbFile02).toBeTruthy();
    expect(dbFile03).toBeTruthy();
    expect(dbFile01.resourceId).not.toBe(dbFile02.resourceId);
    expect(dbFile01.resourceId).not.toBe(dbFile03.resourceId);
    expect(dbFile02.resourceId).not.toBe(dbFile03.resourceId);

    // Replace file to confirm only the file with that extension is updated
    await insertFileForTest(context, userToken, workspace, {filepath: filepath01}, 'txt');

    const [latestDbFile01, latestDbFile02, latestDbFile03] = await Promise.all([
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo01.filepathExcludingExt,
        pathinfo01.extension
      ),
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo02.filepathExcludingExt,
        pathinfo02.extension
      ),
      context.semantic.file.getOneByNamePath(
        workspace.resourceId,
        pathinfo03.filepathExcludingExt,
        pathinfo03.extension
      ),
    ]);

    expect(latestDbFile01.lastUpdatedAt).not.toBe(dbFile01.lastUpdatedAt);
    expect(latestDbFile02.lastUpdatedAt).toBe(dbFile02.lastUpdatedAt);
    expect(latestDbFile03.lastUpdatedAt).toBe(dbFile03.lastUpdatedAt);
  });
});
