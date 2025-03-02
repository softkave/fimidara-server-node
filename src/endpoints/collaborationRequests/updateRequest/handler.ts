import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {assertUpdateNotEmpty} from '../../utils.js';
import {
  assertCollaborationRequest,
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {UpdateCollaborationRequestEndpoint} from './types.js';
import {updateCollaborationRequestJoiSchema} from './validation.js';

const updateCollaborationRequest: UpdateCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, updateCollaborationRequestJoiSchema);
    assertUpdateNotEmpty(data.request);
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );

    const {request} = await kIjxSemantic.utils().withTxn(async opts => {
      const {request, workspace} =
        await checkCollaborationRequestAuthorization02(
          agent,
          data.requestId,
          'updateCollaborationRequest',
          opts
        );

      const updatedRequest = await kIjxSemantic
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
    });

    // TODO: send email if request description changed
    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default updateCollaborationRequest;
