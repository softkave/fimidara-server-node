import assert from 'assert';
import {last} from 'lodash-es';
import {Folder} from '../../definitions/folder.js';
import {PermissionGroup} from '../../definitions/permissionGroups.js';
import {
  FimidaraPermissionAction,
  PermissionItem,
  kFimidaraPermissionActionsMap,
} from '../../definitions/permissionItem.js';
import {
  AppRuntimeState,
  SessionAgent,
  kFimidaraResourceType,
} from '../../definitions/system.js';
import {Workspace} from '../../definitions/workspace.js';
import {FimidaraRuntimeConfig} from '../../resources/config.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {appAssert} from '../../utils/assertion.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {
  getNewIdForResource,
  kIdSize,
  newWorkspaceResource,
} from '../../utils/resource.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';
import {
  kDataModels,
  kSemanticModels,
  kUtilsInjectables,
} from '../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../contexts/injection/register.js';
import {createFolderList} from '../folders/addFolder/createFolderList.js';
import {addRootnameToPath} from '../folders/utils.js';
import EndpointReusableQueries from '../queries.js';
import {INTERNAL_forgotPassword} from '../users/forgotPassword/forgotPassword.js';
import {getUserToken} from '../users/login/utils.js';
import {INTERNAL_sendEmailVerificationCode} from '../users/sendEmailVerificationCode/handler.js';
import {INTERNAL_signupUser} from '../users/signup/utils.js';
import INTERNAL_createWorkspace from '../workspaces/addWorkspace/internalCreateWorkspace.js';
import {assertWorkspace} from '../workspaces/utils.js';

// TODO: there's currently a backwards way of doing things, where we first
// initialize app before we run unit tests, meaning, the same things we're
// trying to test are required to work before we can even test them. We need to
// fix this for unit tests at the very least, but it may be okay for integration
// tests.

export const kAppRuntimeStatsDocId = getNewIdForResource(
  kFimidaraResourceType.System,
  kIdSize,
  true
);

export const kNewSignupsOnWaitlistJobIntervalMs = 1_000 * 60 * 60;
export const kNewSignupsOnWaitlistJobIdempotencyToken = '1';

const kImagesPath = '/files/images';
/** 1 hour in ms */
const kAppSetupVars = {
  workspaceName: 'Fimidara',
  rootname: 'fimidara',
  workspaceImagesfolderpath: kImagesPath + '/workspaces',
  userImagesfolderpath: kImagesPath + '/users',
  workspacesImageUploadPermissionGroupName: 'Fimidara workspaces image upload',
  usersImageUploadPermissionGroupName: 'Fimidara users image upload',
};

async function setupWorkspace(
  agent: SessionAgent,
  name: string,
  rootname: string
) {
  const result = await kSemanticModels.utils().withTxn(async opts => {
    const existingWorkspace = await kSemanticModels
      .workspace()
      .getByRootname(rootname);

    if (existingWorkspace) {
      return {workspace: existingWorkspace};
    }

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
  });

  return result;
}

async function setupDefaultUser() {
  const {user, userToken} = await kSemanticModels
    .utils()
    .withTxn(async opts => {
      const suppliedConfig = kUtilsInjectables.suppliedConfig();
      const nodeEnv = process.env.NODE_ENV;
      assert(suppliedConfig.rootUserEmail);
      assert(suppliedConfig.rootUserPassword);
      assert(suppliedConfig.rootUserFirstName);
      assert(suppliedConfig.rootUserLastName);
      let user = await kSemanticModels
        .user()
        .getByEmail(suppliedConfig.rootUserEmail, opts);

      if (!user) {
        const isDevRelatedvEnv =
          nodeEnv === 'development' || nodeEnv === 'test';
        user = await INTERNAL_signupUser(
          {
            email: suppliedConfig.rootUserEmail,
            firstName: suppliedConfig.rootUserFirstName,
            lastName: suppliedConfig.rootUserLastName,
            password: suppliedConfig.rootUserPassword,
          },
          {
            requiresPasswordChange: isDevRelatedvEnv ? false : true,
            isEmailVerified: isDevRelatedvEnv ? true : false,
            isOnWaitlist: false,
          },
          opts
        );

        if (!isDevRelatedvEnv) {
          await INTERNAL_forgotPassword(user);
          await INTERNAL_sendEmailVerificationCode(user);
        }
      }

      const userToken = await getUserToken(user.resourceId, opts);
      return {user, userToken};
    });

  const agent = makeUserSessionAgent(user, userToken);
  return {user, userToken, agent};
}

