import { faker } from '@faker-js/faker';
import RequestData from '../../RequestData';
import { populateAssignedTags } from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import { completeTest } from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendConfig,
} from '../../testUtils/testUtils';
import { fileBackendConfigExtractor, getPublicFileBackendConfig } from '../utils';
import updateFileBackendConfig from './handler';
import {
  UpdateFileBackendConfigEndpointParams,
  UpdateFileBackendConfigInput,
} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if permissionGroups doesn't exist
 * - [Low] Test that onReferenced feature works
 */



beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

test('agent config updated', async () => {
  
  const {userConfig} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userConfig);
  const {config: config01} = await insertFileBackendConfigForTest(
    userConfig,
    workspace.resourceId
  );
  const configUpdateInput: UpdateFileBackendConfigInput = {
    name: faker.lorem.words(10),
    description: faker.lorem.words(10),
  };

  const instData = RequestData.fromExpressRequest<UpdateFileBackendConfigEndpointParams>(
    mockExpressRequestWithFileBackendConfig(userConfig),
    {
      configId: config01.resourceId,
      config: configUpdateInput,
      workspaceId: workspace.resourceId,
    }
  );
  const result = await updateFileBackendConfig(instData);
  assertEndpointResultOk(result);

  const updatedConfig = getPublicFileBackendConfig(
    await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels.file()BackendConfig.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(config01.resourceId)
      )
    )
  );
  expect(fileBackendConfigExtractor(updatedConfig)).toMatchObject(result.config);
  expect(updatedConfig.name).toBe(configUpdateInput.name);
  expect(updatedConfig.description).toBe(configUpdateInput.description);
});
