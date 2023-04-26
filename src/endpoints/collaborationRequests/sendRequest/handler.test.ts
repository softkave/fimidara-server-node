import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {getTimestamp} from '../../../utils/dateFns';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {CollaborationRequestInput} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('sendCollaborationRequest', () => {
  test('collaboration request sent', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {user: user02} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const requestInput: CollaborationRequestInput = {
      recipientEmail: user02.email,
      message: faker.lorem.paragraph(),
      expires: getTimestamp(add(Date.now(), {days: 1})),
    };
    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId,
      requestInput
    );

    const savedRequest = await context.semantic.collaborationRequest.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(request01.resourceId)
    );
    expect(savedRequest).toMatchObject(request01);
    expect(savedRequest.status).toBe(CollaborationRequestStatusType.Pending);
  });
});
