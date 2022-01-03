import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertProgramAccessTokenForTest,
  insertUserForTest,
} from '../../test-utils';
import ProgramAccessTokenQueries from '../queries';

test('program access token added', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {token} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    organization.organizationId
  );

  const savedToken = await context.data.programAccessToken.assertGetItem(
    ProgramAccessTokenQueries.getById(token.tokenId)
  );

  expect(savedToken).toBe(token);
});
