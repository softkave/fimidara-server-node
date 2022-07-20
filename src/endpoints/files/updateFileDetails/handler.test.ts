import {faker} from '@faker-js/faker';
import {AppResourceType} from '../../../definitions/system';
import {withAssignedPermissionGroupsAndTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import {addRootnameToPath} from '../../folders/utils';
import RequestData from '../../RequestData';
import {waitForRequestPendingJobs} from '../../test-utils/helpers/reqData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';
import {fileExtractor} from '../utils';
import updateFileDetails from './handler';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsInput,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('file updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file, reqData} = await insertFileForTest(
    context,
    userToken,
    workspace
  );

  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        filepath: addRootnameToPath(file.name, workspace.rootname),
        file: updateInput,
      }
    );

  const result = await updateFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file.resourceId).toEqual(file.resourceId);
  expect(result.file).toMatchObject(updateInput);

  const updatedFile = await withAssignedPermissionGroupsAndTags(
    context,
    workspace.resourceId,
    await context.data.file.assertGetItem(FileQueries.getById(file.resourceId)),
    AppResourceType.File
  );

  expect(fileExtractor(updatedFile)).toMatchObject(result.file);
  expect(updatedFile).toMatchObject(updateInput);
  await waitForRequestPendingJobs(reqData);
});
