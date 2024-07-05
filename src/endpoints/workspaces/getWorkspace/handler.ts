import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils.js';
import {GetWorkspaceEndpoint} from './types.js';
import {getWorkspaceJoiSchema} from './validation.js';

const getWorkspace: GetWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, getWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {workspace} = await checkWorkspaceAuthorization02(
    agent,
    'readWorkspace',
    data.workspaceId
  );
  return {workspace: workspaceExtractor(workspace)};
};

export default getWorkspace;
