import {compact} from 'lodash';
import {
  CollaborationRequest,
  kCollaborationRequestStatusTypeMap,
} from '../../../definitions/collaborationRequest';
import {EmailJobParams, kEmailJobType, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {ResourceExistsError} from '../../errors';
import {queueJobs} from '../../jobs/queueJobs';
import {getWorkspaceFromEndpointInput} from '../../workspaces/utils';
import {collaborationRequestForWorkspaceExtractor} from '../utils';
import {SendCollaborationRequestEndpoint} from './types';
import {sendCollaborationRequestJoiSchema} from './validation';

const sendCollaborationRequest: SendCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, sendCollaborationRequestJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
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

  const {request, existingUser} = await kSemanticModels.utils().withTxn(async opts => {
    const [existingUser, existingRequest] = await Promise.all([
      kSemanticModels.user().getByEmail(data.request.recipientEmail),
      kSemanticModels
        .collaborationRequest()
        .getOneByWorkspaceIdEmail(
          workspace.resourceId,
          data.request.recipientEmail,
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

    if (existingRequest?.status === kCollaborationRequestStatusTypeMap.Pending) {
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
        message: data.request.message,
        workspaceName: workspace.name,
        recipientEmail: data.request.recipientEmail,
        expiresAt: data.request.expires,
        status: kCollaborationRequestStatusTypeMap.Pending,
        statusDate: getTimestamp(),
      }
    );

    await kSemanticModels.collaborationRequest().insertItem(request, opts);
    return {request, existingUser};
  }, /** reuseTxn */ false);

  kUtilsInjectables.promises().forget(
    // queueEmailMessage(
    //   request.recipientEmail,
    //   {
    //     type: kEmailMessageType.collaborationRequest,
    //     params: {requestId: request.resourceId},
    //   },
    //   workspace.resourceId,
    //   existingUser?.resourceId,
    //   {reuseTxn: false}
    // )

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
