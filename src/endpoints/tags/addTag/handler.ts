import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {Tag} from '../../../definitions/tag.js';
import {newWorkspaceResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {checkTagNameExists} from '../checkTagNameExists.js';
import {tagExtractor} from '../utils.js';
import {AddTagEndpoint} from './types.js';
import {addTagJoiSchema} from './validation.js';

const addTag: AddTagEndpoint = async reqData => {
  const data = validate(reqData.data, addTagJoiSchema);
  const {agent, workspace} = await initEndpoint(reqData, {
    data,
    action: kFimidaraPermissionActions.addTag,
  });

  const tag = newWorkspaceResource<Tag>(
    agent,
    kFimidaraResourceType.Tag,
    workspace.resourceId,
    {...data}
  );
  await kSemanticModels.utils().withTxn(async opts => {
    await checkTagNameExists(workspace.resourceId, data.name, opts);
    await kSemanticModels.tag().insertItem(tag, opts);
  });

  return {tag: tagExtractor(tag)};
};

export default addTag;
