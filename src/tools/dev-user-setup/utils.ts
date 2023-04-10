import * as assert from 'assert';
import * as inquirer from 'inquirer';
import {getMongoConnection} from '../../db/connection';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {TokenAccessScope} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
import {assertAgentToken} from '../../endpoints/agentTokens/utils';
import {
  addAssignedPermissionGroupList,
  assignWorkspaceToUser,
} from '../../endpoints/assignedItems/addAssignedItems';
import {internalRespondToCollaborationRequest} from '../../endpoints/collaborationRequests/respondToRequest/utils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {
  ISemanticDataAccessProviderMutationRunOptions,
  ISemanticDataAccessProviderRunOptions,
} from '../../endpoints/contexts/semantic/types';
import {executeWithMutationRunOptions} from '../../endpoints/contexts/semantic/utils';
import {IBaseContext} from '../../endpoints/contexts/types';
import {
  getDataProviders,
  getLogicProviders,
  getMemstoreDataProviders,
  getMongoModels,
  getSemanticDataProviders,
  ingestDataIntoMemStore,
} from '../../endpoints/contexts/utils';
import {consoleLogger, disposeApplicationGlobalUtilities} from '../../endpoints/globalUtils';
import {fetchEntityAssignedPermissionGroupList} from '../../endpoints/permissionGroups/getEntityAssignedPermissionGroups/utils';
import {assertPermissionGroup} from '../../endpoints/permissionGroups/utils';
import {setupApp} from '../../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../../endpoints/testUtils/context/NoopEmailProviderContext';
import internalConfirmEmailAddress from '../../endpoints/user/confirmEmailAddress/internalConfirmEmailAddress';
import {internalSignupUser} from '../../endpoints/user/signup/utils';
import {getCompleteUserDataByEmail, isUserInWorkspace} from '../../endpoints/user/utils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../endpoints/workspaces/addWorkspace/utils';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {SYSTEM_SESSION_AGENT} from '../../utils/agent';
import {makeUserSessionAgent} from '../../utils/sessionUtils';

export interface IPromptEmailAnswers {
  email: string;
}

export interface IPromptUserInfoAnswers {
  firstName: string;
  lastName: string;
  password: string;
}

export interface ISetupDevUserOptions {
  getUserEmail?: () => Promise<IPromptEmailAnswers>;
  getUserInfo?: () => Promise<IPromptUserInfoAnswers>;
}

type AppRuntimeOptions = Required<Pick<ISetupDevUserOptions, 'getUserEmail' | 'getUserInfo'>>;

async function setupContext() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );
  const emailProvider = new NoopEmailProviderContext();
  const models = getMongoModels(connection);
  const data = getDataProviders(models);
  const mem = getMemstoreDataProviders(models);
  const ctx = new BaseContext(
    data,
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    mem,
    getLogicProviders(),
    getSemanticDataProviders(mem),
    () => connection.close()
  );

  await ingestDataIntoMemStore(ctx);
  return ctx;
}

async function promptEmail() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
    },
  ]);

  return answers as IPromptEmailAnswers;
}

async function promptUserInfo() {
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

  return answers as IPromptUserInfoAnswers;
}

async function isUserAdmin(
  context: IBaseContext,
  userId: string,
  adminPermissionGroupId: string,
  opts?: ISemanticDataAccessProviderRunOptions
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
  context: IBaseContext,
  userId: string,
  workspace: IWorkspace,
  adminPermissionGroupId: string,
  opts: ISemanticDataAccessProviderMutationRunOptions
) {
  const isAdmin = await isUserAdmin(context, userId, adminPermissionGroupId, opts);
  if (!isAdmin) {
    consoleLogger.info('Making user admin');
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

async function getUser(context: IBaseContext, runtimeOptions: AppRuntimeOptions) {
  const {email} = await runtimeOptions.getUserEmail();
  const userExists = await context.semantic.user.existsByEmail(email);
  let user: IUserWithWorkspace;
  if (userExists) {
    user = await getCompleteUserDataByEmail(context, email);
  } else {
    const userInfo = await runtimeOptions.getUserInfo();
    user = await internalSignupUser(context, {...userInfo, email});
  }

  assert.ok(user);
  return user;
}

export async function setupDevUser(options: ISetupDevUserOptions = {}) {
  const appOptions: AppRuntimeOptions = {
    getUserEmail: promptEmail,
    getUserInfo: promptUserInfo,
    ...options,
  };

  const context = await setupContext();

  try {
    const workspace = await setupApp(context);
    await executeWithMutationRunOptions(context, async opts => {
      const adminPermissionGroup = await context.semantic.permissionGroup.getByName(
        workspace.resourceId,
        DEFAULT_ADMIN_PERMISSION_GROUP_NAME,
        opts
      );
      assertPermissionGroup(adminPermissionGroup);

      const user = await getUser(context, appOptions);
      const isInWorkspace = await isUserInWorkspace(user, workspace.resourceId);

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
          await internalRespondToCollaborationRequest(
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
        await internalConfirmEmailAddress(context, user.resourceId, user);
      }

      consoleLogger.info(`User ${user.email} is now an admin of workspace ${workspace.name}`);
    });
  } finally {
    disposeApplicationGlobalUtilities();
    await context.dispose();
  }
}
