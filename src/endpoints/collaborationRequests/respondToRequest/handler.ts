import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {collaborationRequestForUserExtractor} from '../utils.js';
import {RespondToCollaborationRequestEndpoint} from './types.js';
import {
  notifySenderOnCollaborationRequestResponse,
  respondToCollaborationRequest,
} from './utils.js';
import {respondToCollaborationRequestJoiSchema} from './validation.js';

const respondToCollaborationRequestEndpoint: RespondToCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(reqData.data, respondToCollaborationRequestJoiSchema);
    const {agent} = await initEndpoint(reqData, {data});

    const request = await kSemanticModels.utils().withTxn(async opts => {
      return await respondToCollaborationRequest(agent, data, opts);
    });

    // TODO: use change streams
    kUtilsInjectables
      .promises()
      .forget(notifySenderOnCollaborationRequestResponse(request));

    return {request: collaborationRequestForUserExtractor(request)};
  };

export default respondToCollaborationRequestEndpoint;
