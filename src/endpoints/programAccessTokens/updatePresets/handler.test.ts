import RequestData from '../../RequestData';
import {
  assertEndpointResultHasNoErrors,
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import ClientAssignedTokenQueries from '../queries';
import updateProgramAccessTokenPresets from './handler';
import {IUpdateProgramAccessTokenPresetsParams} from './types';

/**
 * TODO:
 * - [Low] Test that hanlder fails if preset doesn't exist
 * - [Low] Test that onReferenced feature works
 */

test('program access token presets updated', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
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

  const instData = RequestData.fromExpressRequest<IUpdateProgramAccessTokenPresetsParams>(
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

  const result = await updateProgramAccessTokenPresets(context, instData);
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
