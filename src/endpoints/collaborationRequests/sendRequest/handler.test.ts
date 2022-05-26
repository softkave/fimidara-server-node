import {add} from 'date-fns';
import {faker} from '@faker-js/faker';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import {
  assertContext,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertRequestForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import {collabRequestExtractor} from '../utils';
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
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const requestInput: ICollaborationRequestInput = {
    recipientEmail: user02.email,
    message: faker.lorem.paragraph(),
    expires: add(Date.now(), {days: 1}).toISOString(),
  };

  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId,
    requestInput
  );

  const savedRequest = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(request01.resourceId)
  );

  expect(request01).toMatchObject(collabRequestExtractor(savedRequest));
  expect(
    savedRequest.statusHistory[savedRequest.statusHistory.length - 1]
  ).toMatchObject({
    status: CollaborationRequestStatusType.Pending,
  });
});
