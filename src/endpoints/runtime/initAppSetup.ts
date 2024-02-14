import assert from 'assert';
import {last} from 'lodash';
import {Folder} from '../../definitions/folder';
import {PermissionGroup} from '../../definitions/permissionGroups';
import {
  PermissionAction,
  PermissionItem,
  kPermissionsMap,
} from '../../definitions/permissionItem';
import {AppRuntimeState, SessionAgent, kAppResourceType} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {FimidaraRuntimeConfig} from '../../resources/config';
import {kSystemSessionAgent} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {getNewIdForResource, kIdSize, newWorkspaceResource} from '../../utils/resource';
import {makeUserSessionAgent} from '../../utils/sessionUtils';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../contexts/injection/register';
import {
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../contexts/semantic/types';
import {createFolderListWithTransaction} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import EndpointReusableQueries from '../queries';
import {INTERNAL_forgotPassword} from '../users/forgotPassword/forgotPassword';
import {getUserToken} from '../users/login/utils';
import {INTERNAL_sendEmailVerificationCode} from '../users/sendEmailVerificationCode/handler';
import {INTERNAL_signupUser} from '../users/signup/utils';
import INTERNAL_createWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

// TODO: there's currently a backwards way of doing things, where we first
// initialize app before we run unit tests, meaning, the same things we're
// trying to test are required to work before we can even test them. We need to
// fix this for unit tests at the very least, but it may be okay for integration
// tests.

export const kAppRuntimeStatsDocId = getNewIdForResource(
  kAppResourceType.System,
  kIdSize,
  true
);
const imagesPath = '/files/images';
const appSetupVars = {
  workspaceName: 'Fimidara',
  rootname: 'fimidara',
  workspaceImagesfolderpath: imagesPath + '/workspaces',
  userImagesfolderpath: imagesPath + '/users',
  workspacesImageUploadPermissionGroupName: 'Fimidara workspaces image upload',
  usersImageUploadPermissionGroupName: 'Fimidara users image upload',
};

async function setupWorkspace(
  agent: SessionAgent,
  name: string,
  rootname: string,
  opts: SemanticProviderMutationTxnOptions
) {
  return await INTERNAL_createWorkspace(
    {
      name,
      rootname,
      description: "System-generated workspace for Fimidara's own operations",
    },
    agent,
    agent.agentId,
    opts
  );
}

async function setupDefaultUser(opts: SemanticProviderMutationTxnOptions) {
  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  const nodeEnv = process.env.NODE_ENV;
  assert(suppliedConfig.rootUserEmail);
  assert(suppliedConfig.rootUserFirstName);
  assert(suppliedConfig.rootUserLastName);

  let user = await kSemanticModels.user().getByEmail(suppliedConfig.rootUserEmail, opts);

  if (!user) {
    const isDeRelatedvEnv = nodeEnv === 'development' || nodeEnv === 'test';
    user = await INTERNAL_signupUser(
      {
        email: suppliedConfig.rootUserEmail,
        firstName: suppliedConfig.rootUserFirstName,
        lastName: suppliedConfig.rootUserLastName,
        password: suppliedConfig.rootUserEmail,
      },
      {
        requiresPasswordChange: isDeRelatedvEnv ? false : true,
        isEmailVerified: isDeRelatedvEnv ? true : false,
        isOnWaitlist: false,
      },
      opts
    );

    if (!isDeRelatedvEnv) {
      await INTERNAL_forgotPassword(user);
      await INTERNAL_sendEmailVerificationCode(user);
    }
  }

  const userToken = await getUserToken(user.resourceId, opts);
  const agent = makeUserSessionAgent(user, userToken);
  return {user, userToken, agent};
}

async function setupFolders(
  workspace: Workspace,
  opts: SemanticProviderMutationTxnOptions
) {
  const [workspaceImagesFolders, userImagesFolders] = await Promise.all([
    createFolderListWithTransaction(
      kSystemSessionAgent,
      workspace,
      {
        folderpath: addRootnameToPath(
          appSetupVars.workspaceImagesfolderpath,
          workspace.rootname
        ),
      },
      /** skip auth check */ true,
      /** throw on folder exists */ false,
      opts
    ),
    createFolderListWithTransaction(
      kSystemSessionAgent,
      workspace,
      {
        folderpath: addRootnameToPath(
          appSetupVars.userImagesfolderpath,
          workspace.rootname
        ),
      },
      /** skip auth check */ true,
      /** throw on folder exists */ false,
      opts
    ),
  ]);

  const workspaceImagesFolder =
    last(workspaceImagesFolders.existingFolders) ||
    last(workspaceImagesFolders.newFolders);
  const userImagesFolder =
    last(userImagesFolders.existingFolders) || last(userImagesFolders.newFolders);

  appAssert(workspaceImagesFolder);
  appAssert(userImagesFolder);
  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  workspaceId: string,
  name: string,
  description: string,
  folder: Folder,
  opts: SemanticProviderMutationTxnOptions
) {
  const imageUploadPermissionGroup = newWorkspaceResource<PermissionGroup>(
    kSystemSessionAgent,
    kAppResourceType.PermissionGroup,
    workspaceId,
    {name, description}
  );
  const actions: PermissionAction[] = [
    kPermissionsMap.uploadFile,
    kPermissionsMap.readFile,
  ];
  const permissionItems: PermissionItem[] = actions.map(action => {
    const containerIds = folder.idPath.slice(0, -1);
    const targetParentId = containerIds.length ? last(containerIds) : workspaceId;
    appAssert(targetParentId);
    const item: PermissionItem = newWorkspaceResource<PermissionItem>(
      kSystemSessionAgent,
      kAppResourceType.PermissionItem,
      workspaceId,
      {
        action,
        targetParentId,
        entityId: imageUploadPermissionGroup.resourceId,
        entityType: kAppResourceType.PermissionGroup,
        targetId: folder.resourceId,
        targetType: kAppResourceType.File,
        access: true,
      }
    );
    return item;
  });

  await Promise.all([
    await kSemanticModels.permissionGroup().insertItem(imageUploadPermissionGroup, opts),
    await kSemanticModels.permissionItem().insertItem(permissionItems, opts),
  ]);
  return imageUploadPermissionGroup;
}

export async function isRootWorkspaceSetup(opts: SemanticProviderTxnOptions) {
  const appRuntimeState = await kDataModels
    .appRuntimeState()
    .getOneByQuery(EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId), opts);
  return appRuntimeState;
}

