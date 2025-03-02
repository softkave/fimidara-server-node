import * as assert from 'assert';
// eslint-disable-next-line node/no-unpublished-import
import * as inquirer from 'inquirer';
import {kIjxSemantic, kIjxUtils} from '../../contexts/ijx/injectables.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderOpParams,
} from '../../contexts/semantic/types.js';
import {kCollaborationRequestStatusTypeMap} from '../../definitions/collaborationRequest.js';
import {kTokenAccessScope} from '../../definitions/system.js';
import {UserWithWorkspace} from '../../definitions/user.js';
import {Workspace} from '../../definitions/workspace.js';
import {assertAgentToken} from '../../endpoints/agentTokens/utils.js';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../endpoints/assignedItems/addAssignedItems.js';
import {INTERNAL_RespondToCollaborationRequest} from '../../endpoints/collaborationRequests/respondToRequest/utils.js';
import {fetchEntityAssignedPermissionGroupList} from '../../endpoints/permissionGroups/getEntityAssignedPermissionGroups/utils.js';
import {assertPermissionGroup} from '../../endpoints/permissionGroups/utils.js';
import {initFimidara} from '../../endpoints/runtime/initFimidara.js';
import {INTERNAL_changePassword} from '../../endpoints/users/changePasswordWithToken/utils.js';
import INTERNAL_confirmEmailAddress from '../../endpoints/users/confirmEmailAddress/internalConfirmEmailAddress.js';
import {INTERNAL_signupUser} from '../../endpoints/users/signup/utils.js';
import {
  getCompleteUserDataByEmail,
  isUserInWorkspace,
} from '../../endpoints/users/utils.js';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../endpoints/workspaces/addWorkspace/utils.js';
import {kSystemSessionAgent} from '../../utils/agent.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {makeUserSessionAgent} from '../../utils/sessionUtils.js';

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

async function isUserAdmin(params: {
  userId: string;
  workspaceId: string;
  adminPermissionGroupId: string;
  opts?: SemanticProviderOpParams;
}) {
  const {userId, workspaceId, adminPermissionGroupId, opts} = params;
  const {inheritanceMap} = await fetchEntityAssignedPermissionGroupList({
    workspaceId,
    entityId: userId,
    includeInheritedPermissionGroups: true,
    opts,
  });
  const isAdmin = !!inheritanceMap[adminPermissionGroupId];
  return isAdmin;
}

async function makeUserAdmin(
  userId: string,
  workspace: Workspace,
  adminPermissionGroupId: string,
  opts: SemanticProviderMutationParams
) {
  const isAdmin = await isUserAdmin({
    userId,
    workspaceId: workspace.resourceId,
    adminPermissionGroupId,
    opts,
  });

  if (!isAdmin) {
    kIjxUtils.logger().log('Making user admin');
    await addAssignedPermissionGroupList(
      kSystemSessionAgent,
      workspace.resourceId,
      [adminPermissionGroupId],
      userId,
      /* deleteExisting */ false,
      /** skip permission groups check */ false,
      /** skip auth check */ true,
      opts
    );
  }
}

async function getUser(runtimeOptions: ISetupDevUserOptions) {
  return await kIjxSemantic.utils().withTxn(async opts => {
    const {email} = await runtimeOptions.getUserEmail();
    const userExists = await kIjxSemantic.user().existsByEmail(email, opts);
    let user: UserWithWorkspace;

    if (userExists) {
      user = await getCompleteUserDataByEmail(email, opts);
    } else {
      const userInfo = await runtimeOptions.getUserInfo();
      user = await INTERNAL_signupUser(
        {...userInfo, email},
        {requiresPasswordChange: false, isEmailVerified: true},
        opts
      );
    }

    if (user.requiresPasswordChange) {
      const {password} = await runtimeOptions.getUserPassword();
      await INTERNAL_changePassword(/** reqData */ {}, user.resourceId, {
        password,
      });
    }

    assert.ok(user);
    return user;
  });
}

export async function setupDevUser(appOptions: ISetupDevUserOptions) {
  const workspace = await initFimidara();
  const user = await getUser(appOptions);
  const isInWorkspace = isUserInWorkspace(user, workspace.resourceId);

  if (user.isOnWaitlist) {
    await kIjxSemantic
      .utils()
      .withTxn(opts =>
        kIjxSemantic
          .user()
          .updateOneById(
            user.resourceId,
            {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
            opts
          )
      );
  }

  await kIjxSemantic.utils().withTxn(async opts => {
    const adminPermissionGroup = await kIjxSemantic
      .permissionGroup()
      .getByName(
        workspace.resourceId,
        DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
        opts
      );
    assertPermissionGroup(adminPermissionGroup);

    if (isInWorkspace) {
      await makeUserAdmin(
        user.resourceId,
        workspace,
        adminPermissionGroup.resourceId,
        opts
      );
    } else {
      const request = await kIjxSemantic
        .collaborationRequest()
        .getOneByEmail(user.email, opts);

      if (request) {
        kIjxUtils.logger().log('Existing collaboration request found');
        kIjxUtils.logger().log(`Accepting request ${request.resourceId}`);
        const agentToken = await kIjxSemantic
          .agentToken()
          .getUserAgentToken(user.resourceId, kTokenAccessScope.login, opts);
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
        kIjxUtils.logger().log('Adding user to workspace');
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

    kIjxUtils
      .logger()
      .log(`User ${user.email} is now an admin of workspace ${workspace.name}`);
  });

  if (!user.isEmailVerified) {
    kIjxUtils.logger().log(`Verifying email address for user ${user.email}`);
    await INTERNAL_confirmEmailAddress(user.resourceId, user);
  }
}
