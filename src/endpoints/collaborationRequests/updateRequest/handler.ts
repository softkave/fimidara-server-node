import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {assertUpdateNotEmpty} from '../../utils';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {UpdateCollaborationRequestEndpoint} from './types';
import {updateCollaborationRequestJoiSchema} from './validation';

const updateCollaborationRequest: UpdateCollaborationRequestEndpoint = async (
  context,
  instData
) => {
  const data = validate(instData.data, updateCollaborationRequestJoiSchema);
  assertUpdateNotEmpty(data.request);
  const agent = await context.session.getAgent(context, instData);
  const {request} = await context.semantic.utils.withTxn(context, async opts => {
    const {request, workspace} = await checkCollaborationRequestAuthorization02(
      context,
      agent,
      data.requestId,
      'updateCollaborationRequest',
      opts
    );

    const updatedRequest =
      await context.semantic.collaborationRequest.getAndUpdateOneById(
        data.requestId,
        {
          message: data.request.message ?? request.message,
          expiresAt: data.request.expires,
          lastUpdatedAt: getTimestamp(),
          lastUpdatedBy: getActionAgentFromSessionAgent(agent),
        },
        opts
      );

    assertCollaborationRequest(updatedRequest);
    return {workspace, request: updatedRequest};
  });

  // TODO: send email if request description changed
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

export default updateCollaborationRequest;
