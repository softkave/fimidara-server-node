import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {formatDate, getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {ISendRequestContext, SendRequestEndpoint} from './types';
import {sendRequestJoiSchema} from './validation';
import {add} from 'date-fns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {collabRequestExtractor} from '../utils';
import {IUser} from '../../../definitions/user';
import {checkOrganizationExists} from '../../organizations/utils';
import CollaboratorQueries from '../../collaborator/queries';
import {ResourceExistsError} from '../../errors';
import CollaborationRequestQueries from '../queries';
import {getCollaboratorOrganization} from '../../collaborator/utils';

async function sendEmail(
  context: ISendRequestContext,
  request: ICollaborationRequest,
  toUser: IUser | null,
  organizationName: string
) {}

const sendRequest: SendRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, sendRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organization = await checkOrganizationExists(
    context,
    data.organizationId
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
