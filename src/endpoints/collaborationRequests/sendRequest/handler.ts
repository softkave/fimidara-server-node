import {compact} from 'lodash-es';
import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../../contexts/authorizationChecks/checkAuthorizaton.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {formatDate, getTimestamp} from '../../../utils/dateFns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {ResourceExistsError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils.js';
import {collaborationRequestForWorkspaceExtractor} from '../utils.js';
import {SendCollaborationRequestEndpoint} from './types.js';
import {sendCollaborationRequestJoiSchema} from './validation.js';

const sendCollaborationRequest: SendCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, sendCollaborationRequestJoiSchema);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {workspace} = await getWorkspaceFromEndpointInput(agent, data);
    await checkAuthorizationWithAgent({
      agent,
      workspaceId: workspace.resourceId,
      workspace: workspace,
      target: {targetId: workspace.resourceId, action: 'addCollaborator'},
    });

    const {request, existingUser} = await kIjxSemantic
      .utils()
      .withTxn(async opts => {
        const [existingUser, existingRequest] = await Promise.all([
          kIjxSemantic.user().getByEmail(data.recipientEmail),
          kIjxSemantic
            .collaborationRequest()
            .getOneByWorkspaceIdEmail(
              workspace.resourceId,
              data.recipientEmail,
              opts
            ),
        ]);

        if (existingUser) {
          const collaboratorExists = await kIjxSemantic
            .assignedItem()
            .existsByWorkspaceAssignedAndAssigneeIds(
              workspace.resourceId,
              workspace.resourceId,
              existingUser.resourceId,
              opts
            );
          appAssert(
            collaboratorExists === false,
            new ResourceExistsError(
              'Collaborator with same email address exists in this workspace'
            )
          );
        }

        if (
          existingRequest?.status === kCollaborationRequestStatusTypeMap.Pending
        ) {
          throw new ResourceExistsError(
            `An existing collaboration request to this user was sent on ${formatDate(
              existingRequest?.createdAt
            )}`
          );
        }

        const request: CollaborationRequest = newWorkspaceResource(
          agent,
          kFimidaraResourceType.CollaborationRequest,
          workspace.resourceId,
          {
            message: data.message,
            workspaceName: workspace.name,
            recipientEmail: data.recipientEmail,
            expiresAt: data.expires,
            status: kCollaborationRequestStatusTypeMap.Pending,
            statusDate: getTimestamp(),
          }
        );

        await kIjxSemantic.collaborationRequest().insertItem(request, opts);
        return {request, existingUser};
      });

    kIjxUtils.promises().callAndForget(() =>
      queueJobs<EmailJobParams>(workspace.resourceId, undefined, {
        createdBy: agent,
        type: kJobType.email,
        idempotencyToken: Date.now().toString(),
        params: {
          type: kEmailJobType.collaborationRequest,
          emailAddress: [request.recipientEmail],
          userId: compact([existingUser?.resourceId]),
          params: {requestId: request.resourceId},
        },
      })
    );

    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default sendCollaborationRequest;
