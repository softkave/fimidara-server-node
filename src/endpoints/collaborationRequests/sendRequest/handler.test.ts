import add from 'date-fns/add';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import * as faker from 'faker';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import CollaborationRequestQueries from '../queries';
import {ICollaborationRequestInput} from './types';

test('collaboration request sent', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {user: user02} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const requestInput: ICollaborationRequestInput = {
    recipientEmail: user02.email,
    message: faker.lorem.paragraph(),
    expires: differenceInSeconds(add(Date.now(), {days: 1}), Date.now()),
  };

  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId,
    requestInput
  );

  const savedRequest = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(request01.resourceId)
  );

  expect(request01).toBe(savedRequest);
  expect(savedRequest.statusHistory).toContain({
    status: CollaborationRequestStatusType.Pending,
  });
});
