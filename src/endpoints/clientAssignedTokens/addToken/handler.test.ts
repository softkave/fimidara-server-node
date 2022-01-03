import {
  getTestBaseContext,
  insertClientAssignedTokenForTest,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils';
import ClientAssignedTokenQueries from '../queries';

test('client assigned token added', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token} = await insertClientAssignedTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const savedToken = await context.data.clientAssignedToken.assertGetItem(
    ClientAssignedTokenQueries.getById(token.tokenId)
  );

  expect(savedToken).toBe(token);
});
