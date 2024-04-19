import * as assert from 'assert';
// eslint-disable-next-line node/no-unpublished-import
import * as inquirer from 'inquirer';
import {kCollaborationRequestStatusTypeMap} from '../../definitions/collaborationRequest';
import {kTokenAccessScope} from '../../definitions/system';
import {UserWithWorkspace} from '../../definitions/user';
import {Workspace} from '../../definitions/workspace';
import {assertAgentToken} from '../../endpoints/agentTokens/utils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../endpoints/assignedItems/addAssignedItems';
import {INTERNAL_RespondToCollaborationRequest} from '../../endpoints/collaborationRequests/respondToRequest/utils';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../endpoints/contexts/injection/injectables';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../endpoints/contexts/semantic/types';
import {fetchEntityAssignedPermissionGroupList} from '../../endpoints/permissionGroups/getEntityAssignedPermissionGroups/utils';
import {assertPermissionGroup} from '../../endpoints/permissionGroups/utils';
import {initFimidara} from '../../endpoints/runtime/initFimidara';
import INTERNAL_confirmEmailAddress from '../../endpoints/users/confirmEmailAddress/internalConfirmEmailAddress';
import {INTERNAL_signupUser} from '../../endpoints/users/signup/utils';
import {getCompleteUserDataByEmail, isUserInWorkspace} from '../../endpoints/users/utils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../endpoints/workspaces/addWorkspace/utils';
import {kSystemSessionAgent} from '../../utils/agent';
import {getTimestamp} from '../../utils/dateFns';
import {makeUserSessionAgent} from '../../utils/sessionUtils';

export interface PromptEmailAnswers {
  email: string;
}

export interface PromptUserInfoAnswers {
  firstName: string;
  lastName: string;
  password: string;
}

export interface PromptUserPasswordAnswers {
  password: string;
}

export interface ISetupDevUserOptions {
  getUserEmail: () => Promise<PromptEmailAnswers>;
  getUserInfo: () => Promise<PromptUserInfoAnswers>;
  getUserPassword: () => Promise<PromptUserPasswordAnswers>;
}

export async function devUserSetupPromptEmail() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
    },
  ]);

  return answers as PromptEmailAnswers;
}

export async function devUserSetupPromptUserInfo() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'firstName',
      message: 'Enter your first name:',
    },
    {
      type: 'input',
      name: 'lastName',
      message: 'Enter your last name:',
    },
    {
      type: 'input',
      name: 'password',
      message: 'Enter your password:',
    },
  ]);

  return answers as PromptUserInfoAnswers;
}

export async function devUserSetupPromptUserPassword() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'password',
      message: 'Enter your password:',
    },
  ]);

  return answers as PromptUserPasswordAnswers;
}

async function isUserAdmin(
  userId: string,
  adminPermissionGroupId: string,
  opts?: SemanticProviderOpParams
) {
  const {inheritanceMap} = await fetchEntityAssignedPermissionGroupList(
    userId,
    /** include inherited permission groups */ true,
    opts
  );
  const isAdmin = !!inheritanceMap[adminPermissionGroupId];
  return isAdmin;
}

async function makeUserAdmin(
  userId: string,
  workspace: Workspace,
  adminPermissionGroupId: string,
  opts: SemanticProviderMutationParams
) {
  const isAdmin = await isUserAdmin(userId, adminPermissionGroupId, opts);

  if (!isAdmin) {
    kUtilsInjectables.logger().log('Making user admin');
    await addAssignedPermissionGroupList(
      kSystemSessionAgent,
      workspace.resourceId,
      [{permissionGroupId: adminPermissionGroupId}],
      userId,
      /* deleteExisting */ false,
      /** skip permission groups check */ false,
      /** skip auth check */ true,
      opts
    );
  }
}

async function getUser(
  runtimeOptions: ISetupDevUserOptions,
  opts?: SemanticProviderOpParams
) {
  const {email} = await runtimeOptions.getUserEmail();
  const userExists = await kSemanticModels.user().existsByEmail(email, opts);
  let user: UserWithWorkspace;

  if (userExists) {
    user = await getCompleteUserDataByEmail(email, opts);
  } else {
    const userInfo = await runtimeOptions.getUserInfo();
    user = await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          INTERNAL_signupUser(
            {...userInfo, email},
            {requiresPasswordChange: false, isEmailVerified: true},
            opts
          ),
        /** reuseTxn */ true
      );
  }

  assert.ok(user);
  return user;
}

export async function setupDevUser(appOptions: ISetupDevUserOptions) {
  const workspace = await initFimidara();
  const user = await getUser(appOptions);
  const isInWorkspace = isUserInWorkspace(user, workspace.resourceId);

  if (user.isOnWaitlist) {
    await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          kSemanticModels
            .user()
            .updateOneById(
              user.resourceId,
              {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
              opts
            ),
        /** reuseTxn */ true
      );
  }

  await kSemanticModels.utils().withTxn(async opts => {
    const adminPermissionGroup = await kSemanticModels
      .permissionGroup()
      .getByName(workspace.resourceId, DEFAULT_ADMIN_PERMISSION_GROUP_NAME, opts);
    assertPermissionGroup(adminPermissionGroup);

    if (isInWorkspace) {
      await makeUserAdmin(
        user.resourceId,
        workspace,
        adminPermissionGroup.resourceId,
        opts
      );
    } else {
      const request = await kSemanticModels
        .collaborationRequest()
        .getOneByEmail(user.email, opts);

      if (request) {
        kUtilsInjectables.logger().log('Existing collaboration request found');
        kUtilsInjectables.logger().log(`Accepting request ${request.resourceId}`);
        const agentToken = await kSemanticModels
          .agentToken()
          .getOneAgentToken(user.resourceId, kTokenAccessScope.Login, opts);
        assertAgentToken(agentToken);
        const agent = makeUserSessionAgent(user, agentToken);
        await INTERNAL_RespondToCollaborationRequest(
          agent,
          {
            requestId: request.resourceId,
            response: kCollaborationRequestStatusTypeMap.Accepted,
          },
          opts
        );
      } else {
        kUtilsInjectables.logger().log('Adding user to workspace');
        await assignWorkspaceToUser(
          kSystemSessionAgent,
          workspace.resourceId,
          user.resourceId,
          opts
        );
      }

      await makeUserAdmin(
        user.resourceId,
        workspace,
        adminPermissionGroup.resourceId,
        opts
      );
    }

    kUtilsInjectables
      .logger()
      .log(`User ${user.email} is now an admin of workspace ${workspace.name}`);
  }, /** reuseTxn */ true);

  if (!user.isEmailVerified) {
    kUtilsInjectables.logger().log(`Verifying email address for user ${user.email}`);
    await INTERNAL_confirmEmailAddress(user.resourceId, user);
  }
}
