import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {collaborationRequestForUserExtractor} from '../utils';
import {RespondToCollaborationRequestEndpoint} from './types';
import {
  INTERNAL_RespondToCollaborationRequest,
  notifySenderOnCollaborationRequestResponse,
} from './utils';
import {respondToCollaborationRequestJoiSchema} from './validation';

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
