import {findItemWithField} from '../../../utilities/fns';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspacePresetPermissionsGroups from './handler';
import {IGetWorkspacePresetPermissionsGroupsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test("workspace's presets returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetWorkspacePresetPermissionsGroupsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    );

  const result = await getWorkspacePresetPermissionsGroups(context, instData);
  assertEndpointResultOk(result);
  const resultPreset01 = findItemWithField(
    result.presets,
    preset01.resourceId,
    'resourceId'
  );

  const resultPreset02 = findItemWithField(
    result.presets,
    preset02.resourceId,
    'resourceId'
  );
  expect(resultPreset01).toMatchObject(preset01);
  expect(resultPreset02).toMatchObject(preset02);
});