async function getRootWorkspace(
  appRuntimeState: AppRuntimeState,
  opts?: SemanticProviderTxnOptions
) {
  const appRuntimeVars: Pick<
    FimidaraRuntimeConfig,
    | 'appWorkspaceId'
    | 'appUsersImageUploadPermissionGroupId'
    | 'appWorkspacesImageUploadPermissionGroupId'
  > = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
    appWorkspacesImageUploadPermissionGroupId:
      appRuntimeState.appWorkspacesImageUploadPermissionGroupId,
    appUsersImageUploadPermissionGroupId:
      appRuntimeState.appUsersImageUploadPermissionGroupId,
  };

  kRegisterUtilsInjectables.runtimeConfig(appRuntimeVars);
  const workspace = await kSemanticModels
    .workspace()
    .getOneById(appRuntimeState.appWorkspaceId, opts);
  assertWorkspace(workspace);
  return workspace;
}

async function setupAppArtifacts(
  agent: SessionAgent,
  opts: SemanticProviderMutationTxnOptions
) {
  const appRuntimeState = await isRootWorkspaceSetup(opts);

  if (appRuntimeState) {
    return await getRootWorkspace(appRuntimeState, opts);
  }

  const {workspace} = await setupWorkspace(
    agent,
    appSetupVars.workspaceName,
    appSetupVars.rootname,
    opts
  );
  const [{workspaceImagesFolder, userImagesFolder}] = await Promise.all([
    setupFolders(workspace, opts),
  ]);
  const [appWorkspacesImageUploadPermissionGroup, appUsersImageUploadPermissionGroup] =
    await Promise.all([
      setupImageUploadPermissionGroup(
        workspace.resourceId,
        appSetupVars.workspacesImageUploadPermissionGroupName,
        'Auto-generated permission group for uploading images to the workspace images folder',
        workspaceImagesFolder,
        opts
      ),
      setupImageUploadPermissionGroup(
        workspace.resourceId,
        appSetupVars.usersImageUploadPermissionGroupName,
        'Auto-generated permission group for uploading images to the user images folder',
        userImagesFolder,
        opts
      ),
    ]);

  const appRuntimeVars: Pick<
    FimidaraRuntimeConfig,
    | 'appWorkspaceId'
    | 'appUsersImageUploadPermissionGroupId'
    | 'appWorkspacesImageUploadPermissionGroupId'
  > = {
    appWorkspaceId: workspace.resourceId,
    appWorkspacesImageUploadPermissionGroupId:
      appWorkspacesImageUploadPermissionGroup.resourceId,
    appUsersImageUploadPermissionGroupId: appUsersImageUploadPermissionGroup.resourceId,
  };
  await kDataModels.appRuntimeState().insertItem(
    {
      isAppSetup: true,
      resourceId: kAppRuntimeStatsDocId,
      ...appRuntimeVars,
      createdAt: getTimestamp(),
      lastUpdatedAt: getTimestamp(),
    },
    opts
  );

  kRegisterUtilsInjectables.runtimeConfig(appRuntimeVars);
  return workspace;
}

export async function setupApp() {
  return await kSemanticModels.utils().withTxn(async opts => {
    const {agent} = await setupDefaultUser(opts);
    return await setupAppArtifacts(agent, opts);
  });
}
