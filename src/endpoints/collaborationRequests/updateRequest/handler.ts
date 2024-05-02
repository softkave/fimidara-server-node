import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {assertUpdateNotEmpty} from '../../utils.js';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {UpdateCollaborationRequestEndpoint} from './types.js';
import {updateCollaborationRequestJoiSchema} from './validation.js';

const updateCollaborationRequest: UpdateCollaborationRequestEndpoint = async instData => {
  const data = validate(instData.data, updateCollaborationRequestJoiSchema);
  assertUpdateNotEmpty(data.request);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );

  const {request} = await kSemanticModels.utils().withTxn(async opts => {
    const {request, workspace} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      'updateCollaborationRequest',
      opts
    );

    const updatedRequest = await kSemanticModels
      .collaborationRequest()
      .getAndUpdateOneById(
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
  }, /** reuseTxn */ false);

  // TODO: send email if request description changed
  return {request: collaborationRequestForWorkspaceExtractor(request)};
};

export default updateCollaborationRequest;
