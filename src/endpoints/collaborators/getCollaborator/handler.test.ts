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
import {IGetCollaboratorEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaborator returned', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IGetCollaboratorEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        collaboratorId: user.resourceId,
      }
    );

  const result = await getCollaborator(context, instData);
  assertEndpointResultOk(result);
  expect(result.collaborator).toMatchObject(
    collaboratorExtractor(
      await withUserOrganizations(
        context,
        await context.data.user.assertGetItem(
          EndpointReusableQueries.getById(user.resourceId)
        )
      ),
      organization.resourceId
    )
  );
});
