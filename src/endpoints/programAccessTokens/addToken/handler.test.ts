import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
} from '../../test-utils';
import ProgramAccessTokenQueries from '../queries';

/**
 * TODO:
 * [Low] - Test that hanlder fails if token exists
 * [Low] - Test that hanlder fails if presets don't exist
 */

test('program access token added', async () => {
  const context = getTestBaseContext();
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
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

  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId,
    {
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

  const savedToken = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(token.tokenId)
  );

  expect(savedToken).toBe(token);
  expect(savedToken.presets.length).toBe(2);
  expect(savedToken.presets[0]).toEqual({
    presetId: preset01.presetId,
    assignedBy: user.userId,
    order: 0,
  });
  expect(savedToken.presets[0]).toEqual({
    presetId: preset02.presetId,
    assignedBy: user.userId,
    order: 1,
  });
});