async function setupFolders(workspace: Workspace) {
  const [workspaceImagesFolders, userImagesFolders] = await Promise.all([
    createFolderList(
      kSystemSessionAgent,
      workspace,
      {
        folderpath: addRootnameToPath(
          kAppSetupVars.workspaceImagesfolderpath,
          workspace.rootname
        ),
      },
      /** skip auth check */ true,
      /** throw on folder exists */ false,
      /** throw on error */ true
    ),
    createFolderList(
      kSystemSessionAgent,
      workspace,
      {
        folderpath: addRootnameToPath(
          kAppSetupVars.userImagesfolderpath,
          workspace.rootname
        ),
      },
      /** skip auth check */ true,
      /** throw on folder exists */ false,
      /** throw on error */ true
    ),
  ]);

  const workspaceImagesFolder =
    last(workspaceImagesFolders.existingFolders) ||
    last(workspaceImagesFolders.newFolders);
  const userImagesFolder =
    last(userImagesFolders.existingFolders) ||
    last(userImagesFolders.newFolders);

  appAssert(
    workspaceImagesFolder,
    `Could not create workspaceImagesFolder from ${kAppSetupVars.workspaceImagesfolderpath}`
  );
  appAssert(
    userImagesFolder,
    `Could not create userImagesFolder from ${kAppSetupVars.userImagesfolderpath}`
  );
  return {workspaceImagesFolder, userImagesFolder};
}

async function setupImageUploadPermissionGroup(
  workspaceId: string,
  name: string,
  description: string,
  folder: Folder
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const existingPermissionGroup = await kSemanticModels
      .permissionGroup()
      .getByName(workspaceId, name, opts);

    if (existingPermissionGroup) {
      return existingPermissionGroup;
    }

    const imageUploadPermissionGroup = newWorkspaceResource<PermissionGroup>(
      kSystemSessionAgent,
      kFimidaraResourceType.PermissionGroup,
      workspaceId,
      {name, description}
    );
    const actions: FimidaraPermissionAction[] = [
      kFimidaraPermissionActionsMap.uploadFile,
      kFimidaraPermissionActionsMap.readFile,
    ];
    const permissionItems: PermissionItem[] = actions.map(action => {
      const containerIds = folder.idPath.slice(0, -1);
      const targetParentId = containerIds.length
        ? last(containerIds)
        : workspaceId;
      appAssert(targetParentId, 'Could not resolve targetParentId');
      const item: PermissionItem = newWorkspaceResource<PermissionItem>(
        kSystemSessionAgent,
        kFimidaraResourceType.PermissionItem,
        workspaceId,
        {
          action,
          targetParentId,
          entityId: imageUploadPermissionGroup.resourceId,
          entityType: kFimidaraResourceType.PermissionGroup,
          targetId: folder.resourceId,
          targetType: kFimidaraResourceType.File,
          access: true,
        }
      );
      return item;
    });

    await Promise.all([
      await kSemanticModels
        .permissionGroup()
        .insertItem(imageUploadPermissionGroup, opts),
      await kSemanticModels.permissionItem().insertItem(permissionItems, opts),
    ]);
    return imageUploadPermissionGroup;
  });
}

