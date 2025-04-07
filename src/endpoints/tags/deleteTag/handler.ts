import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {checkTagAuthorization02} from '../utils.js';
import {DeleteTagEndpoint} from './types.js';
import {beginDeleteTag} from './utils.js';
import {deleteTagJoiSchema} from './validation.js';

const deleteTag: DeleteTagEndpoint = async reqData => {
  const data = validate(reqData.data, deleteTagJoiSchema);
  const agent = await kIjxUtils
    .session()
    .getAgentFromReq(
      reqData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {tag} = await checkTagAuthorization02(
    agent,
    data.tagId,
    kFimidaraPermissionActions.deleteTag
  );

  const [job] = await beginDeleteTag({
    agent,
    workspaceId: tag.workspaceId,
    resources: [tag],
  });
  appAssert(job, 'Could not create delete tag job');

  return {jobId: job.resourceId};
};

export default deleteTag;
