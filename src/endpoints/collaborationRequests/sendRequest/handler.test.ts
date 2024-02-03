import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {CollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {getTimestamp} from '../../../utils/dateFns';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {CollaborationRequestInput} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendCollaborationRequest', () => {
  test('collaboration request sent', async () => {
    const {userToken} = await insertUserForTest();
    const {user: user02} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const requestInput: CollaborationRequestInput = {
      recipientEmail: user02.email,
      message: faker.lorem.paragraph(),
      expires: getTimestamp(add(Date.now(), {days: 1})),
    };
    const {request: request01} = await insertRequestForTest(
      userToken,
      workspace.resourceId,
      requestInput
    );

    const savedRequest = await kSemanticModels
      .collaborationRequest()
      .assertGetOneByQuery({resourceId: request01.resourceId});
    expect(savedRequest).toMatchObject(request01);
    expect(savedRequest.status).toBe(CollaborationRequestStatusTypeMap.Pending);
  });
});
