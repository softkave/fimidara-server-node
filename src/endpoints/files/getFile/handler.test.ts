import assert = require('assert');
import {faker} from '@faker-js/faker';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IBaseContext} from '../../contexts/BaseContext';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
import {folderConstants} from '../../folders/constants';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {waitForRequestPendingJobs} from '../../test-utils/helpers/reqData';
import {updateTestWorkspaceUsageLocks} from '../../test-utils/helpers/usageRecord';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {UsageLimitExceededError} from '../../usageRecords/errors';
import {PermissionDeniedError} from '../../user/errors';
import {UploadFilePublicAccessActions} from '../uploadFile/types';
import getFile from './handler';
import {IGetFileEndpointParams} from './types';
import sharp = require('sharp');

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('getFile', () => {
  test('file returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        filepath: file.name,
      }
    );

    const result = await getFile(context, instData);
    assertEndpointResultOk(result);
    const savedFile = await context.fileBackend.getFile({
      bucket: context.appVariables.S3Bucket,
      key: file.resourceId,
    });

    const savedBuffer =
      savedFile.body && (await getBodyFromStream(savedFile.body));
    assert(savedBuffer);
    expect(result.buffer.equals(savedBuffer)).toBe(true);
    await waitForRequestPendingJobs(reqData);
    await waitForRequestPendingJobs(instData);
  });

  test('file resized', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const startWidth = 500;
    const startHeight = 500;
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId,
      {},
      'png',
      {width: startWidth, height: startHeight}
    );

    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        filepath: file.name,
        imageTranformation: {
          width: expectedWidth,
          height: expectedHeight,
        },
      }
    );

    const result = await getFile(context, instData);
    assertEndpointResultOk(result);
    const fileMetadata = await sharp(result.buffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
    await waitForRequestPendingJobs(reqData);
    await waitForRequestPendingJobs(instData);
  });

  test('can read file from public folder', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);

    // Make public folder
    const {folder} = await insertFolderForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        publicAccessOps: [
          {action: BasicCRUDActions.Read, resourceType: AppResourceType.File},
        ],
      }
    );

    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId,
      {
        filepath: folder.namePath
          .concat([faker.lorem.word()])
          .join(folderConstants.nameSeparator),
      }
    );

    const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        workspaceId: workspace.resourceId,
        filepath: file.namePath.join(folderConstants.nameSeparator),
      }
    );

    const result = await getFile(context, instData);
    assertEndpointResultOk(result);
    await waitForRequestPendingJobs(reqData);
    await waitForRequestPendingJobs(instData);
  });

  test('can read public file', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId,
      {publicAccessAction: UploadFilePublicAccessActions.Read}
    );

    const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        workspaceId: workspace.resourceId,
        filepath: file.namePath.join(folderConstants.nameSeparator),
      }
    );

    const result = await getFile(context, instData);
    assertEndpointResultOk(result);
    await waitForRequestPendingJobs(reqData);
    await waitForRequestPendingJobs(instData);
  });

  test('cannot read private file', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file, reqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    let instData: RequestData | null = null;
    try {
      instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {
          workspaceId: workspace.resourceId,
          filepath: file.namePath.join(folderConstants.nameSeparator),
        }
      );

      await getFile(context, instData);
    } catch (error: any) {
      expect(error?.name).toBe(PermissionDeniedError.name);
    } finally {
      await waitForRequestPendingJobs(reqData);
      instData && (await waitForRequestPendingJobs(instData));
    }
  });

  test('file not returned if bandwidth usage is exceeded', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file, reqData: insertFileReqData} = await insertFileForTest(
      context,
      userToken,
      workspace.resourceId
    );

    // Update usage locks
    await updateTestWorkspaceUsageLocks(context, workspace.resourceId, [
      UsageRecordCategory.BandwidthOut,
    ]);
    const reqData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        filepath: file.name,
      }
    );

    await expectErrorThrown(
      async () => await getFile(context!, reqData),
      [UsageLimitExceededError.name]
    );
    await waitForRequestPendingJobs(reqData);
    await waitForRequestPendingJobs(insertFileReqData);
  });
});
