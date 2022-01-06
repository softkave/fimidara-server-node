import sharp = require('sharp');
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import getFile from './handler';
import {IGetFileEndpointParams} from './types';

test('file returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: file.name,
    }
  );

  const result = await getFile(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toBe(file);

  const savedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.fileId,
  });

  expect(savedFile).toBeTruthy();
  expect(savedFile.body).toBe(result.buffer);
});

test('file resized', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const startWidth = 500;
  const startHeight = 500;
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.organizationId,
    {},
    'image',
    {width: startWidth, height: startHeight}
  );

  const expectedWidth = 300;
  const expectedHeight = 300;
  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: file.name,
      imageTranformation: {
        width: expectedWidth,
        height: expectedHeight,
      },
    }
  );

  const result = await getFile(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toBe(file);

  const fileMetadata = await sharp(result.buffer).metadata();
  expect(fileMetadata.width).toBe(expectedWidth);
  expect(fileMetadata.height).toBe(expectedHeight);
});
