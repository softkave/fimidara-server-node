import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  checkCollaborationRequestAuthorization02,
  collaborationRequestForWorkspaceExtractor,
} from '../utils';
import {GetWorkspaceCollaborationRequestEndpoint} from './types';
import {getWorkspaceCollaborationRequestJoiSchema} from './validation';

const getWorkspaceCollaborationRequest: GetWorkspaceCollaborationRequestEndpoint =
  async instData => {
    const data = validate(instData.data, getWorkspaceCollaborationRequestJoiSchema);
    const agent = await kUtilsInjectables
      .session()
      .getAgentFromReq(
        instData,
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
