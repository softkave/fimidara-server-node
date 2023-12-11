import { faker } from '@faker-js/faker';
import RequestData from '../../RequestData';
import { populateAssignedTags } from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import { completeTest } from '../../testUtils/helpers/test';
import {
    assertEndpointResultOk,
    insertFileBackendMountForTest,
    insertUserForTest,
    insertWorkspaceForTest,
    mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import { fileBackendMountExtractor, getPublicFileBackendMount } from '../utils';
import updateFileBackendMount from './handler';
import { UpdateFileBackendMountEndpointParams, UpdateFileBackendMountInput } from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if permissionGroups doesn't exist
 * - [Low] Test that onReferenced feature works
 */



beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

test('agent mount updated', async () => {
  
  const {userMount} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userMount);
  const {mount: mount01} = await insertFileBackendMountForTest(
    userMount,
    workspace.resourceId
  );
  const mountUpdateInput: UpdateFileBackendMountInput = {
    name: faker.lorem.words(10),
    description: faker.lorem.words(10),
  };

  const instData = RequestData.fromExpressRequest<UpdateFileBackendMountEndpointParams>(
    mockExpressRequestWithFileBackendMount(userMount),
    {
      mountId: mount01.resourceId,
      mount: mountUpdateInput,
      workspaceId: workspace.resourceId,
    }
  );
  const result = await updateFileBackendMount(instData);
  assertEndpointResultOk(result);

  const updatedMount = getPublicFileBackendMount(
    await populateAssignedTags(
      workspace.resourceId,
      await kSemanticModels.file()BackendMount.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(mount01.resourceId)
      )
    )
  );
  expect(fileBackendMountExtractor(updatedMount)).toMatchObject(result.mount);
  expect(updatedMount.name).toBe(mountUpdateInput.name);
  expect(updatedMount.description).toBe(mountUpdateInput.description);
});
