import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import ProgramAccessTokenQueries from '../queries';
import deletePresetPermissionsGroup from './handler';
import {IDeletePresetPermissionsGroupParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('preset permission group deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IDeletePresetPermissionsGroupParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        presetId: preset.resourceId,
      }
    );

  const result = await deletePresetPermissionsGroup(context, instData);
  assertEndpointResultOk(result);

  const deletedPresetExists =
    await context.data.programAccessToken.checkItemExists(
      ProgramAccessTokenQueries.getById(preset.resourceId)
    );

  expect(deletedPresetExists).toBeFalsy();
});
