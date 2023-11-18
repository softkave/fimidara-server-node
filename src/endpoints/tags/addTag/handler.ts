import {AppResourceType} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {newWorkspaceResource} from '../../../utils/resource';
import {validate} from '../../../utils/validate';
import {checkAuthorizationWithAgent} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {checkTagNameExists} from '../checkTagNameExists';
import {tagExtractor} from '../utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';

const addTag: AddTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  await checkAuthorizationWithAgent({
    context,
    agent,
    workspace,
    workspaceId: workspace.resourceId,
    target: {targetId: workspace.resourceId, action: 'addTag'},
  });

  const tag = newWorkspaceResource<Tag>(
    agent,
    AppResourceType.Tag,
    workspace.resourceId,
    {...data.tag}
  );
  await context.semantic.utils.withTxn(context, async opts => {
    await checkTagNameExists(context, workspace.resourceId, data.tag.name, opts);
    await context.semantic.tag.insertItem(tag, opts);
  });

  return {tag: tagExtractor(tag)};
};

export default addTag;
