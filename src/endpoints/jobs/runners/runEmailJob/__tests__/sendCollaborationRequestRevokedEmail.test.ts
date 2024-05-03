import {kEmailJobType} from '../../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {kCollaborationRequestRevokedEmail} from '../../../../../emailTemplates/collaborationRequestRevoked.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import {IEmailProviderContext} from '../../../../contexts/email/types.js';
import {kUtilsInjectables} from '../../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register.js';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest.js';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user.js';
import {generateAndInsertWorkspaceListForTest} from '../../../../testUtils/generate/workspace.js';
import {completeTests} from '../../../../testUtils/helpers/testFns.js';
import {initTests} from '../../../../testUtils/testUtils.js';
import {sendCollaborationRequestRevokedEmail} from '../sendCollaborationRequestRevokedEmail.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendCollaborationRequestRevokedEmail', () => {
  test('sendEmail called', async () => {
    const [[user], [workspace]] = await Promise.all([
      generateAndInsertUserListForTest(1),
      generateAndInsertWorkspaceListForTest(1),
    ]);
    const [request] = await generateAndInsertCollaborationRequestListForTest(1, () => ({
      recipientEmail: user.email,
      workspaceId: workspace.resourceId,
      workspaceName: workspace.name,
    }));
    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterUtilsInjectables.email(testEmailProvider);

    await sendCollaborationRequestRevokedEmail(
      getNewIdForResource(kFimidaraResourceType.Job),
      {
        emailAddress: [user.email],
        userId: [user.resourceId],
        type: kEmailJobType.collaborationRequestRevoked,
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
    expect(params.subject).toBe(kCollaborationRequestRevokedEmail.title(workspace.name));
    expect(params.source).toBe(kUtilsInjectables.suppliedConfig().senderEmailAddress);
  });
});
