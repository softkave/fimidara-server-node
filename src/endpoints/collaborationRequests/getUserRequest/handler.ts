import {appAssert} from '../../../utils/assertion.js';
import {isStringEqual} from '../../../utils/fns.js';
import {kReuseableErrors} from '../../../utils/reusableErrors.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {assertCollaborationRequest, collaborationRequestForUserExtractor} from '../utils.js';
import {GetUserCollaborationRequestEndpoint} from './types.js';
import {getUserCollaborationRequestJoiSchema} from './validation.js';

const getUserCollaborationRequest: GetUserCollaborationRequestEndpoint =
  async instData => {
    const data = validate(instData.data, getUserCollaborationRequestJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
        kSessionUtils.permittedAgentTypes.user,
        kSessionUtils.accessScopes.user
      );
    const request = await kSemanticModels
      .collaborationRequest()
      .getOneById(data.requestId);

    assertCollaborationRequest(request);
    appAssert(
      isStringEqual(request.recipientEmail, agent.user?.email),
      kReuseableErrors.collaborationRequest.notFound()
    );

    return {request: collaborationRequestForUserExtractor(request)};
  };

export default getUserCollaborationRequest;
