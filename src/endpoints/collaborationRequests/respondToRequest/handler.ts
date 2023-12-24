import {kAppResourceType} from '../../../definitions/system';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {collaborationRequestForUserExtractor} from '../utils';
import {RespondToCollaborationRequestEndpoint} from './types';
import {
  INTERNAL_RespondToCollaborationRequest,
  notifyUserOnCollaborationRequestResponse,
} from './utils';
import {respondToCollaborationRequestJoiSchema} from './validation';

const respondToCollaborationRequest: RespondToCollaborationRequestEndpoint =
  async instData => {
    const data = validate(instData.data, respondToCollaborationRequestJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgent(instData, kAppResourceType.User);

    const request = await kSemanticModels.utils().withTxn(async opts => {
      return await INTERNAL_RespondToCollaborationRequest(agent, data, opts);
    });

    await notifyUserOnCollaborationRequestResponse(request, data.response);
    return {request: collaborationRequestForUserExtractor(request)};
  };

export default respondToCollaborationRequest;
