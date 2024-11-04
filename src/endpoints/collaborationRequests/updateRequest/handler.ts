import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {assertUpdateNotEmpty} from '../../utils.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {UpdateCollaborationRequestEndpoint} from './types.js';
import {updateCollaborationRequestJoiSchema} from './validation.js';

const updateCollaborationRequestEndpoint: UpdateCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, updateCollaborationRequestJoiSchema);
    assertUpdateNotEmpty(data.request);
    const {agent, workspaceId} = await initEndpoint(reqData, {data});

    const {request} = await kSemanticModels.utils().withTxn(async opts => {
      const {request} = await checkCollaborationRequestAuthorization02({
        agent,
        workspaceId,
        requestId: data.requestId,
        action: kFimidaraPermissionActions.updateCollaborationRequest,
      });

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
      return {request: updatedRequest};
    });

    // TODO: send email if request description changed
    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default updateCollaborationRequestEndpoint;
