import {AppActionType} from '../../../definitions/system';
import {Tag} from '../../../definitions/tag';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {MemStore} from '../../contexts/mem/Mem';
import {SemanticDataAccessProviderMutationRunOptions} from '../../contexts/semantic/types';
import {checkTagNameExists} from '../checkTagNameExists';
import {checkTagAuthorization02, tagExtractor} from '../utils';
import {UpdateTagEndpoint} from './types';
import {updateTagJoiSchema} from './validation';

const updateTag: UpdateTagEndpoint = async (context, instData) => {
  const data = validate(instData.data, updateTagJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  let {workspace, tag} = await checkTagAuthorization02(
    context,
    agent,
    data.tagId,
    AppActionType.Read
  );
  const tagUpdate: Partial<Tag> = {
    ...data.tag,
    lastUpdatedAt: getTimestamp(),
    lastUpdatedBy: getActionAgentFromSessionAgent(agent),
  };

  tag = await MemStore.withTransaction(context, async txn => {
    const opts: SemanticDataAccessProviderMutationRunOptions = {transaction: txn};
    if (tagUpdate.name && tagUpdate.name !== tag.name)
      await checkTagNameExists(context, workspace.resourceId, tagUpdate.name, opts);
    return await context.semantic.tag.getAndUpdateOneById(data.tagId, tagUpdate, opts);
  });

  return {tag: tagExtractor(tag)};
};

export default updateTag;
