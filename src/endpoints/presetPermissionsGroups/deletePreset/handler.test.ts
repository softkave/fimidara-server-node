import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import ProgramAccessTokenQueries from '../queries';
import deletePresetPermissionsGroup from './handler';
import {IDeletePresetPermissionsGroupParams} from './types';

test('preset permission group deleted', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {preset} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IDeletePresetPermissionsGroupParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      presetId: preset.presetId,
    }
  );

  const result = await deletePresetPermissionsGroup(context, instData);
  assertEndpointResultHasNoErrors(result);

  const deletedPresetExists = await context.data.programAccessToken.checkItemExists(
    ProgramAccessTokenQueries.getById(preset.presetId)
  );

  expect(deletedPresetExists).toBeFalsy();
});
