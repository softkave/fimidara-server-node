import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {getBufferFromStream} from '../../contexts/FilePersistenceProviderContext';
import {IBaseContext} from '../../contexts/types';
import {folderConstants} from '../../folders/constants';
import {addRootnameToPath} from '../../folders/utils';
import {disposeGlobalUtils} from '../../globalUtils';
import RequestData from '../../RequestData';
import {generateTestFolderName} from '../../testUtils/generateData/folder';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {updateTestWorkspaceUsageLocks} from '../../testUtils/helpers/usageRecord';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {UsageLimitExceededError} from '../../usageRecords/errors';
import {PermissionDeniedError} from '../../user/errors';
import {UploadFilePublicAccessActions} from '../uploadFile/types';
import readFile from './handler';
import {IReadFileEndpointParams} from './types';
import sharp = require('sharp');
import assert = require('assert');

let context: IBaseContext | null = null;

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

describe('readFile', () => {
  test('file returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const instData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: addRootnameToPath(file.name, workspace.rootname)}
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
    const savedFile = await context.fileBackend.getFile({
      bucket: context.appVariables.S3Bucket,
      key: file.resourceId,
    });
    const savedBuffer = savedFile.body && (await getBufferFromStream(savedFile.body));
    const resultBuffer = await getBufferFromStream(result.stream);
    assert(savedBuffer);
    assert(resultBuffer);
    expect(resultBuffer.equals(savedBuffer)).toBe(true);
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
    const instData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        filepath: addRootnameToPath(file.name, workspace.rootname),
        imageTranformation: {
          width: expectedWidth,
          height: expectedHeight,
        },
      }
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
    const resultBuffer = await getBufferFromStream(result.stream);
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
    const {folder} = await insertFolderForTest(context, userToken, workspace, {
      publicAccessOps: [
        {
          action: BasicCRUDActions.Read,
          resourceType: AppResourceType.File,
        },
      ],
    });
    const {file} = await insertFileForTest(context, userToken, workspace, {
      filepath: addRootnameToPath(
        folder.namePath.concat([generateTestFolderName()]).join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    });
    const instData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        filepath: addRootnameToPath(
          file.namePath.join(folderConstants.nameSeparator),
          workspace.rootname
        ),
      }
    );
    const result = await readFile(context, instData);
    assertEndpointResultOk(result);
  });

  test('can read public file', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace, {
      publicAccessAction: UploadFilePublicAccessActions.Read,
    });
    const instData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {
        filepath: addRootnameToPath(
          file.namePath.join(folderConstants.nameSeparator),
          workspace.rootname
        ),
      }
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
      instData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
        mockExpressRequestForPublicAgent(),
        {
          filepath: addRootnameToPath(
            file.namePath.join(folderConstants.nameSeparator),
            workspace.rootname
          ),
        }
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
      UsageRecordCategory.BandwidthOut,
    ]);
    const reqData = RequestData.fromExpressRequest<IReadFileEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath: addRootnameToPath(file.name, workspace.rootname)}
    );
    await expectErrorThrown(async () => {
      assertContext(context);
      await readFile(context, reqData);
    }, [UsageLimitExceededError.name]);
  });
});
