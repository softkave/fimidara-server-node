import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injectables';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {fileExtractor, stringifyFilenamepath} from '../utils';
import updateFileDetails from './handler';
import {UpdateFileDetailsEndpointParams, UpdateFileDetailsInput} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

test('file updated', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {file} = await insertFileForTest(userToken, workspace);
  const updateInput: UpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData = RequestData.fromExpressRequest<UpdateFileDetailsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {filepath: stringifyFilenamepath(file, workspace.rootname), file: updateInput}
  );
  const result = await updateFileDetails(instData);
  assertEndpointResultOk(result);
  expect(result.file.resourceId).toEqual(file.resourceId);
  expect(result.file).toMatchObject(updateInput);

  const updatedFile = await populateAssignedTags(
    workspace.resourceId,
    await kSemanticModels
      .file()
      .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(file.resourceId))
  );
  expect(fileExtractor(updatedFile)).toMatchObject(result.file);
  expect(updatedFile).toMatchObject(updateInput);
});
