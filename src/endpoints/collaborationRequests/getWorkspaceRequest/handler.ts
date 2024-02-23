import {validate} from '../../../utils/validate';
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
    const agent = await kUtilsInjectables.session().getAgent(instData);
    const {request} = await checkCollaborationRequestAuthorization02(
      agent,
      data.requestId,
      'readAgentToken'
    );
    return {request: collaborationRequestForWorkspaceExtractor(request)};
  };

export default getWorkspaceCollaborationRequest;
