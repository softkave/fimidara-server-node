import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {newWorkspaceResource} from '../../../utils/fns';
import {validate} from '../../../utils/validate';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {MemStore} from '../../contexts/mem/Mem';
import {checkWorkspaceExistsWithAgent} from '../../workspaces/utils';
import {checkTagNameExists} from '../checkTagNameExists';
import {tagExtractor} from '../utils';
import {AddTagEndpoint} from './types';
import {addTagJoiSchema} from './validation';

const addTag: AddTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, addTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const workspace = await checkWorkspaceExistsWithAgent(context, agent, data.workspaceId);
  await checkAuthorization({
    context,
    agent,
    workspaceId: workspace.resourceId,
    targets: [{type: AppResourceType.Tag}],
    action: BasicCRUDActions.Create,
  });

  const tag = newWorkspaceResource(agent, AppResourceType.Tag, workspace.resourceId, {
    ...data.tag,
  });
  await MemStore.withTransaction(context, async txn => {
    await checkTagNameExists(context, workspace.resourceId, data.tag.name, {transaction: txn});
    await context.semantic.tag.insertItem(tag, {transaction: txn});
  });

  return {tag: tagExtractor(tag)};
};

export default addTag;
