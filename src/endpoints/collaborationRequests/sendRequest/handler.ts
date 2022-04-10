import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {SendRequestEndpoint} from './types';
import {sendRequestJoiSchema} from './validation';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {collabRequestExtractor} from '../utils';
import {IUser} from '../../../definitions/user';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaboratorQueries from '../../collaborators/queries';
import {ResourceExistsError} from '../../errors';
import CollaborationRequestQueries from '../queries';
import {getCollaboratorOrganization} from '../../collaborators/utils';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  checkAuthorization,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
  ICollaborationRequestEmailProps,
} from '../../../email-templates/collaborationRequest';
import {withUserOrganizations} from '../../assignedItems/getAssignedItems';

const sendRequest: SendRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization({
    context,
    agent,
    organization,
    type: AppResourceType.CollaborationRequest,
    permissionOwners: makeOrgPermissionOwnerList(organization.resourceId),
    action: BasicCRUDActions.Create,
  });

  let collaboratorExists = false;
  const existingUser = await context.data.user.getItem(
    CollaboratorQueries.getByUserEmail(data.request.recipientEmail)
  );

  if (existingUser) {
    const existingUserWithOrgs = await withUserOrganizations(
      context,
      existingUser
    );

    collaboratorExists = !!(
      existingUser &&
      getCollaboratorOrganization(existingUserWithOrgs, data.organizationId)
    );
  }

  if (collaboratorExists) {
    throw new ResourceExistsError(
      'Collaborator with same email address exists'
    );
  }

  const existingRequest = await context.data.collaborationRequest.getItem(
    CollaborationRequestQueries.getByOrganizationIdAndUserEmail(
      data.organizationId,
      data.request.recipientEmail
    )
  );

  if (existingRequest) {
    const status =
      existingRequest.statusHistory[existingRequest.statusHistory.length - 1];

    if (status.status === CollaborationRequestStatusType.Pending) {
      throw new ResourceExistsError(
        `An existing collaboration request to this user was sent on ${formatDate(
          existingRequest.createdAt
        )}`
      );
    }
  }

  const request = await context.data.collaborationRequest.saveItem({
    resourceId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    message: data.request.message,
    organizationName: organization.name,
    organizationId: organization.resourceId,
    recipientEmail: data.request.recipientEmail,
    expiresAt: data.request.expires,
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: getDateString(),
      },
    ],
  });

  fireAndForgetPromise(sendEmail(context, request, existingUser));
  return {
    request: collabRequestExtractor(request),
  };
};

async function sendEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  toUser: IUser | null
) {
  const emailProps: ICollaborationRequestEmailProps = {
    organizationName: request.organizationName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
    expires: request.expiresAt,
    message: request.message,
  };

  const html = collaborationRequestEmailHTML(emailProps);
  const text = collaborationRequestEmailText(emailProps);
  await context.email.sendEmail(context, {
    subject: collaborationRequestEmailTitle(request.organizationName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default sendRequest;
