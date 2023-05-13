import {AppActionType} from '../../../definitions/system';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {assertUpdateNotEmpty} from '../../utils';
import {
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

  let {request} = await executeWithMutationRunOptions(context, async opts => {
    let {request, workspace} = await checkCollaborationRequestAuthorization02(
      context,
      agent,
      data.requestId,
      AppActionType.Update,
      opts
    );

    [request] = await Promise.all([
      context.semantic.collaborationRequest.getAndUpdateOneById(
        data.requestId,
        {
          message: data.request.message ?? request.message,
          expiresAt: data.request.expires,
          lastUpdatedAt: getTimestamp(),
          lastUpdatedBy: getActionAgentFromSessionAgent(agent),
        },
        opts
      ),
    ]);

    return {workspace, request};
  });

  // TODO: send email if request description changed
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

export default updateCollaborationRequest;
