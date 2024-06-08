import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils.js';
import {getWorkspaceTagsQuery} from '../getWorkspaceTags/utils.js';
import {CountWorkspaceTagsEndpoint} from './types.js';
import {countWorkspaceTagJoiSchema} from './validation.js';

const countWorkspaceTags: CountWorkspaceTagsEndpoint = async instData => {
  const data = validate(instData.data, countWorkspaceTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspace = await checkWorkspaceExistsWithAgent(agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(agent, workspace);
  const count = await kSemanticModels.tag().countManyByWorkspaceAndIdList(q);
  return {count};
};

export default countWorkspaceTags;
