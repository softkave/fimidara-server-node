import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {
  applyDefaultEndpointPaginationOptions,
  getEndpointPageFromInput,
} from '../../pagination';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {tagExtractor} from '../utils';
import {GetWorkspaceTagsEndpoint} from './types';
import {getWorkspaceTagsQuery} from './utils';
import {getWorkspaceTagJoiSchema} from './validation';

const getWorkspaceTags: GetWorkspaceTagsEndpoint = async instData => {
  const data = validate(instData.data, getWorkspaceTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspace = await checkWorkspaceExistsWithAgent(agent, data.workspaceId);
  const q = await getWorkspaceTagsQuery(agent, workspace);
  applyDefaultEndpointPaginationOptions(data);
  const tags = await kSemanticModels.tag().getManyByWorkspaceAndIdList(q, data);
  return {tags: tags.map(tag => tagExtractor(tag)), page: getEndpointPageFromInput(data)};
};

export default getWorkspaceTags;
