import {Promise} from 'mongoose';
import RequestData from '../../RequestData';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {completeTests} from '../../testUtils/helpers/test';
import {
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {getFilepathInfo, stringifyFilenamepath} from '../utils';
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

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('uploadFile', () => {
  test('file uploaded', async () => {
    await uploadFileBaseTest();
  });

  test('file updated when new data uploaded', async () => {
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      /** seed */ {},
      /** type */ 'png'
    );
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFilenamepath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };

    const {savedFile: updatedFile} = await uploadFileBaseTest(
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const agent = await kUtilsInjectables
      .session()
      .getAgent(
        RequestData.fromExpressRequest(
          mockExpressRequestWithAgentToken(insertUserResult.userToken)
        )
      );
    expect(savedFile.resourceId).toBe(updatedFile.resourceId);
    expect(savedFile.name).toBe(updatedFile.name);
    expect(savedFile.extension).toBe(updatedFile.extension);
    expect(savedFile.idPath).toEqual(expect.arrayContaining(updatedFile.idPath));
    expect(savedFile.namepath).toEqual(expect.arrayContaining(updatedFile.namepath));
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
    const {savedFile, insertUserResult, insertWorkspaceResult} =
      await uploadFileBaseTest();
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFilenamepath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
    };
    await uploadFileBaseTest(
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const files = await kSemanticModels.file().getManyByQuery({
      workspaceId: savedFile.workspaceId,
      extension: savedFile.extension,
      namepath: {$all: savedFile.namepath, $size: savedFile.namepath.length},
    });
    expect(files.length).toBe(1);
  });

  test('file versioned correctly', async () => {
    const result01 = await uploadFileBaseTest(/** seeed */ {}, 'png');
    const {insertUserResult, insertWorkspaceResult} = result01;
    let {savedFile} = result01;

    expect(savedFile.version).toBe(1);

    ({savedFile} = await uploadFileBaseTest(
      /** seed */ {},
      'png',
      insertUserResult,
      insertWorkspaceResult
    ));

    expect(savedFile.version).toBe(2);

    const dbFile = await kSemanticModels.file().getOneById(savedFile.resourceId);
    expect(dbFile?.version).toBe(2);
  });

  test('files with same name but diff ext are separate', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
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
      insertFileForTest(userToken, workspace, {filepath: filepath01}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath02}, 'txt'),
      insertFileForTest(userToken, workspace, {filepath: filepath03}, 'txt'),
    ]);

    const pathinfo01 = getFilepathInfo(filepath01);
    const pathinfo02 = getFilepathInfo(filepath02);
    const pathinfo03 = getFilepathInfo(filepath03);
    const [dbFile01, dbFile02, dbFile03] = await Promise.all([
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo01.filepathExcludingExt,
        extension: pathinfo01.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo02.filepathExcludingExt,
        extension: pathinfo02.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo03.filepathExcludingExt,
        extension: pathinfo03.extension,
      }),
    ]);

    expect(dbFile01).toBeTruthy();
    expect(dbFile02).toBeTruthy();
    expect(dbFile03).toBeTruthy();
    expect(dbFile01.resourceId).not.toBe(dbFile02.resourceId);
    expect(dbFile01.resourceId).not.toBe(dbFile03.resourceId);
    expect(dbFile02.resourceId).not.toBe(dbFile03.resourceId);

    // Replace file to confirm only the file with that extension is updated
    await insertFileForTest(userToken, workspace, {filepath: filepath01}, 'txt');

    const [latestDbFile01, latestDbFile02, latestDbFile03] = await Promise.all([
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo01.filepathExcludingExt,
        extension: pathinfo01.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo02.filepathExcludingExt,
        extension: pathinfo02.extension,
      }),
      kSemanticModels.file().getOneByNamepath({
        workspaceId: workspace.resourceId,
        namepath: pathinfo03.filepathExcludingExt,
        extension: pathinfo03.extension,
      }),
    ]);

    expect(latestDbFile01.lastUpdatedAt).not.toBe(dbFile01.lastUpdatedAt);
    expect(latestDbFile02.lastUpdatedAt).toBe(dbFile02.lastUpdatedAt);
    expect(latestDbFile03.lastUpdatedAt).toBe(dbFile03.lastUpdatedAt);
  });
});
