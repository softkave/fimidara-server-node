import {kFimidaraResourceType} from '../../../definitions/system.js';
import {Tag} from '../../../definitions/tag.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils.js';
import {checkTagNameExists} from '../checkTagNameExists.js';
import {tagExtractor} from '../utils.js';
import {AddTagEndpoint} from './types.js';
import {addTagJoiSchema} from './validation.js';

const addTag: AddTagEndpoint = async instData => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const workspace = await checkWorkspaceExistsWithAgent(
    agent,
    data.workspaceId
  );
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'addTag'},
  });

  const tag = newWorkspaceResource<Tag>(
    agent,
    kFimidaraResourceType.Tag,
    workspace.resourceId,
    {...data.tag}
  );
  await kSemanticModels.utils().withTxn(async opts => {
    await checkTagNameExists(workspace.resourceId, data.tag.name, opts);
    await kSemanticModels.tag().insertItem(tag, opts);
  });

  return {tag: tagExtractor(tag)};
};

export default addTag;
