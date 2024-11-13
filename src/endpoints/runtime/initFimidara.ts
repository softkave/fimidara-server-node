import assert from 'assert';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register.js';
import {PermissionGroup} from '../../definitions/permissionGroups.js';
import {FimidaraPermissionAction} from '../../definitions/permissionItem.js';
import {
  AppRuntimeState,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {FimidaraRuntimeConfig} from '../../resources/config.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {getNewIdForResource, kIdSize} from '../../utils/resource.js';
import {createPermissionGroup} from '../permissions/addPermissionGroup/handler.js';
import {addPermissionItems} from '../permissions/addPermissionItems/utils.js';
import EndpointReusableQueries from '../queries.js';
import {createWorkspace} from '../workspaces/addWorkspace/handler.js';
import {assertWorkspace} from '../workspaces/utils.js';

export const kAppRuntimeStatsDocId = getNewIdForResource(
  kFimidaraResourceType.System,
  kIdSize,
  /** id0 */ true
);

async function setupWorkspace(
  agent: SessionAgent,
  name: string,
  rootname: string
) {
  const result = await kSemanticModels.utils().withTxn(async opts => {
    const existingWorkspace = await kSemanticModels
      .workspace()
      .getByRootname({rootname});

    if (existingWorkspace) {
      return {workspace: existingWorkspace};
    }

    return await createWorkspace(
      {
        agent,
        data: {
          name,
          rootname,
          description:
            "System-generated workspace for fimidara's own operations",
        },
        workspaceLevel: 0,
      },
      opts
    );
  });

  return result;
}

export async function isRootWorkspaceSetup() {
  return await kDataModels
    .appRuntimeState()
    .getOneByQuery(
      EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
    );
}

async function getRootWorkspace(appRuntimeState: AppRuntimeState) {
  const appRuntimeVars: FimidaraRuntimeConfig = {
    rootWorkspaceId: appRuntimeState.rootWorkspaceId,
    publicPermissionGroupId: appRuntimeState.publicPermissionGroupId,
  };

  kRegisterUtilsInjectables.runtimeConfig(appRuntimeVars);
  const workspace = await kSemanticModels
    .workspace()
    .getOneById(appRuntimeState.rootWorkspaceId);
  assertWorkspace(workspace);

  return workspace;
}

async function insertRuntimeVars(
  workspaceId: string,
  publicPermissionGroupId: string
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const appRuntimeVars: FimidaraRuntimeConfig = {
      publicPermissionGroupId,
      rootWorkspaceId: workspaceId,
    };

    await kDataModels.appRuntimeState().insertItem(
      {
        isAppSetup: true,
        resourceId: kAppRuntimeStatsDocId,
        ...appRuntimeVars,
        createdAt: getTimestamp(),
        lastUpdatedAt: getTimestamp(),
        isDeleted: false,
      },
      opts
    );

    return {appRuntimeVars};
  });
}

async function setupPublicPermissionGroup(
  agent: SessionAgent,
  workspace: Workspace
): Promise<PermissionGroup> {
  const {publicPermissionGroupName} = kUtilsInjectables.suppliedConfig();
  assert.ok(publicPermissionGroupName, 'publicPermissionGroupName is required');

  return await createPermissionGroup(agent, workspace.resourceId, {
    name: publicPermissionGroupName,
    description: 'System-wide public permission group',
  });
}

async function setupPublicPermissions(
  agent: SessionAgent,
  workspace: Workspace,
  pg: PermissionGroup
) {
  const {publicPermissions} = kUtilsInjectables.suppliedConfig();

  if (!publicPermissions || publicPermissions.length === 0) {
    return;
  }

  await addPermissionItems(agent, workspace, {
    workspaceId: workspace.resourceId,
    items: publicPermissions.map(action => ({
      action: action as FimidaraPermissionAction,
      access: true,
      entityId: pg.resourceId,
      targetId: workspace.resourceId,
    })),
  });
}

async function setupAppArtifacts(agent: SessionAgent) {
  const {rootWorkspaceName, rootWorkspaceRootname} =
    kUtilsInjectables.suppliedConfig();
  assert.ok(rootWorkspaceName, 'rootWorkspaceName is required');
  assert.ok(rootWorkspaceRootname, 'rootWorkspaceRootname is required');

  const {workspace} = await setupWorkspace(
    agent,
    rootWorkspaceName,
    rootWorkspaceRootname
  );

  const pg = await setupPublicPermissionGroup(agent, workspace);
  await setupPublicPermissions(agent, workspace, pg);

  const {appRuntimeVars} = await insertRuntimeVars(
    workspace.resourceId,
    pg.resourceId
  );
  kRegisterUtilsInjectables.runtimeConfig(appRuntimeVars);

  return workspace;
}

export async function initFimidara() {
  const appRuntimeState = await isRootWorkspaceSetup();

  if (appRuntimeState) {
    return await getRootWorkspace(appRuntimeState);
  }

  const appArtifacts = await setupAppArtifacts(kSystemSessionAgent);
  return appArtifacts;
}
