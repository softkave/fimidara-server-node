import {faker} from '@faker-js/faker';
import RequestData from '../../RequestData';
import {populateAssignedTags} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileBackendConfigForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendConfig,
} from '../../testUtils/testUtils';
import {fileBackendConfigExtractor, getPublicFileBackendConfig} from '../utils';
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('agent config updated', async () => {
  assertContext(context);
  const {userConfig} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userConfig);
  const {config: config01} = await insertFileBackendConfigForTest(
    context,
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
  const result = await updateFileBackendConfig(context, instData);
  assertEndpointResultOk(result);

  const updatedConfig = getPublicFileBackendConfig(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.semantic.fileBackendConfig.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(config01.resourceId)
      )
    )
  );
  expect(fileBackendConfigExtractor(updatedConfig)).toMatchObject(result.config);
  expect(updatedConfig.name).toBe(configUpdateInput.name);
  expect(updatedConfig.description).toBe(configUpdateInput.description);
});
