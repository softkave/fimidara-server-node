import {add, differenceInSeconds} from 'date-fns';
import * as faker from 'faker';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import {ICollaborationRequestInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaboration request sent', async () => {
  assertContext(context);
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
    EndpointReusableQueries.getById(request01.resourceId)
  );

  expect(request01).toEqual(savedRequest);
  expect(
    savedRequest.statusHistory[savedRequest.statusHistory.length - 1]
  ).toMatchObject({
    status: CollaborationRequestStatusType.Pending,
  });
});
