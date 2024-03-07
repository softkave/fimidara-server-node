import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {EmailJobParams, Job, kEmailJobType, kJobType} from '../../../definitions/job';
import {getTimestamp} from '../../../utils/dateFns';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
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
    expect(savedRequest.status).toBe(kCollaborationRequestStatusTypeMap.Pending);

    await kUtilsInjectables.promises().flush();
    const query: DataQuery<Job<EmailJobParams>> = {
      type: kJobType.email,
      params: {
        $objMatch: {
          type: kEmailJobType.collaborationRequest,
          emailAddress: {$all: [user02.email]},
          userId: {$all: [user02.resourceId]},
          params: {$objMatch: {requestId: request01.resourceId}},
        },
      },
    };
    const dbJob = await kSemanticModels.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });
});
