import {last, merge} from 'lodash';
import {Folder} from '../../definitions/folder';
import {PermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItem} from '../../definitions/permissionItem';
import {AppResourceType, AppRuntimeState, SessionAgent} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {FimidaraRuntimeConfig} from '../../resources/types';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {
  ID_SIZE,
  getNewIdForResource,
  getResourceTypeFromId,
  newWorkspaceResource,
} from '../../utils/resource';
import {makeUserSessionAgent} from '../../utils/sessionUtils';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {BaseContextType} from '../contexts/types';
import {createFolderListWithTransaction} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import EndpointReusableQueries from '../queries';
import {INTERNAL_forgotPassword} from '../users/forgotPassword/forgotPassword';
import {getUserToken} from '../users/login/utils';
import {INTERNAL_sendEmailVerificationCode} from '../users/sendEmailVerificationCode/handler';
import {INTERNAL_signupUser} from '../users/signup/utils';
import INTERNAL_createWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

export const APP_RUNTIME_STATE_DOC_ID = getNewIdForResource(
  AppResourceType.System,
  ID_SIZE,
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
  context: BaseContextType,
  agent: SessionAgent,
  name: string,
  rootname: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  return await INTERNAL_createWorkspace(
    context,
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

async function setupDefaultUser(
  context: BaseContextType,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  let user = await context.semantic.user.getByEmail(
    context.appVariables.rootUserEmail,
    opts
  );

  if (!user) {
    const isDevEnv =
      context.appVariables.nodeEnv === 'development' ||
      context.appVariables.nodeEnv === 'test';
    user = await INTERNAL_signupUser(
      context,
      {
        email: context.appVariables.rootUserEmail,
        firstName: context.appVariables.rootUserFirstName,
        lastName: context.appVariables.rootUserLastName,
        password: context.appVariables.rootUserEmail,
      },
      {
        requiresPasswordChange: isDevEnv ? false : true,
        isEmailVerified: isDevEnv ? true : false,
        isOnWaitlist: false,
      },
      opts
    );

    if (!isDevEnv) {
      await INTERNAL_forgotPassword(context, user, opts);
      await INTERNAL_sendEmailVerificationCode(context, user, opts);
    }
  }

  const userToken = await getUserToken(context, user.resourceId, opts);
  const agent = makeUserSessionAgent(user, userToken);
  return {user, userToken, agent};
}

async function setupFolders(
  context: BaseContextType,
  workspace: Workspace,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const workspaceImagesFolder = await createFolderListWithTransaction(
    context,
    SYSTEM_SESSION_AGENT,
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
  );
  const userImagesFolder = await createFolderListWithTransaction(
    context,
    SYSTEM_SESSION_AGENT,
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
  );
  appAssert(workspaceImagesFolder && userImagesFolder);
  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: BaseContextType,
  workspaceId: string,
  name: string,
  description: string,
  folder: Folder,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const imageUploadPermissionGroup = newWorkspaceResource<PermissionGroup>(
    SYSTEM_SESSION_AGENT,
    AppResourceType.PermissionGroup,
    workspaceId,
    {name, description}
  );
  const permissionItems: PermissionItem[] = [
    AppActionType.Create,
    AppActionType.Read,
  ].map(action => {
    const containerIds = folder.idPath.slice(0, -1);
    const targetParentId = containerIds.length ? last(containerIds) : workspaceId;
    appAssert(targetParentId);
    const targetParentType = getResourceTypeFromId(targetParentId);
    const item: PermissionItem = newWorkspaceResource<PermissionItem>(
      SYSTEM_SESSION_AGENT,
      AppResourceType.PermissionItem,
      workspaceId,
      {
        action,
        targetParentId,
        entityId: imageUploadPermissionGroup.resourceId,
        entityType: AppResourceType.PermissionGroup,
        targetId: folder.resourceId,
        targetType: AppResourceType.File,
        access: true,
      }
    );
    return item;
  });

  await Promise.all([
    await context.semantic.permissionGroup.insertItem(imageUploadPermissionGroup, opts),
    await context.semantic.permissionItem.insertItem(permissionItems, opts),
  ]);
  return imageUploadPermissionGroup;
}

export async function isRootWorkspaceSetup(
  context: BaseContextType,
  opts: SemanticDataAccessProviderRunOptions
) {
  const appRuntimeState = await context.data.appRuntimeState.getOneByQuery(
    EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID),
    opts
  );
  return appRuntimeState;
}

async function getRootWorkspace(
  context: BaseContextType,
  appRuntimeState: AppRuntimeState,
  opts?: SemanticDataAccessProviderRunOptions
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
  merge(context.appVariables, appRuntimeVars);
  const workspace = await context.semantic.workspace.getOneById(
    appRuntimeState.appWorkspaceId,
    opts
  );
  assertWorkspace(workspace);
  return workspace;
}

async function setupAppArtifacts(
  context: BaseContextType,
  agent: SessionAgent,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const appRuntimeState = await isRootWorkspaceSetup(context, opts);

  if (appRuntimeState) {
    return await getRootWorkspace(context, appRuntimeState, opts);
  }

  const {workspace} = await setupWorkspace(
    context,
    agent,
    appSetupVars.workspaceName,
    appSetupVars.rootname,
    opts
  );
  const [{workspaceImagesFolder, userImagesFolder}] = await Promise.all([
    setupFolders(context, workspace, opts),
  ]);
  const [appWorkspacesImageUploadPermissionGroup, appUsersImageUploadPermissionGroup] =
    await Promise.all([
      setupImageUploadPermissionGroup(
        context,
        workspace.resourceId,
        appSetupVars.workspacesImageUploadPermissionGroupName,
        'Auto-generated permission group for uploading images to the workspace images folder.',
        workspaceImagesFolder,
        opts
      ),
      setupImageUploadPermissionGroup(
        context,
        workspace.resourceId,
        appSetupVars.usersImageUploadPermissionGroupName,
        'Auto-generated permission group for uploading images to the user images folder.',
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
  await context.data.appRuntimeState.insertItem(
    {
      isAppSetup: true,
      resourceId: APP_RUNTIME_STATE_DOC_ID,
      ...appRuntimeVars,
      createdAt: getTimestamp(),
      lastUpdatedAt: getTimestamp(),
    },
    opts
  );
  merge(context.appVariables, appRuntimeVars);
  return workspace;
}

export async function setupApp(context: BaseContextType) {
  return await context.semantic.utils.withTxn(
    context,
    async opts => {
      const {agent} = await setupDefaultUser(context, opts);
      return await setupAppArtifacts(context, agent, opts);
    },
    undefined
  );
}
