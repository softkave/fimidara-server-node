import * as assert from 'assert';
import * as inquirer from 'inquirer';
import {getMongoConnection} from '../../db/connection';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {TokenAccessScope} from '../../definitions/system';
import {UserWithWorkspace} from '../../definitions/user';
import {Workspace} from '../../definitions/workspace';
import RequestData from '../../endpoints/RequestData';
import {assertAgentToken} from '../../endpoints/agentTokens/utils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../endpoints/assignedItems/addAssignedItems';
import {INTERNAL_RespondToCollaborationRequest} from '../../endpoints/collaborationRequests/respondToRequest/utils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {
  SemanticDataAccessProviderMutationRunOptions,
  SemanticDataAccessProviderRunOptions,
} from '../../endpoints/contexts/semantic/types';
import {BaseContextType} from '../../endpoints/contexts/types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../../endpoints/contexts/utils';
import {fetchEntityAssignedPermissionGroupList} from '../../endpoints/permissionGroups/getEntityAssignedPermissionGroups/utils';
import {assertPermissionGroup} from '../../endpoints/permissionGroups/utils';
import {setupApp} from '../../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/NoopEmailProviderContext';
import changePasswordWithToken from '../../endpoints/users/changePasswordWithToken/handler';
import {ChangePasswordWithTokenEndpointParams} from '../../endpoints/users/changePasswordWithToken/types';
import INTERNAL_confirmEmailAddress from '../../endpoints/users/confirmEmailAddress/internalConfirmEmailAddress';
import {getForgotPasswordToken} from '../../endpoints/users/forgotPassword/forgotPassword';
import {INTERNAL_signupUser} from '../../endpoints/users/signup/utils';
import {getCompleteUserDataByEmail, isUserInWorkspace} from '../../endpoints/users/utils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../endpoints/workspaces/addWorkspace/utils';
import {fimidaraConfig} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {getTimestamp} from '../../utils/dateFns';
import {serverLogger} from '../../utils/logger/loggerUtils';
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

export async function devUserSetupInitContext() {
  const connection = await getMongoConnection(
    fimidaraConfig.mongoDbURI,
    fimidaraConfig.mongoDbDatabaseName
  );
  const models = getMongoModels(connection);
  const data = getMongoDataProviders(models);
  const ctx = new BaseContext(
    data,
    new NoopEmailProviderContext(),
    getFileProvider(fimidaraConfig),
    fimidaraConfig,
    getLogicProviders(),
    getMongoBackedSemanticDataProviders(data),
    connection,
    models,
    () => connection.close()
  );
  await ctx.init();
  return ctx;
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
  context: BaseContextType,
  userId: string,
  adminPermissionGroupId: string,
  opts?: SemanticDataAccessProviderRunOptions
) {
  const {inheritanceMap} = await fetchEntityAssignedPermissionGroupList(
    context,
    userId,
    /** include inherited permission groups */ true,
    opts
  );
  const isAdmin = !!inheritanceMap[adminPermissionGroupId];
  return isAdmin;
}

async function makeUserAdmin(
  context: BaseContextType,
  userId: string,
  workspace: Workspace,
  adminPermissionGroupId: string,
  opts: SemanticDataAccessProviderMutationRunOptions
) {
  const isAdmin = await isUserAdmin(context, userId, adminPermissionGroupId, opts);
  if (!isAdmin) {
    serverLogger.info('Making user admin');
    await addAssignedPermissionGroupList(
      context,
      SYSTEM_SESSION_AGENT,
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

async function getUser(context: BaseContextType, runtimeOptions: ISetupDevUserOptions) {
  const {email} = await runtimeOptions.getUserEmail();
  const userExists = await context.semantic.user.existsByEmail(email);
  let user: UserWithWorkspace;
  if (userExists) {
    user = await getCompleteUserDataByEmail(context, email);
  } else {
    const userInfo = await runtimeOptions.getUserInfo();
    user = await context.semantic.utils.withTxn(context, opts =>
      INTERNAL_signupUser(context, {...userInfo, email}, {}, opts)
    );
  }

  assert.ok(user);
  return user;
}

export async function setupDevUser(context: BaseContextType, appOptions: ISetupDevUserOptions) {
  const consoleLogger = serverLogger;
  const workspace = await setupApp(context);
  const user = await getUser(context, appOptions);
  const isInWorkspace = await isUserInWorkspace(user, workspace.resourceId);

  if (user.requiresPasswordChange) {
    const forgotToken = await getForgotPasswordToken(context, user);
    const userPassword = await appOptions.getUserPassword();
    await changePasswordWithToken(
      context,
      new RequestData<ChangePasswordWithTokenEndpointParams>({
        data: {password: userPassword.password},
        agent: makeUserSessionAgent(user, forgotToken),
      })
    );
  }

  if (user.isOnWaitlist) {
    await context.semantic.utils.withTxn(context, opts =>
      context.semantic.user.updateOneById(
        user.resourceId,
        {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
        opts
      )
    );
  }

  await context.semantic.utils.withTxn(context, async opts => {
    const adminPermissionGroup = await context.semantic.permissionGroup.getByName(
      workspace.resourceId,
      DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
      opts
    );
    assertPermissionGroup(adminPermissionGroup);

    if (isInWorkspace) {
      await makeUserAdmin(
        context,
        user.resourceId,
        workspace,
        adminPermissionGroup.resourceId,
        opts
      );
    } else {
      const request = await context.semantic.collaborationRequest.getOneByEmail(user.email, opts);

      if (request) {
        consoleLogger.info('Existing collaboration request found');
        consoleLogger.info(`Accepting request ${request.resourceId}`);
        const agentToken = await context.semantic.agentToken.getOneAgentToken(
          user.resourceId,
          TokenAccessScope.Login,
          opts
        );
        assertAgentToken(agentToken);
        const agent = makeUserSessionAgent(user, agentToken);
        await INTERNAL_RespondToCollaborationRequest(
          context,
          agent,
          {
            requestId: request.resourceId,
            response: CollaborationRequestStatusType.Accepted,
          },
          opts
        );
      } else {
        consoleLogger.info('Adding user to workspace');
        await assignWorkspaceToUser(
          context,
          SYSTEM_SESSION_AGENT,
          workspace.resourceId,
          user.resourceId,
          opts
        );
      }

      await makeUserAdmin(
        context,
        user.resourceId,
        workspace,
        adminPermissionGroup.resourceId,
        opts
      );
    }

    if (!user.isEmailVerified) {
      consoleLogger.info(`Verifying email address for user ${user.email}`);
      await INTERNAL_confirmEmailAddress(context, user.resourceId, user);
    }

    consoleLogger.info(`User ${user.email} is now an admin of workspace ${workspace.name}`);
  });
}
