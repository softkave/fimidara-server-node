import {kFimidaraPermissionActionsMap} from '../../../definitions/permissionItem';
import {appAssert} from '../../../utils/assertion';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkTagAuthorization02} from '../utils';
import {DeleteTagEndpoint} from './types';
import {beginDeleteTag} from './utils';
import {deleteTagJoiSchema} from './validation';

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
