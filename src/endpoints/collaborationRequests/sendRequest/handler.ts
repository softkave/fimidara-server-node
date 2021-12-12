import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {SendRequestEndpoint} from './types';
import {sendRequestJoiSchema} from './validation';
import {add} from 'date-fns';
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
  makeBasePermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {
  collaborationRequestEmailHTML,
  collaborationRequestEmailText,
  collaborationRequestEmailTitle,
} from '../../../email-templates/collaborationRequest';

async function sendEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  toUser: IUser | null,
  organizationName: string
) {
  const html = collaborationRequestEmailHTML({
    organizationName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
  });

  const text = collaborationRequestEmailText({
    organizationName,
    isRecipientAUser: !!toUser,
    loginLink: context.appVariables.clientLoginLink,
    signupLink: context.appVariables.clientSignupLink,
  });

  await context.email.sendEmail(context, {
    subject: collaborationRequestEmailTitle(organizationName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

const sendRequest: SendRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
  );

  await checkAuthorization(
    context,
    agent,
    organization.organizationId,
    null,
    AppResourceType.CollaborationRequest,
    makeBasePermissionOwnerList(organization.organizationId),
    BasicCRUDActions.Create
  );

  const existingUser = await context.data.user.getItem(
    CollaboratorQueries.getByUserEmail(data.request.recipientEmail)
  );

  const collaboratorExists =
    existingUser &&
    getCollaboratorOrganization(existingUser, data.organizationId);

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
    throw new ResourceExistsError(
      `An existing collaboration request to this user was sent on ${formatDate(
        existingRequest.createdAt
      )}`
    );
  }

  const request = await context.data.collaborationRequest.saveItem({
    requestId: getNewId(),
    createdAt: getDateString(),
    createdBy: {
      agentId: agent.agentId,
      agentType: agent.agentType,
    },
    message: data.request.message,
    organizationId: organization.organizationId,
    recipientEmail: data.request.recipientEmail,
    expiresAt: getDateString(
      add(new Date(), {
        seconds: data.request.expiresAtInSecsFromToday,
      })
    ),
    sentEmailHistory: [],
    statusHistory: [
      {
        status: CollaborationRequestStatusType.Pending,
        date: getDateString(),
      },
    ],
  });

  fireAndForgetPromise(
    sendEmail(context, request, existingUser, organization.name)
  );

  return {
    request: collabRequestExtractor(request),
  };
};

export default sendRequest;
