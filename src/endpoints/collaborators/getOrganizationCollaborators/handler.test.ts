import {withUserOrganizations} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {collaboratorExtractor} from '../utils';
import getCollaborator from './handler';
import {IGetOrganizationCollaboratorsEndpointParams} from './types';

/**
 * TODO:
 * - Check that only permitted collaborators are returned
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('organization collaborators returned', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IGetOrganizationCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
      }
    );

  const result = await getCollaborator(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await withUserOrganizations(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(user.resourceId)
    )
  );

  expect(result.collaborators).toContainEqual(
    collaboratorExtractor(updatedUser, organization.resourceId)
  );
});
