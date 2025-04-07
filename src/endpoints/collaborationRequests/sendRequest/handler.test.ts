import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';
import {CollaborationRequestInput} from './types.js';

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

    const savedRequest = await kIjxSemantic
      .collaborationRequest()
      .assertGetOneByQuery({resourceId: request01.resourceId});
    expect(savedRequest).toMatchObject(request01);
    expect(savedRequest.status).toBe(
      kCollaborationRequestStatusTypeMap.Pending
    );

    await kIjxUtils.promises().flush();
    // const query: DataQuery<EmailMessage<CollaborationRequestEmailMessageParams>> = {
    //   type: kEmailMessageType.collaborationRequest,
    //   emailAddress: {$all: [user02.email]},
    //   userId: {$all: [user02.resourceId]},
    //   params: {$objMatch: {requestId: request01.resourceId}},
    // };
    // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
    // expect(dbEmailMessage).toBeTruthy();

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
    const dbJob = await kIjxSemantic.job().getOneByQuery(query);
    expect(dbJob).toBeTruthy();
  });
});
