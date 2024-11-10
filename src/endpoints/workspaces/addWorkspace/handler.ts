import {defaultTo} from 'lodash-es';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../../contexts/semantic/types.js';
import {kFileBackendType} from '../../../definitions/fileBackend.js';
import {kFimidaraPermissionActions} from '../../../definitions/permissionItem.js';
import {
  kFimidaraResourceType,
  SessionAgent,
} from '../../../definitions/system.js';
import {Workspace} from '../../../definitions/workspace.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import {validate} from '../../../utils/validate.js';
import {addFileBackendMount} from '../../fileBackends/addMount/utils.js';
import {initEndpoint} from '../../utils/initEndpoint.js';
import {
  checkWorkspaceNameExists,
  checkWorkspaceRootnameExists,
} from '../checkWorkspaceExists.js';
import {workspaceExtractor} from '../utils.js';
import {AddWorkspaceEndpoint, NewWorkspaceInput} from './types.js';
import {addWorkspaceJoiSchema} from './validation.js';

const createWorkspace = async (
  params: {
    data: NewWorkspaceInput;
    seed?: Partial<Workspace>;
    agent: SessionAgent;
    workspace?: Workspace;
  },
  opts: SemanticProviderMutationParams
) => {
  const {data, seed, agent, workspace: parentWorkspace} = params;

  const checkParams = {...data, ...seed};
  await Promise.all([
    checkWorkspaceNameExists(checkParams, opts),
    checkWorkspaceRootnameExists(checkParams, opts),
  ]);

  const createdAt = seed?.createdAt || getTimestamp();
  const id =
    seed?.resourceId || getNewIdForResource(kFimidaraResourceType.Workspace);
  const workspace: Workspace = {
    createdAt,
    description: data.description,
    lastUpdatedAt: createdAt,
    rootname: data.rootname,
    rootnamepath: defaultTo(parentWorkspace?.rootnamepath, []).concat(
      data.rootname
    ),
    lastUpdatedBy: agent,
    isDeleted: false,
    createdBy: agent,
    name: data.name,
    workspaceId: parentWorkspace?.resourceId || id,
    resourceId: id,
    ...seed,
  };

  await kSemanticModels.workspace().insertItem(workspace, opts);
  await addFileBackendMount(
    agent,
    workspace,
    {
      backend: kFileBackendType.fimidara,
      name: kFileBackendType.fimidara,
      folderpath: workspace.rootnamepath
        ? workspace.rootnamepath.join('/')
        : workspace.rootname,
      mountedFrom: '',
      configId: null,
      index: 0,
    },
    opts
  );

  return {workspace};
};

const addWorkspaceEndpoint: AddWorkspaceEndpoint = async reqData => {
  const data = validate(reqData.data, addWorkspaceJoiSchema);
  const {agent, getWorkspace} = await initEndpoint(reqData);
  const parentWorkspace = await getWorkspace(
    kFimidaraPermissionActions.addWorkspace
  );

  // TODO: add * permission to creator
  // TODO: how do we check something like waitlist?
  // TODO: how do we check email is verified?

  const {workspace} = await kSemanticModels.utils().withTxn(async opts => {
    return await createWorkspace(
      /** params */ {data, agent, workspace: parentWorkspace},
      opts
    );
  });

  return {workspace: workspaceExtractor(workspace)};
};

export default addWorkspaceEndpoint;
