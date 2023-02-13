import * as assert from 'assert';
import * as inquirer from 'inquirer';
import {getMongoConnection} from '../../db/connection';
import {CollaborationRequestStatusType} from '../../definitions/collaborationRequest';
import {AppResourceType, systemAgent} from '../../definitions/system';
import {IUserWithWorkspace} from '../../definitions/user';
import {IWorkspace} from '../../definitions/workspace';
import {assignWorkspaceToUser, saveResourceAssignedItems} from '../../endpoints/assignedItems/addAssignedItems';
import {populateAssignedItems} from '../../endpoints/assignedItems/getAssignedItems';
import CollaborationRequestQueries from '../../endpoints/collaborationRequests/queries';
import {internalRespondToCollaborationRequest} from '../../endpoints/collaborationRequests/respondToRequest/utils';
import BaseContext, {getFileProvider} from '../../endpoints/contexts/BaseContext';
import {IBaseContext} from '../../endpoints/contexts/types';
import {getDataProviders} from '../../endpoints/contexts/utils';
import EndpointReusableQueries from '../../endpoints/queries';
import {setupApp} from '../../endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../../endpoints/test-utils/context/NoopEmailProviderContext';
import internalConfirmEmailAddress from '../../endpoints/user/confirmEmailAddress/internalConfirmEmailAddress';
import {internalSignupUser} from '../../endpoints/user/signup/utils';
import UserQueries from '../../endpoints/user/UserQueries';
import {getCompleteUserDataByEmail, isUserInWorkspace} from '../../endpoints/user/utils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../endpoints/workspaces/addWorkspace/utils';
import {extractProdEnvsSchema, getAppVariables} from '../../resources/vars';
import {consoleLogger} from '../../utils/logger/logger';

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
  const connection = await getMongoConnection(appVariables.mongoDbURI, appVariables.mongoDbDatabaseName);
  const emailProvider = new NoopEmailProviderContext();
  const ctx = new BaseContext(
    getDataProviders(connection),
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    () => connection.close()
  );

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

async function isUserAdmin(context: IBaseContext, userId: string, workspaceId: string, adminPermissionGroupId: string) {
  const userData = await populateAssignedItems(context, workspaceId, {resourceId: userId}, AppResourceType.User, [
    AppResourceType.PermissionGroup,
  ]);

  const isAdmin = userData.permissionGroups.some(group => group.permissionGroupId === adminPermissionGroupId);
  return isAdmin;
}

async function makeUserAdmin(
  context: IBaseContext,
  userId: string,
  workspace: IWorkspace,
  adminPermissionGroupId: string
) {
  const isAdmin = await isUserAdmin(context, userId, workspace.resourceId, adminPermissionGroupId);

  if (!isAdmin) {
    consoleLogger.info('Making user admin');
    await saveResourceAssignedItems(
      context,
      systemAgent,
      workspace,
      userId,
      AppResourceType.User,
      {
        permissionGroups: [
          {
            permissionGroupId: adminPermissionGroupId,
            order: 0,
          },
        ],
      },
      /* deleteExisting */ false,
      {skipPermissionGroupsCheck: true}
    );
  }
}

async function getUser(context: IBaseContext, options: AppRuntimeOptions) {
  const {email} = await options.getUserEmail();
  const userExists = await context.data.user.existsByQuery(UserQueries.getByEmail(email));
  let user: IUserWithWorkspace;
  if (userExists) {
    user = await getCompleteUserDataByEmail(context, email);
  } else {
    const userInfo = await options.getUserInfo();
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
  const workspace = await setupApp(context);
  const adminPermissionGroup = await context.data.permissiongroup.assertGetOneByQuery(
    EndpointReusableQueries.getByWorkspaceIdAndName(workspace.resourceId, DEFAULT_ADMIN_PERMISSION_GROUP_NAME)
  );

  const user = await getUser(context, appOptions);
  const isInWorkspace = await isUserInWorkspace(user, workspace.resourceId);
  if (isInWorkspace) {
    await makeUserAdmin(context, user.resourceId, workspace, adminPermissionGroup.resourceId);
  } else {
    const request = await context.data.collaborationRequest.getOneByQuery(
      CollaborationRequestQueries.getByUserEmail(user.email)
    );

    if (request) {
      consoleLogger.info('Existing collaboration request found');
      consoleLogger.info(`Accepting request ${request.resourceId}`);
      await internalRespondToCollaborationRequest(context, user, {
        requestId: request.resourceId,
        response: CollaborationRequestStatusType.Accepted,
      });
    } else {
      consoleLogger.info('Adding user to workspace');
      await assignWorkspaceToUser(context, systemAgent, workspace.resourceId, user);
    }

    await makeUserAdmin(context, user.resourceId, workspace, adminPermissionGroup.resourceId);
  }

  if (!user.isEmailVerified) {
    consoleLogger.info(`Verifying email address for user ${user.email}`);
    await internalConfirmEmailAddress(context, user);
  }

  consoleLogger.info(`User ${user.email} is now an admin of workspace ${workspace.name}`);
  await context.dispose();
  return {user, workspace, adminPermissionGroup};
}
