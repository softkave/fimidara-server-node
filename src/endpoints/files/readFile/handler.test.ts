import {UsageRecordCategoryMap} from '../../../definitions/usageRecord';
import {streamToBuffer} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kFolderConstants} from '../../folders/constants';
import {addRootnameToPath} from '../../folders/utils';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {assertFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTest} from '../../testUtils/helpers/test';
import {updateTestWorkspaceUsageLocks} from '../../testUtils/helpers/usageRecord';
import {
  assert,
  assertEndpointResultOk,
  insertFileForTest,
  insertFolderForTest,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {UsageLimitExceededError} from '../../usageRecords/errors';
import {PermissionDeniedError} from '../../users/errors';
import {stringifyFilenamepath} from '../utils';
import readFile from './handler';
import {ReadFileEndpointParams} from './types';
import sharp = require('sharp');
import assert = require('assert');

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('readFile', () => {
  test('file returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);
    await assertFileBodyEqual(file.resourceId, result.stream);
  });

  test('file resized', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(userToken, workspace, {}, 'png', {
      width: startWidth,
      height: startHeight,
    });
    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        filepath: stringifyFilenamepath(file, workspace.rootname),
        imageResize: {
          width: expectedWidth,
          height: expectedHeight,
        },
      }
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);
    const resultBuffer = await streamToBuffer(result.stream);
    assert(resultBuffer);
    const fileMetadata = await sharp(resultBuffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
  });

  test('can read file from public folder', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    // Make public folder
    const {folder} = await insertFolderForTest(userToken, workspace);
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      target: {targetId: folder.resourceId},
      action: 'readFile',
      access: true,
      entityId: workspace.publicPermissionGroupId,
    });
    const {file} = await insertFileForTest(userToken, workspace, {
      filepath: addRootnameToPath(
        folder.namepath
          .concat([generateTestFileName({includeStraySlashes: true})])
          .join(kFolderConstants.separator),
        workspace.rootname
      ),
    });
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);
  });

  test('can read public file', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      target: {targetId: file.resourceId},
      action: 'readFile',
      access: true,
      entityId: workspace.publicPermissionGroupId,
    });
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    const result = await readFile(instData);
    assertEndpointResultOk(result);
  });

  test('cannot read private file', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    let instData: RequestData | null = null;
    try {
      instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
      await readFile(instData);
    } catch (error: any) {
      expect(error?.name).toBe(PermissionDeniedError.name);
    }
  });

  test('file not returned if bandwidth usage is exceeded', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    // Update usage locks
    await updateTestWorkspaceUsageLocks(workspace.resourceId, [
      UsageRecordCategoryMap.BandwidthOut,
    ]);
    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFilenamepath(file, workspace.rootname)}
    );
    await expectErrorThrown(async () => {
      await readFile(reqData);
    }, [UsageLimitExceededError.name]);
  });
});
