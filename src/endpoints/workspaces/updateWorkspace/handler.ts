import {Workspace} from '../../../definitions/workspace';
import {getTimestamp} from '../../../utils/dateFns';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils';
import {validate} from '../../../utils/validate';
import {kSessionUtils} from '../../contexts/SessionContext';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {checkWorkspaceNameExists} from '../checkWorkspaceExists';
import {
  assertWorkspace,
  checkWorkspaceAuthorization02,
  workspaceExtractor,
} from '../utils';
import {UpdateWorkspaceEndpoint} from './types';
import {updateWorkspaceJoiSchema} from './validation';

const updateWorkspace: UpdateWorkspaceEndpoint = async instData => {
  const data = validate(instData.data, updateWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      instData,
      kSessionUtils.permittedAgentTypes.api,
      kSessionUtils.accessScopes.api
    );
  let {workspace} = await checkWorkspaceAuthorization02(
    agent,
    'updateWorkspace',
    data.workspaceId
  );

  workspace = await kSemanticModels.utils().withTxn(async opts => {
    await Promise.all([
      data.workspace.name && data.workspace.name !== workspace.name
        ? checkWorkspaceNameExists(data.workspace.name, opts)
        : undefined,
    ]);
    const update: Partial<Workspace> = {
      ...data.workspace,
      lastUpdatedAt: getTimestamp(),
      lastUpdatedBy: getActionAgentFromSessionAgent(agent),
    };
    const updatedWorkspace = await kSemanticModels
      .workspace()
      .getAndUpdateOneById(workspace.resourceId, update, opts);
    assertWorkspace(updatedWorkspace);
    return updatedWorkspace;
  }, /** reuseTxn */ false);

  return {workspace: workspaceExtractor(workspace)};
};

export default updateWorkspace;
