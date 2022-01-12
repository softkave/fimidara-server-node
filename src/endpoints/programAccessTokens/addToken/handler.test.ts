import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertPresetForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
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
    organization.resourceId
  );

  const {preset: preset02} = await insertPresetForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.resourceId,
    {
      presets: [
        {
          presetId: preset01.resourceId,
          order: 1,
        },
        {
          presetId: preset02.resourceId,
          order: 2,
        },
      ],
    }
  );

  const savedToken = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(token.resourceId)
  );

  expect(savedToken).toEqual(token);
  expect(savedToken.presets.length).toEqual(2);
  expect(savedToken.presets[0]).toMatchObject({
    presetId: preset01.resourceId,
    assignedBy: user.resourceId,
    order: 0,
  });
  expect(savedToken.presets[0]).toMatchObject({
    presetId: preset02.resourceId,
    assignedBy: user.resourceId,
    order: 1,
  });
});
