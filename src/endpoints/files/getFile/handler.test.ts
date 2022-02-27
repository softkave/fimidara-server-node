import assert = require('assert');
import sharp = require('sharp');
import {IBaseContext} from '../../contexts/BaseContext';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getFile from './handler';
import {IGetFileEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('file returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
      path: file.name,
    }
  );

  const result = await getFile(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toEqual(file);

  const savedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  const savedBuffer =
    savedFile.body && (await getBodyFromStream(savedFile.body));
  assert(savedBuffer);
  expect(result.buffer.equals(savedBuffer)).toBe(true);
});

test('file resized', async () => {
  try {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const startWidth = 500;
    const startHeight = 500;
    const {file} = await insertFileForTest(
      context,
      userToken,
      organization.resourceId,
      {},
      'image',
      {width: startWidth, height: startHeight}
    );

    const expectedWidth = 300;
    const expectedHeight = 300;
    const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        path: file.name,
        imageTranformation: {
          width: expectedWidth,
          height: expectedHeight,
        },
      }
    );

    const result = await getFile(context, instData);
    assertEndpointResultOk(result);
    expect(result.file).toEqual(file);

    const fileMetadata = await sharp(result.buffer).metadata();
    expect(fileMetadata.width).toEqual(expectedWidth);
    expect(fileMetadata.height).toEqual(expectedHeight);
  } catch (error) {
    console.error(error);
    throw error;
  }
});
