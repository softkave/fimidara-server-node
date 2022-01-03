import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import ClientAssignedTokenQueries from '../queries';
import updateClientAssignedTokenPresets from './handler';
import {IUpdateClientAssignedTokenPresetsParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if preset doesn't exist
 */

test('client assigned token presets updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset01} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IUpdateClientAssignedTokenPresetsParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      tokenId: token01.tokenId,
      presets: [
        {
          presetId: preset01.presetId,
          order: 1,
        },
        {
          presetId: preset02.presetId,
          order: 2,
        },
      ],
    }
  );

  const result = await updateClientAssignedTokenPresets(context, instData);
  assertEndpointResultHasNoErrors(result);

  const updatedToken = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(user.userId)
  );

  expect(updatedToken).toEqual(result.token);
  expect(updatedToken.presets.length).toBe(2);
  expect(updatedToken.presets[0]).toEqual({
    presetId: preset01.presetId,
    assignedBy: user.userId,
    order: 0,
  });
  expect(updatedToken.presets[0]).toEqual({
    presetId: preset02.presetId,
    assignedBy: user.userId,
    order: 1,
  });
});
