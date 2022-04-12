import {
  CollaborationRequestStatusType,
  ICollaborationRequest,
} from '../../../definitions/collaborationRequest';
import {BasicCRUDActions} from '../../../definitions/system';
import {
  collaborationRequestRevokedEmailHTML,
  collaborationRequestRevokedEmailText,
  collaborationRequestRevokedEmailTitle,
} from '../../../email-templates/collaborationRequestRevoked';
import {getDateString} from '../../../utilities/dateFns';
import {fireAndForgetPromise} from '../../../utilities/promiseFns';
import {validate} from '../../../utilities/validate';
import {IBaseContext} from '../../contexts/BaseContext';
import WorkspaceQueries from '../../workspaces/queries';
import EndpointReusableQueries from '../../queries';
import {
  checkCollaborationRequestAuthorization02,
  collabRequestExtractor,
} from '../utils';
import {RevokeRequestEndpoint} from './types';
import {revokeRequestJoiSchema} from './validation';

const revokeRequest: RevokeRequestEndpoint = async (context, instData) => {
  const data = validate(instData.data, revokeRequestJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {request} = await checkCollaborationRequestAuthorization02(
    context,
    agent,
    data.requestId,
    BasicCRUDActions.Update
  );

  const status = request.statusHistory[request.statusHistory.length - 1];
  const isRevoked = status.status === CollaborationRequestStatusType.Revoked;

  if (!isRevoked) {
    request = await context.data.collaborationRequest.assertUpdateItem(
      EndpointReusableQueries.getById(data.requestId),
      {
        statusHistory: request.statusHistory.concat({
          date: getDateString(),
          status: CollaborationRequestStatusType.Revoked,
        }),
      }
    );

    const workspace = await context.data.workspace.getItem(
      WorkspaceQueries.getById(request.workspaceId)
    );

    if (workspace) {
      fireAndForgetPromise(sendEmail(context, request, workspace.name));
    }
  }

  return {
    request: collabRequestExtractor(request),
  };
};

async function sendEmail(
  context: IBaseContext,
  request: ICollaborationRequest,
  workspaceName: string
) {
  const html = collaborationRequestRevokedEmailHTML({
    workspaceName,
  });

  const text = collaborationRequestRevokedEmailText({
    workspaceName,
  });

  await context.email.sendEmail(context, {
    subject: collaborationRequestRevokedEmailTitle(workspaceName),
    body: {html, text},
    destination: [request.recipientEmail],
    source: context.appVariables.appDefaultEmailAddressFrom,
  });
}

export default revokeRequest;
