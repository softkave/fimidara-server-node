import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem.js';
import {appAssert} from '../../../utils/assertion.js';
import {validate} from '../../../utils/validate.js';
import {kSessionUtils} from '../../contexts/SessionContext.js';
import {kUtilsInjectables} from '../../contexts/injection/injectables.js';
import {checkTagAuthorization02} from '../utils.js';
import {DeleteTagEndpoint} from './types.js';
import {beginDeleteTag} from './utils.js';
import {deleteTagJoiSchema} from './validation.js';

const deleteTag: DeleteTagEndpoint = async instData => {
  const data = validate(instData.data, deleteTagJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  const {tag} = await checkTagAuthorization02(
    agent,
    data.tagId,
    kFimidaraPermissionActionsMap.deleteTag
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
