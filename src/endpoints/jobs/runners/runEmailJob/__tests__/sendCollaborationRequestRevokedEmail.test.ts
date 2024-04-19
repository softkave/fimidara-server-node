import {kEmailJobType} from '../../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {kCollaborationRequestRevokedEmail} from '../../../../../emailTemplates/collaborationRequestRevoked';
import {getNewIdForResource} from '../../../../../utils/resource';
import {IEmailProviderContext} from '../../../../contexts/email/types';
import {kUtilsInjectables} from '../../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext';
import {generateAndInsertCollaborationRequestListForTest} from '../../../../testUtils/generate/collaborationRequest';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user';
import {generateAndInsertWorkspaceListForTest} from '../../../../testUtils/generate/workspace';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {sendCollaborationRequestRevokedEmail} from '../sendCollaborationRequestRevokedEmail';

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
