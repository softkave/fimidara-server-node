import {
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertPresetForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import ClientAssignedTokenQueries from '../queries';

test('client assigned token added', async () => {
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

  const {token} = await insertClientAssignedTokenForTest(
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

  const savedToken = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(token.resourceId)
  );

  expect(savedToken).toBe(token);
  expect(savedToken.presets.length).toBe(2);
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
