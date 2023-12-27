import * as assert from 'assert';
import * as inquirer from 'inquirer';
import { getMongoConnection } from '../../db/connection';
import { CollaborationRequestStatusTypeMap } from '../../definitions/collaborationRequest';
import { kTokenAccessScope } from '../../definitions/system';
import { UserWithWorkspace } from '../../definitions/user';
import { Workspace } from '../../definitions/workspace';
import RequestData from '../../endpoints/RequestData';
import { assertAgentToken } from '../../endpoints/agentTokens/utils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../endpoints/assignedItems/addAssignedItems';
import { INTERNAL_RespondToCollaborationRequest } from '../../endpoints/collaborationRequests/respondToRequest/utils';
import BaseContext, { getFileProvider } from '../../endpoints/contexts/BaseContext';
import { kSemanticModels } from '../../endpoints/contexts/injectables';
import {
  SemanticProviderMutationRunOptions,
  SemanticProviderRunOptions,
} from '../../endpoints/contexts/semantic/types';
import {
  getLogicProviders,
  getMongoBackedSemanticDataProviders,
  getMongoDataProviders,
  getMongoModels,
} from '../../endpoints/contexts/utils';
import { fetchEntityAssignedPermissionGroupList } from '../../endpoints/permissionGroups/getEntityAssignedPermissionGroups/utils';
import { assertPermissionGroup } from '../../endpoints/permissionGroups/utils';
import { setupApp } from '../../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/email/NoopEmailProviderContext';
import changePasswordWithToken from '../../endpoints/users/changePasswordWithToken/handler';
import { ChangePasswordWithTokenEndpointParams } from '../../endpoints/users/changePasswordWithToken/types';
import INTERNAL_confirmEmailAddress from '../../endpoints/users/confirmEmailAddress/internalConfirmEmailAddress';
import { getForgotPasswordToken } from '../../endpoints/users/forgotPassword/forgotPassword';
import { INTERNAL_signupUser } from '../../endpoints/users/signup/utils';
import { getCompleteUserDataByEmail, isUserInWorkspace } from '../../endpoints/users/utils';
import { DEFAULT_ADMIN_PERMISSION_GROUP_NAME } from '../../endpoints/workspaces/addWorkspace/utils';
import { fimidaraConfig } from '../../resources/vars';
import { kSystemSessionAgent } from '../../utils/agent';
import { getTimestamp } from '../../utils/dateFns';
import { serverLogger } from '../../utils/logger/loggerUtils';
import { makeUserSessionAgent } from '../../utils/sessionUtils';
import Baseimport { from } from 'rxjs';
 {getFileProvider} from '../../endpoints/contexts/BaseContext';

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
  
  userId: string,
  adminPermissionGroupId: string,
  opts?: SemanticProviderRunOptions
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
  opts: SemanticProviderMutationRunOptions
) {
  const isAdmin = await isUserAdmin( userId, adminPermissionGroupId, opts);

  if (!isAdmin) {
    serverLogger.info('Making user admin');
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
  opts?: SemanticProviderRunOptions
) {
  const {email} = await runtimeOptions.getUserEmail();
  const userExists = await kSemanticModels.user().existsByEmail(email, opts);
  let user: UserWithWorkspace;

  if (userExists) {
    user = await getCompleteUserDataByEmail( email, opts);
  } else {
    const userInfo = await runtimeOptions.getUserInfo();
    user = await kSemanticModels
      .utils()
      .withTxn(
        
        opts => INTERNAL_signupUser( {...userInfo, email}, {}, opts),
        opts
      );
  }

  assert.ok(user);
  return user;
}

export async function setupDevUser(
  
  appOptions: ISetupDevUserOptions
) {
  const consoleLogger = serverLogger;
  const workspace = await setupApp();
  const user = await getUser( appOptions);
  const isInWorkspace = isUserInWorkspace(user, workspace.resourceId);

  if (user.requiresPasswordChange) {
    const forgotToken = await getForgotPasswordToken( user);
    const userPassword = await appOptions.getUserPassword();
    await changePasswordWithToken(
      
      new RequestData<ChangePasswordWithTokenEndpointParams>({
        data: {password: userPassword.password},
        agent: makeUserSessionAgent(user, forgotToken),
      })
    );
  }

  if (user.isOnWaitlist) {
    await kSemanticModels
      .utils()
      .withTxn(opts =>
        kSemanticModels.user().updateOneById(
          user.resourceId,
          {isOnWaitlist: false, removedFromWaitlistOn: getTimestamp()},
          opts
        )
      );
  }

  await kSemanticModels.utils().withTxn(async opts => {
    const adminPermissionGroup = await kSemanticModels.permissionGroup().getByName(
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
      const request = await kSemanticModels.collaborationRequest().getOneByEmail(
        user.email,
        opts
      );

      if (request) {
        consoleLogger.info('Existing collaboration request found');
        consoleLogger.info(`Accepting request ${request.resourceId}`);
        const agentToken = await kSemanticModels.agentToken().getOneAgentToken(
          user.resourceId,
          kTokenAccessScope.Login,
          opts
        );
        assertAgentToken(agentToken);
        const agent = makeUserSessionAgent(user, agentToken);
        await INTERNAL_RespondToCollaborationRequest(
          
          agent,
          {
            requestId: request.resourceId,
            response: CollaborationRequestStatusTypeMap.Accepted,
          },
          opts
        );
      } else {
        consoleLogger.info('Adding user to workspace');
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

    consoleLogger.info(
      `User ${user.email} is now an admin of workspace ${workspace.name}`
    );
  });

  if (!user.isEmailVerified) {
    consoleLogger.info(`Verifying email address for user ${user.email}`);
    await INTERNAL_confirmEmailAddress( user.resourceId, user);
  }
}
