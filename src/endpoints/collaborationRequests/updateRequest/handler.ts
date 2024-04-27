import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {assertUpdateNotEmpty} from '../../utils';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {UpdateCollaborationRequestEndpoint} from './types';
import {updateCollaborationRequestJoiSchema} from './validation';

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
