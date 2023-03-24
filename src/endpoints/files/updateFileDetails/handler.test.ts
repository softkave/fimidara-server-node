import {faker} from '@faker-js/faker';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {fileExtractor} from '../utils';
import updateFileDetails from './handler';
import {IUpdateFileDetailsEndpointParams, IUpdateFileDetailsInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('file updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file} = await insertFileForTest(context, userToken, workspace);
  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData = RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      filepath: addRootnameToPath(file.name, workspace.rootname),
      file: updateInput,
    }
  );
  const result = await updateFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file.resourceId).toEqual(file.resourceId);
  expect(result.file).toMatchObject(updateInput);

  const updatedFile = await populateAssignedTags(
    context,
    workspace.resourceId,
    await context.semantic.file.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(file.resourceId)
    )
  );
  expect(fileExtractor(updatedFile)).toMatchObject(result.file);
  expect(updatedFile).toMatchObject(updateInput);
});
