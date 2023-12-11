import {AppResourceTypeMap} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {checkTagNameExists} from '../checkTagNameExists';
import {tagExtractor} from '../utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';

const addTag: AddTagEndpoint = async instData => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await kUtilsInjectables.session().getAgent(instData);
  const workspace = await checkWorkspaceExistsWithAgent(agent, data.workspaceId);
  await checkAuthorizationWithAgent({
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'addTag'},
  });

  const tag = newWorkspaceResource<Tag>(
    agent,
    AppResourceTypeMap.Tag,
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
