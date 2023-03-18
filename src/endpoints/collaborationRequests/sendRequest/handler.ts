import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IUser} from '../../../definitions/user';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
  ICollaborationRequestEmailProps,
} from '../../../emailTemplates/collaborationRequest';
import {appAssert} from '../../../utils/assertion';
import {formatDate, getTimestamp} from '../../../utils/dateFns';
import {newWorkspaceResource} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {addAssignedPermissionGroupList} from '../../assignedItems/addAssignedItems';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {MemStore} from '../../contexts/mem/Mem';
import {ISemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {IBaseContext} from '../../contexts/types';
import {ResourceExistsError} from '../../errors';
import {getWorkspaceFromEndpointInput} from '../../utils';
import {
  collaborationRequestForWorkspaceExtractor,
  populateRequestAssignedPermissionGroups,
} from '../utils';
import {SendCollaborationRequestEndpoint} from './types';
import {sendCollaborationRequestJoiSchema} from './validation';

const sendCollaborationRequest: SendCollaborationRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendCollaborationRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const {workspace} = await getWorkspaceFromEndpointInput(context, agent, data);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: [{type: AppResourceType.CollaborationRequest}],
    action: BasicCRUDActions.Create,
  });

  let {request, existingUser} = await MemStore.withTransaction(context, async transaction => {
    const opts: ISemanticDataAccessProviderMutationRunOptions = {transaction};
    const [existingUser, existingRequest] = await Promise.all([
      context.semantic.user.getByEmail(data.request.recipientEmail),
      context.semantic.collaborationRequest.getOneByWorkspaceIdEmail(
        workspace.resourceId,
        data.request.recipientEmail,
        opts
      ),
    ]);

    if (existingUser) {
      const collaboratorExists = await context.semantic.assignedItem.existsByAssignedAndAssigneeIds(
        workspace.resourceId,
        workspace.resourceId,
        existingUser.resourceId,
        opts
      );
      appAssert(
        collaboratorExists,
        new ResourceExistsError('Collaborator with same email address exists in this workspace.')
      );
    }

    appAssert(
      existingRequest?.status === CollaborationRequestStatusType.Pending,
      new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(
          existingRequest!.createdAt
        )}`
      )
    );

    const request: ICollaborationRequest = newWorkspaceResource(
      agent,
      AppResourceType.CollaborationRequest,
      workspace.resourceId,
      {
        message: data.request.message,
        workspaceName: workspace.name,
        recipientEmail: data.request.recipientEmail,
        expiresAt: data.request.expires,
        status: CollaborationRequestStatusType.Pending,
        statusDate: getTimestamp(),
      }
    );
    const permissionGroupsAssignedOnAcceptingRequest =
      data.request.permissionGroupsAssignedOnAcceptingRequest ?? [];
    await Promise.all([
      context.semantic.collaborationRequest.insertItem(request, opts),
      permissionGroupsAssignedOnAcceptingRequest.length &&
        addAssignedPermissionGroupList(
          context,
          agent,
          workspace.resourceId,
          permissionGroupsAssignedOnAcceptingRequest,
          request.resourceId,
          /** deleteExisting */ false,
          /** skip permission groups check */ false,
          /** skip auth check */ false,
          opts
        ),
    ]);

    return {request, existingUser};
  });

  [request] = await Promise.all([
    populateRequestAssignedPermissionGroups(context, request),
    sendCollaborationRequestEmail(context, request, existingUser),
  ]);
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

async function sendCollaborationRequestEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  toUser: IUser | null
) {
  const emailProps: ICollaborationRequestEmailProps = {
    workspaceName: request.workspaceName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    expires: request.expiresAt,
    message: request.message,
  };
  const html = collaborationRequestEmailHTML(emailProps);
  const text = collaborationRequestEmailText(emailProps);
  await context.email.sendEmail(context, {
    subject: collaborationRequestEmailTitle(request.workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendCollaborationRequest;
