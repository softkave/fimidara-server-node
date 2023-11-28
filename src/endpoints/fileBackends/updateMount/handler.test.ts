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
  insertFileBackendMountForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithFileBackendMount,
} from '../../testUtils/testUtils';
import {fileBackendMountExtractor, getPublicFileBackendMount} from '../utils';
import updateFileBackendMount from './handler';
import {UpdateFileBackendMountEndpointParams, UpdateFileBackendMountInput} from './types';

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

test('agent mount updated', async () => {
  assertContext(context);
  const {userMount} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userMount);
  const {mount: mount01} = await insertFileBackendMountForTest(
    context,
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
  const result = await updateFileBackendMount(context, instData);
  assertEndpointResultOk(result);

  const updatedMount = getPublicFileBackendMount(
    context,
    await populateAssignedTags(
      context,
      workspace.resourceId,
      await context.semantic.fileBackendMount.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(mount01.resourceId)
      )
    )
  );
  expect(fileBackendMountExtractor(updatedMount)).toMatchObject(result.mount);
  expect(updatedMount.name).toBe(mountUpdateInput.name);
  expect(updatedMount.description).toBe(mountUpdateInput.description);
});
