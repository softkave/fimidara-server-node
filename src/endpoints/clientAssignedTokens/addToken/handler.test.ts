import {
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils';
import ClientAssignedTokenQueries from '../queries';

test('client assigned token added', async () => {
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

  const {token} = await insertClientAssignedTokenForTest(
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

  const savedToken = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(token.tokenId)
  );

  expect(savedToken).toBe(token);
  expect(savedToken.presets.length).toBe(2);
  expect(savedToken.presets[0]).toMatchObject({
    presetId: preset01.presetId,
    assignedBy: user.userId,
    order: 0,
  });
  expect(savedToken.presets[0]).toMatchObject({
    presetId: preset02.presetId,
    assignedBy: user.userId,
    order: 1,
  });
});