async function setupRootWorkspacePermissionGroups(
  workspace: Workspace,
  workspaceImagesFolder: Folder,
  userImagesFolder: Folder
) {
  const [
    appWorkspacesImageUploadPermissionGroup,
    appUsersImageUploadPermissionGroup,
  ] = await Promise.all([
    setupImageUploadPermissionGroup(
      workspace.resourceId,
      kAppSetupVars.workspacesImageUploadPermissionGroupName,
      'Auto-generated permission group for uploading images to the workspace images folder',
      workspaceImagesFolder
    ),
    setupImageUploadPermissionGroup(
      workspace.resourceId,
      kAppSetupVars.usersImageUploadPermissionGroupName,
      'Auto-generated permission group for uploading images to the user images folder',
      userImagesFolder
    ),
  ]);

  return {
    appWorkspacesImageUploadPermissionGroup,
    appUsersImageUploadPermissionGroup,
  };
}

export async function isRootWorkspaceSetup() {
  const appRuntimeState = await kDataModels
    .appRuntimeState()
    .getOneByQuery(
      EndpointReusableQueries.getByResourceId(kAppRuntimeStatsDocId)
    );
  return appRuntimeState;
}

async function getRootWorkspace(appRuntimeState: AppRuntimeState) {
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
    .getOneById(appRuntimeState.appWorkspaceId);
  assertWorkspace(workspace);
  return workspace;
}

async function insertRuntimeVars(
  workspace: Workspace,
  appWorkspacesImageUploadPermissionGroup: PermissionGroup,
  appUsersImageUploadPermissionGroup: PermissionGroup
) {
  return await kSemanticModels.utils().withTxn(async opts => {
    const appRuntimeVars: Pick<
      FimidaraRuntimeConfig,
      | 'appWorkspaceId'
      | 'appUsersImageUploadPermissionGroupId'
      | 'appWorkspacesImageUploadPermissionGroupId'
    > = {
      appWorkspaceId: workspace.resourceId,
      appWorkspacesImageUploadPermissionGroupId:
        appWorkspacesImageUploadPermissionGroup.resourceId,
      appUsersImageUploadPermissionGroupId:
        appUsersImageUploadPermissionGroup.resourceId,
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

async function setupAppArtifacts(agent: SessionAgent) {
  const {workspace} = await setupWorkspace(
    agent,
    kAppSetupVars.workspaceName,
    kAppSetupVars.rootname
  );
  const {workspaceImagesFolder, userImagesFolder} =
    await setupFolders(workspace);
  const {
    appWorkspacesImageUploadPermissionGroup,
    appUsersImageUploadPermissionGroup,
  } = await setupRootWorkspacePermissionGroups(
    workspace,
    workspaceImagesFolder,
    userImagesFolder
  );
  const {appRuntimeVars} = await insertRuntimeVars(
    workspace,
    appWorkspacesImageUploadPermissionGroup,
    appUsersImageUploadPermissionGroup
  );

  kRegisterUtilsInjectables.runtimeConfig(appRuntimeVars);
  return workspace;
}

// async function setupNewUsersOnWaitlistJob() {
//   const {FLAG_waitlistNewSignups} = kUtilsInjectables.suppliedConfig();

//   if (!FLAG_waitlistNewSignups) {
//     return;
//   }

//   await queueJobs<{}>(
//     /** workspaceId */ undefined,
//     /** parent job ID */ undefined,
//     [
//       {
//         params: {},
//         createdBy: kSystemSessionAgent,
//         type: kJobType.newSignupsOnWaitlist,
//         /** there should always be only one such job */
//         idempotencyToken: kNewSignupsOnWaitlistJobIdempotencyToken,
//         runCategory: kJobRunCategory.cron,
//         cronInterval: kNewSignupsOnWaitlistJobIntervalMs,
//       },
//     ]
//   );
// }

export async function initFimidara() {
  const appRuntimeState = await isRootWorkspaceSetup();

  if (appRuntimeState) {
    return await getRootWorkspace(appRuntimeState);
  }

  const {agent} = await setupDefaultUser();
  const [appArtifacts] = await Promise.all([
    setupAppArtifacts(agent),
    // setupNewUsersOnWaitlistJob(),
  ]);

  return appArtifacts;
}
