import {merge} from 'lodash';
import {PermissionGroup} from '../../definitions/permissionGroups';
import {PermissionItem, PermissionItemAppliesTo} from '../../definitions/permissionItem';
import {
  AppActionType,
  AppResourceType,
  AppRuntimeState,
  SessionAgent,
} from '../../definitions/system';
import {Workspace} from '../../definitions/workspace';
import {AppRuntimeVars} from '../../resources/types';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {appAssert} from '../../utils/assertion';
import {getTimestamp} from '../../utils/dateFns';
import {ID_SIZE, getNewIdForResource, newWorkspaceResource} from '../../utils/resource';
import {makeUserSessionAgent} from '../../utils/sessionUtils';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../contexts/semantic/types';
import {executeWithMutationRunOptions} from '../contexts/semantic/utils';
import {BaseContextType} from '../contexts/types';
import {createFolderList} from '../folders/addFolder/handler';
import {addRootnameToPath} from '../folders/utils';
import EndpointReusableQueries from '../queries';
import {INTERNAL_forgotPassword} from '../users/forgotPassword/forgotPassword';
import {getUserToken} from '../users/login/utils';
import {INTERNAL_sendEmailVerificationCode} from '../users/sendEmailVerificationCode/handler';
import {INTERNAL_signupUser} from '../users/signup/utils';
import INTERNAL_createWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace';
import {assertWorkspace} from '../workspaces/utils';

export const APP_RUNTIME_STATE_DOC_ID = getNewIdForResource(AppResourceType.System, ID_SIZE, true);
const imagesPath = '/files/images';
const appSetupVars = {
  workspaceName: 'Fimidara',
  rootname: 'fimidara',
  workspaceImagesfolderpath: imagesPath + '/workspaces',
  userImagesfolderpath: imagesPath + '/users',
  workspacesImageUploadPermissionGroupName: 'Fimidara-workspaces-image-upload',
  usersImageUploadPermissionGroupName: 'Fimidara-users-image-upload',
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

async function setupDefaultUser(context: BaseContextType) {
  return executeWithMutationRunOptions(context, async opts => {
    let user = await context.semantic.user.getByEmail(context.appVariables.rootUserEmail, opts);

    if (!user) {
      const isDevEnv =
        context.appVariables.nodeEnv === 'development' || context.appVariables.nodeEnv === 'test';
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

    const [userToken] = await Promise.all([getUserToken(context, user.resourceId, opts)]);
    const agent = makeUserSessionAgent(user, userToken);
    return {user, userToken, agent};
  });
}

async function setupFolders(
  context: BaseContextType,
  workspace: Workspace,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const [workspaceImagesFolder, userImagesFolder] = await Promise.all([
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.workspaceImagesfolderpath, workspace.rootname)},
      opts,
      /** skip auth check */ true,
      /** throw on folder exists */ false
    ),
    createFolderList(
      context,
      SYSTEM_SESSION_AGENT,
      workspace,
      {folderpath: addRootnameToPath(appSetupVars.userImagesfolderpath, workspace.rootname)},
      opts,
      /** skip auth check */ true,
      /** throw on folder exists */ false
    ),
  ]);

  appAssert(workspaceImagesFolder && userImagesFolder);
  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  context: BaseContextType,
  workspaceId: string,
  name: string,
  description: string,
  folderId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const imageUploadPermissionGroup = newWorkspaceResource<PermissionGroup>(
    SYSTEM_SESSION_AGENT,
    AppResourceType.PermissionGroup,
    workspaceId,
    {name, description}
  );
  const permissionItems: PermissionItem[] = [AppActionType.Create, AppActionType.Read].map(
    action => {
      const item: PermissionItem = newWorkspaceResource<PermissionItem>(
        SYSTEM_SESSION_AGENT,
        AppResourceType.PermissionItem,
        workspaceId,
        {
          action,
          entityId: imageUploadPermissionGroup.resourceId,
          entityType: AppResourceType.PermissionGroup,
          targetId: folderId,
          targetType: AppResourceType.File,
          grantAccess: true,
          appliesTo: PermissionItemAppliesTo.ChildrenOfType,
        }
      );
      return item;
    }
  );

  await Promise.all([
    await context.semantic.permissionGroup.insertItem(imageUploadPermissionGroup, opts),
    await context.semantic.permissionItem.insertItem(permissionItems, opts),
  ]);

  return imageUploadPermissionGroup;
}

async function isRootWorkspaceSetup(context: BaseContextType) {
  const appRuntimeState = await context.data.appRuntimeState.getOneByQuery(
    EndpointReusableQueries.getByResourceId(APP_RUNTIME_STATE_DOC_ID)
  );
  return appRuntimeState;
}

async function getRootWorkspace(
  context: BaseContextType,
  appRuntimeState: AppRuntimeState,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const appRuntimeVars: AppRuntimeVars = {
    appWorkspaceId: appRuntimeState.appWorkspaceId,
    appWorkspacesImageUploadPermissionGroupId:
      appRuntimeState.appWorkspacesImageUploadPermissionGroupId,
    appUsersImageUploadPermissionGroupId: appRuntimeState.appUsersImageUploadPermissionGroupId,
  };
  merge(context.appVariables, appRuntimeVars);
  const workspace = await context.semantic.workspace.getOneById(
    appRuntimeState.appWorkspaceId,
    opts
  );
  assertWorkspace(workspace);
  return workspace;
}

async function setupAppWithMutationOptions(
  context: BaseContextType,
  agent: SessionAgent,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const appRuntimeState = await isRootWorkspaceSetup(context);
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
        workspaceImagesFolder.resourceId,
        opts
      ),
      setupImageUploadPermissionGroup(
        context,
        workspace.resourceId,
        appSetupVars.usersImageUploadPermissionGroupName,
        'Auto-generated permission group for uploading images to the user images folder.',
        userImagesFolder.resourceId,
        opts
      ),
    ]);

  const appRuntimeVars: AppRuntimeVars = {
    appWorkspaceId: workspace.resourceId,
    appWorkspacesImageUploadPermissionGroupId: appWorkspacesImageUploadPermissionGroup.resourceId,
    appUsersImageUploadPermissionGroupId: appUsersImageUploadPermissionGroup.resourceId,
  };
  await context.data.appRuntimeState.insertItem({
    isAppSetup: true,
    resourceId: APP_RUNTIME_STATE_DOC_ID,
    ...appRuntimeVars,
    createdAt: getTimestamp(),
    lastUpdatedAt: getTimestamp(),
  });
  merge(context.appVariables, appRuntimeVars);

  return workspace;
}

export async function setupApp(context: BaseContextType) {
  const {agent} = await setupDefaultUser(context);
  return await executeWithMutationRunOptions(
    context,
    opts => setupAppWithMutationOptions(context, agent, opts),
    undefined,
    {
      /** Involves a lot of processing so setting timout to 10 seconds. */
      timeout: 10000,
    }
  );
}
