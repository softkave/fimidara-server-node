import {appAssert} from '../../../utils/assertion';
import {isStringEqual} from '../../../utils/fns';
import {kReuseableErrors} from '../../../utils/reusableErrors';
import {validate} from '../../../utils/validate';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {assertCollaborationRequest, collaborationRequestForUserExtractor} from '../utils';
import {GetUserCollaborationRequestEndpoint} from './types';
import {getUserCollaborationRequestJoiSchema} from './validation';

const getUserCollaborationRequest: GetUserCollaborationRequestEndpoint =
  async instData => {
    const data = validate(instData.data, getUserCollaborationRequestJoiSchema);
    const agent = await kUtilsInjectables.session().getAgent(instData);
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
