import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {collaborationRequestForUserExtractor} from '../utils.js';
import {RespondToCollaborationRequestEndpoint} from './types.js';
import {
  INTERNAL_RespondToCollaborationRequest,
  notifySenderOnCollaborationRequestResponse,
} from './utils.js';
import {respondToCollaborationRequestJoiSchema} from './validation.js';

const respondToCollaborationRequest: RespondToCollaborationRequestEndpoint =
  async instData => {
    const data = validate(instData.data, respondToCollaborationRequestJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.user,
        kSessionUtils.accessScopes.user
      );

    const request = await kSemanticModels.utils().withTxn(async opts => {
      return await INTERNAL_RespondToCollaborationRequest(agent, data, opts);
    }, /** reuseTxn */ false);

    await notifySenderOnCollaborationRequestResponse(request);
    return {request: collaborationRequestForUserExtractor(request)};
  };

export default respondToCollaborationRequest;
