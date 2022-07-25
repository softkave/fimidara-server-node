import * as assert from 'assert';
import inquirer from 'inquirer';
import {getMongoConnection} from '../../src/db/connection';
import {CollaborationRequestStatusType} from '../../src/definitions/collaborationRequest';
import {AppResourceType, systemAgent} from '../../src/definitions/system';
import {IUserWithWorkspace} from '../../src/definitions/user';
import {IWorkspace} from '../../src/definitions/workspace';
import {
  assignWorkspaceToUser,
  saveResourceAssignedItems,
} from '../../src/endpoints/assignedItems/addAssignedItems';
import {populateAssignedItems} from '../../src/endpoints/assignedItems/getAssignedItems';
import CollaborationRequestQueries from '../../src/endpoints/collaborationRequests/queries';
import {internalRespondToRequest} from '../../src/endpoints/collaborationRequests/respondToRequest/utils';
import BaseContext, {
  getCacheProviders,
  getDataProviders,
  getFileProvider,
  getLogicProviders,
  IBaseContext,
} from '../../src/endpoints/contexts/BaseContext';
import MongoDBDataProviderContext from '../../src/endpoints/contexts/MongoDBDataProviderContext';
import EndpointReusableQueries from '../../src/endpoints/queries';
import {setupApp} from '../../src/endpoints/runtime/initAppSetup';
import NoopEmailProviderContext from '../../src/endpoints/test-utils/context/NoopEmailProviderContext';
import {internalSignupUser} from '../../src/endpoints/user/signup/utils';
import UserQueries from '../../src/endpoints/user/UserQueries';
import {
  getUserWithWorkspaceByEmail,
  isUserInWorkspace,
} from '../../src/endpoints/user/utils';
import {DEFAULT_ADMIN_PERMISSION_GROUP_NAME} from '../../src/endpoints/workspaces/addWorkspace/utils';
import {
  extractProdEnvsSchema,
  getAppVariables,
} from '../../src/resources/appVariables';

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

type AppRuntimeOptions = Required<
  Pick<ISetupDevUserOptions, 'getUserEmail' | 'getUserInfo'>
>;

async function setupContext() {
  const appVariables = getAppVariables(extractProdEnvsSchema);
  const connection = await getMongoConnection(
    appVariables.mongoDbURI,
    appVariables.mongoDbDatabaseName
  );

  const mongoDBDataProvider = new MongoDBDataProviderContext(connection);
  const emailProvider = new NoopEmailProviderContext();
  const ctx = new BaseContext(
    mongoDBDataProvider,
    emailProvider,
    getFileProvider(appVariables),
    appVariables,
    getDataProviders(connection),
    getCacheProviders(),
    getLogicProviders(),
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

async function isUserAdmin(
  context: IBaseContext,
  userId: string,
  workspaceId: string,
  adminPermissionGroupId: string
) {
  const userData = await populateAssignedItems(
    context,
    workspaceId,
    {resourceId: userId},
    AppResourceType.User,
    [AppResourceType.PermissionGroup]
  );

  const isAdmin = userData.permissionGroups.some(
    group => group.permissionGroupId === adminPermissionGroupId
  );

  return isAdmin;
}

async function makeUserAdmin(
  context: IBaseContext,
  userId: string,
  workspace: IWorkspace,
  adminPermissionGroupId: string
) {
  const isAdmin = await isUserAdmin(
    context,
    userId,
    workspace.resourceId,
    adminPermissionGroupId
  );

  if (!isAdmin) {
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
  const userExists = await context.data.user.checkItemExists(
    UserQueries.getByEmail(email)
  );

  let user: IUserWithWorkspace;
  if (userExists) {
    user = await getUserWithWorkspaceByEmail(context, email);
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
  const adminPermissionGroup = await context.data.permissiongroup.assertGetItem(
    EndpointReusableQueries.getByWorkspaceAndName(
      workspace.resourceId,
      DEFAULT_ADMIN_PERMISSION_GROUP_NAME
    )
  );

  const user = await getUser(context, appOptions);
  const isInWorkspace = await isUserInWorkspace(user, workspace.resourceId);
  if (isInWorkspace) {
    await makeUserAdmin(
      context,
      user.resourceId,
      workspace,
      adminPermissionGroup.resourceId
    );
  } else {
    const request = await context.data.collaborationRequest.getItem(
      CollaborationRequestQueries.getByUserEmail(user.email)
    );

    if (request) {
      await internalRespondToRequest(context, user, {
        requestId: request.resourceId,
        response: CollaborationRequestStatusType.Accepted,
      });
    } else {
      await assignWorkspaceToUser(
        context,
        systemAgent,
        workspace.resourceId,
        user
      );
    }

    await makeUserAdmin(
      context,
      user.resourceId,
      workspace,
      adminPermissionGroup.resourceId
    );
  }

  console.log(
    `User ${user.email} is now an admin of workspace ${workspace.name}`
  );
  await context.dispose();
  return {user, workspace, adminPermissionGroup};
}
