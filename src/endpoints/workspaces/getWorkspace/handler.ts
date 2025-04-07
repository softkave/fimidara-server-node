import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {validate} from '../../../utils/validate.js';
import {checkWorkspaceAuthorization02, workspaceExtractor} from '../utils.js';
import {GetWorkspaceEndpoint} from './types.js';
import {getWorkspaceJoiSchema} from './validation.js';

const getWorkspace: GetWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, getWorkspaceJoiSchema);
  const agent = await kIjxUtils
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
