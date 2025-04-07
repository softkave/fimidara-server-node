import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems.js';
import EndpointReusableQueries from '../../queries.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {fileExtractor, stringifyFilenamepath} from '../utils.js';
import updateFileDetails from './handler.js';
import {
  UpdateFileDetailsEndpointParams,
  UpdateFileDetailsInput,
} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('updateFileDetails', () => {
  test('file updated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const updateInput: UpdateFileDetailsInput = {
      description: faker.lorem.paragraph(),
      mimetype: faker.system.mimeType(),
    };

    const reqData =
      RequestData.fromExpressRequest<UpdateFileDetailsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          filepath: stringifyFilenamepath(file, workspace.rootname),
          file: updateInput,
        }
      );
    const result = await updateFileDetails(reqData);
    assertEndpointResultOk(result);
    expect(result.file.resourceId).toEqual(file.resourceId);
    expect(result.file).toMatchObject(updateInput);

    const updatedFile = await populateAssignedTags(
      workspace.resourceId,
      await kIjxSemantic
        .file()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(file.resourceId)
        )
    );
    expect(fileExtractor(updatedFile)).toMatchObject(result.file);
    expect(updatedFile).toMatchObject(updateInput);
  });
});
