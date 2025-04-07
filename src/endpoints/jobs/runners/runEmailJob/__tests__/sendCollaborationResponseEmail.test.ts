import {afterAll, beforeAll, describe, expect, test} from 'vitest';

import {IEmailProviderContext} from '../../../../../contexts/email/types.js';
import {kIjxUtils} from '../../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../../contexts/ijx/register.js';
import {
  CollaborationRequestResponse,
  kCollaborationRequestStatusTypeMap,
} from '../../../../../definitions/collaborationRequest.js';
import {kEmailJobType} from '../../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {kCollaborationRequestResponseArtifacts} from '../../../../../emailTemplates/collaborationRequestResponse.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import MockTestEmailProviderContext from '../../../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testHelpers/generate/collaborationRequest.js';
import {generateAndInsertUserListForTest} from '../../../../testHelpers/generate/user.js';
import {generateAndInsertWorkspaceListForTest} from '../../../../testHelpers/generate/workspace.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {sendCollaborationRequestResponseEmail} from '../sendCollaborationRequestResponseEmail.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendCollaborationRequestResponseEmail', () => {
  test('sendEmail called', async () => {
    const [[user], [workspace]] = await Promise.all([
      generateAndInsertUserListForTest(1),
      generateAndInsertWorkspaceListForTest(1),
    ]);
    const [request] = await generateAndInsertCollaborationRequestListForTest(
      1,
      () => ({
        recipientEmail: user.email,
        workspaceId: workspace.resourceId,
        workspaceName: workspace.name,
        status: kCollaborationRequestStatusTypeMap.Accepted,
      })
    );
    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterIjxUtils.email(testEmailProvider);

    await sendCollaborationRequestResponseEmail(
      getNewIdForResource(kFimidaraResourceType.Job),
      {
        emailAddress: [user.email],
        userId: [user.resourceId],
        type: kEmailJobType.collaborationRequestResponse,
        params: {requestId: request.resourceId},
      }
    );

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(
      kCollaborationRequestResponseArtifacts.title({
        response: request.status as CollaborationRequestResponse,
        workspaceName: workspace.name,
      })
    );
    expect(params.source).toBe(kIjxUtils.suppliedConfig().senderEmailAddress);
  });
});
