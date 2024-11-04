import {compact} from 'lodash-es';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest.js';
import {
  EmailJobParams,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {formatDate, getTimestamp} from '../../../utils/dateFns.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {ResourceExistsError} from '../../errors.js';
import {queueJobs} from '../../jobs/queueJobs.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {collaborationRequestForWorkspaceExtractor} from '../utils.js';
import {SendCollaborationRequestEndpoint} from './types.js';
import {sendCollaborationRequestJoiSchema} from './validation.js';

const sendCollaborationRequestEndpoint: SendCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, sendCollaborationRequestJoiSchema);
    const {agent, workspace} = await initEndpoint(reqData, {
      data,
      action: kFimidaraPermissionActions.addCollaborator,
    });

    const {request, existingUser} = await kSemanticModels
      .utils()
      .withTxn(async opts => {
        const [existingUser, existingRequest] = await Promise.all([
          kSemanticModels.user().getByEmail({
            workspaceId: workspace.resourceId,
            email: data.recipientEmail,
          }),
          kSemanticModels
            .collaborationRequest()
            .getOneByWorkspaceIdEmail(
              workspace.resourceId,
              data.recipientEmail,
              opts
            ),
        ]);

        if (existingUser) {
          const collaboratorExists = await kSemanticModels
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

        await kSemanticModels.collaborationRequest().insertItem(request, opts);
        return {request, existingUser};
      });

    kUtilsInjectables.promises().forget(
      queueJobs<EmailJobParams>(
        workspace.resourceId,
        /** parentJobId */ undefined,
        {
          createdBy: agent,
          type: kJobType.email,
          idempotencyToken: Date.now().toString(),
          params: {
            type: kEmailJobType.collaborationRequest,
            emailAddress: [request.recipientEmail],
            userId: compact([existingUser?.resourceId]),
            params: {requestId: request.resourceId},
          },
        }
      )
    );

    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default sendCollaborationRequestEndpoint;
