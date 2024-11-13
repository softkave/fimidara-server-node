import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {ServerError} from '../../../utils/errors.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {addFileBackendMount} from '../../fileBackends/addMount/utils.js';
import {addPermissionItems} from '../../permissions/addPermissionItems/utils.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkWorkspaceNameExists,
  checkWorkspaceRootnameExists,
} from '../checkWorkspaceExists.js';
import {workspaceExtractor} from '../utils.js';
import {finalizeRootname, isRootname} from '../utils/rootname.js';
import {AddWorkspaceEndpoint, NewWorkspaceInput} from './types.js';
import {addWorkspaceJoiSchema} from './validation.js';

interface INewWorkspaceParams {
  data: NewWorkspaceInput;
  seed?: Partial<Workspace>;
  agent: SessionAgent;
  parentWorkspaceId?: string;
  workspaceLevel: number;
}

function prepareNewWorkspace(params: INewWorkspaceParams): Workspace {
  const {data, seed, agent, workspaceLevel} = params;
  const parentWorkspaceId = seed?.workspaceId || params.parentWorkspaceId;
  appAssert(
    parentWorkspaceId,
    new ServerError(),
    'Parent workspace ID is required'
  );

  const createdAt = seed?.createdAt || getTimestamp();
  const id =
    seed?.resourceId || getNewIdForResource(kFimidaraResourceType.Workspace);
  const rootname =
    seed?.rootname ||
    (isRootname(data.rootname)
      ? data.rootname
      : finalizeRootname(workspaceLevel, data.rootname));
  appAssert(isRootname(rootname), new ServerError(), 'Invalid rootname');

  const workspace: Workspace = {
    rootname,
    createdAt,
    level: workspaceLevel,
    description: data.description,
    lastUpdatedAt: createdAt,
    lastUpdatedBy: agent,
    isDeleted: false,
    createdBy: agent,
    name: data.name,
    workspaceId: parentWorkspaceId,
    resourceId: id,
    ...seed,
  };

  return workspace;
}

async function assignWorkspaceCreatorPermissions(
  workspace: Workspace,
  agent: SessionAgent,
  opts: SemanticProviderMutationParams
) {
  await addPermissionItems(
    agent,
    workspace,
    {
      workspaceId: workspace.resourceId,
      items: [
        {
          access: true,
          action: kFimidaraPermissionActions.wildcard,
          entityId: agent.agentId,
          targetId: workspace.resourceId,
        },
      ],
    },
    opts
  );
}

async function createWorkspaceDefaultMounts(
  agent: SessionAgent,
  workspace: Workspace,
  opts: SemanticProviderMutationParams
) {
  await addFileBackendMount(
    agent,
    workspace,
    {
      backend: kFileBackendType.fimidara,
      name: kFileBackendType.fimidara,
      folderpath: workspace.rootname,
      mountedFrom: '',
      configId: null,
      weight: 0,
    },
    opts
  );
}

export const createWorkspace = async (
  params: INewWorkspaceParams,
  opts: SemanticProviderMutationParams
) => {
  const {data, seed, agent} = params;

  const checkParams = {...data, ...seed};
  await Promise.all([
    checkWorkspaceNameExists(checkParams, opts),
    checkWorkspaceRootnameExists(checkParams, opts),
  ]);

  const workspace = prepareNewWorkspace(params);
  await kSemanticModels.workspace().insertItem(workspace, opts);
  await Promise.all([
    assignWorkspaceCreatorPermissions(workspace, agent, opts),
    createWorkspaceDefaultMounts(agent, workspace, opts),
  ]);

  return {workspace};
};

const addWorkspaceEndpoint: AddWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, addWorkspaceJoiSchema);
  const {agent, getWorkspace} = await initEndpoint(reqData);
  const parentWorkspace = await getWorkspace(
    kFimidaraPermissionActions.addWorkspace
  );

  // TODO: how do we check something like waitlist?
  // TODO: how do we check email is verified?

  const {workspace} = await kSemanticModels.utils().withTxn(async opts => {
    return await createWorkspace(
      /** params */ {
        data,
        agent,
        parentWorkspaceId: parentWorkspace.resourceId,
        workspaceLevel: parentWorkspace.level + 1,
      },
      opts
    );
  });

  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspaceEndpoint;
