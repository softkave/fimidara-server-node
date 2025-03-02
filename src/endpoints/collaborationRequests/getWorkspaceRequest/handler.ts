import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils.js';
import {GetWorkspaceCollaborationRequestEndpoint} from './types.js';
import {getWorkspaceCollaborationRequestJoiSchema} from './validation.js';

const getWorkspaceCollaborationRequest: GetWorkspaceCollaborationRequestEndpoint =
  async reqData => {
    const data = validate(
      reqData.data,
      getWorkspaceCollaborationRequestJoiSchema
    );
    const agent = await kIjxUtils
      .session()
      .getAgentFromReq(
        reqData,
        kSessionUtils.permittedAgentTypes.api,
        kSessionUtils.accessScopes.api
      );
    const {request} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      'readAgentToken'
    );
    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default getWorkspaceCollaborationRequest;
