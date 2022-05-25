import {faker} from '@faker-js/faker';
import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import {assertWorkspace, workspaceExtractor} from '../utils';
import {IAddWorkspaceParams} from './types';
import {DEFAULT_ADMIN_PRESET_NAME, DEFAULT_PUBLIC_PRESET_NAME} from './utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('workspace created', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const companyInput: IAddWorkspaceParams = {
    name: faker.company.companyName(),
    description: faker.company.catchPhraseDescriptor(),
  };

  const result = await insertWorkspaceForTest(context, userToken, companyInput);
  expect(result.workspace).toMatchObject(companyInput);
  expect(result.workspace.publicPresetId).toBeTruthy();
  const workspace = await context.cacheProviders.workspace.getById(
    context,
    result.workspace.resourceId
  );
  assertWorkspace(workspace);
  expect(workspaceExtractor(workspace)).toMatchObject(result.workspace);

  const adminPreset = await context.data.preset.assertGetItem(
    EndpointReusableQueries.getByWorkspaceAndName(
      workspace.resourceId,
      DEFAULT_ADMIN_PRESET_NAME
    )
  );

  await context.data.preset.assertGetItem(
    EndpointReusableQueries.getByWorkspaceAndName(
      workspace.resourceId,
      DEFAULT_PUBLIC_PRESET_NAME
    )
  );

  const user = await withUserWorkspaces(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(userToken.userId)
    )
  );

  const userWorkspace = user.workspaces.find(
    item => item.workspaceId === workspace.resourceId
  );

  expect(userWorkspace).toBeTruthy();
  const assignedAdminPreset = userWorkspace?.presets.find(
    item => item.presetId === adminPreset.resourceId
  );

  expect(assignedAdminPreset).toBeTruthy();
});
