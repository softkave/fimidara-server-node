import {kSessionUtils} from '../../../contexts/SessionContext.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getActionAgentFromSessionAgent} from '../../../utils/sessionUtils.js';
import {validate} from '../../../utils/validate.js';
import {checkWorkspaceNameExists} from '../checkWorkspaceExists.js';
import {
  assertWorkspace,
  checkWorkspaceAuthorization02,
  workspaceExtractor,
} from '../utils.js';
import {UpdateWorkspaceEndpoint} from './types.js';
import {updateWorkspaceJoiSchema} from './validation.js';

const updateWorkspace: UpdateWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, updateWorkspaceJoiSchema);
  const agent = await kUtilsInjectables
    .session()
    .getAgentFromReq(
      reqData,
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
  });

  return {workspace: workspaceExtractor(workspace)};
};

export default updateWorkspace;
