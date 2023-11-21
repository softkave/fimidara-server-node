import {streamToBuffer} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {folderConstants} from '../../folders/constants';
import {addRootnameToPath} from '../../folders/utils';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {assertFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTest} from '../../testUtils/helpers/test';
import {updateTestWorkspaceUsageLocks} from '../../testUtils/helpers/usageRecord';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
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
import {stringifyFileNamePath} from '../utils';
import readFile from './handler';
import {ReadFileEndpointParams} from './types';
import sharp = require('sharp');
import assert = require('assert');
import {UsageRecordCategoryMap} from '../../../definitions/usageRecord';

let context: BaseContextType | null = null;

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('readFile', () => {
  test('file returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFileNamePath(file, workspace.rootname)}
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
    await assertFileBodyEqual(context, file.resourceId, result.stream);
  });

  test('file resized', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(context, userToken, workspace, {}, 'png', {
      width: startWidth,
      height: startHeight,
    });
    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        filepath: stringifyFileNamePath(file, workspace.rootname),
        imageResize: {
          width: expectedWidth,
          height: expectedHeight,
        },
      }
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
    const resultBuffer = await streamToBuffer(result.stream);
    assert(resultBuffer);
    const fileMetadata = await sharp(resultBuffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
  });

  test('can read file from public folder', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);

    // Make public folder
    const {folder} = await insertFolderForTest(context, userToken, workspace);
    await insertPermissionItemsForTest(context, userToken, workspace.resourceId, {
      target: {targetId: folder.resourceId},
      action: 'readFile',
      access: true,
      entityId: workspace.publicPermissionGroupId,
    });
    const {file} = await insertFileForTest(context, userToken, workspace, {
      filepath: addRootnameToPath(
        folder.namePath
          .concat([generateTestFileName({includeStraySlashes: true})])
          .join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: stringifyFileNamePath(file, workspace.rootname)}
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
  });

  test('can read public file', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    await insertPermissionItemsForTest(context, userToken, workspace.resourceId, {
      target: {targetId: file.resourceId},
      action: 'readFile',
      access: true,
      entityId: workspace.publicPermissionGroupId,
    });
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: stringifyFileNamePath(file, workspace.rootname)}
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
  });

  test('cannot read private file', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    let instData: RequestData | null = null;
    try {
      instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {filepath: stringifyFileNamePath(file, workspace.rootname)}
      );
      await readFile(context, instData);
    } catch (error: any) {
      expect(error?.name).toBe(PermissionDeniedError.name);
    }
  });

  test('file not returned if bandwidth usage is exceeded', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    // Update usage locks
    await updateTestWorkspaceUsageLocks(context, workspace.resourceId, [
      UsageRecordCategoryMap.BandwidthOut,
    ]);
    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: stringifyFileNamePath(file, workspace.rootname)}
    );
    await expectErrorThrown(async () => {
      assertContext(context);
      await readFile(context, reqData);
    }, [UsageLimitExceededError.name]);
  });
});
