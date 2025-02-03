// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  FimidaraEndpointsBase,
  FimidaraEndpointResultWithBinaryResponse,
  FimidaraEndpointOpts,
  FimidaraEndpointDownloadBinaryOpts,
  FimidaraEndpointUploadBinaryOpts,
} from './endpointImports.js';
import {
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
  CountItemsResult,
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult,
  LoginResult,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
  ChangePasswordWithCurrentPasswordEndpointParams,
  ChangePasswordWithTokenEndpointParams,
  ForgotPasswordEndpointParams,
  LoginParams,
  RefreshUserTokenEndpointParams,
  SignupEndpointParams,
  UserExistsEndpointParams,
  UserExistsEndpointResult,
  LoginWithOAuthEndpointParams,
  SignupWithOAuthEndpointParams,
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
  UpgradeWaitlistedUsersEndpointParams,
  GetUsersEndpointParams,
  GetUsersEndpointResult,
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
} from './privateTypes.js';

export class CollaborationRequestsEndpoints extends FimidaraEndpointsBase {
  getUserRequest = async (
    props: GetUserCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetUserCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/getUserRequest',
        method: 'POST',
      },
      opts
    );
  };
  getUserRequests = async (
    props?: GetUserCollaborationRequestsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetUserCollaborationRequestsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/getUserRequests',
        method: 'POST',
      },
      opts
    );
  };
  countUserRequests = async (
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        path: '/v1/collaborationRequests/countUserRequests',
        method: 'POST',
      },
      opts
    );
  };
  respondToRequest = async (
    props: RespondToCollaborationRequestEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<RespondToCollaborationRequestEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborationRequests/respondToRequest',
        method: 'POST',
      },
      opts
    );
  };
}
export class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaboratorsWithoutPermission = async (
    props?: GetCollaboratorsWithoutPermissionEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetCollaboratorsWithoutPermissionEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/collaborators/getCollaboratorsWithoutPermission',
        method: 'POST',
      },
      opts
    );
  };
}
export class UsersEndpoints extends FimidaraEndpointsBase {
  getUserData = async (opts?: FimidaraEndpointOpts): Promise<LoginResult> => {
    return this.executeJson(
      {
        path: '/v1/users/getUserData',
        method: 'POST',
      },
      opts
    );
  };
  updateUser = async (
    props?: UpdateUserEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UpdateUserEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/updateUser',
        method: 'POST',
      },
      opts
    );
  };
  changePasswordWithCurrentPassword = async (
    props: ChangePasswordWithCurrentPasswordEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/changePasswordWithCurrentPassword',
        method: 'POST',
      },
      opts
    );
  };
  changePasswordWithToken = async (
    props: ChangePasswordWithTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/changePasswordWithToken',
        method: 'POST',
      },
      opts
    );
  };
  confirmEmailAddress = async (
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        path: '/v1/users/confirmEmailAddress',
        method: 'POST',
      },
      opts
    );
  };
  forgotPassword = async (
    props: ForgotPasswordEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/forgotPassword',
        method: 'POST',
      },
      opts
    );
  };
  login = async (
    props: LoginParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/login',
        method: 'POST',
      },
      opts
    );
  };
  sendEmailVerificationCode = async (
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        path: '/v1/users/sendEmailVerificationCode',
        method: 'POST',
      },
      opts
    );
  };
  refreshToken = async (
    props: RefreshUserTokenEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/refreshToken',
        method: 'POST',
      },
      opts
    );
  };
  signup = async (
    props: SignupEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/signup',
        method: 'POST',
      },
      opts
    );
  };
  userExists = async (
    props: UserExistsEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<UserExistsEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/userExists',
        method: 'POST',
      },
      opts
    );
  };
  loginWithOAuth = async (
    props: LoginWithOAuthEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    const mapping = {
      oauthUserId: ['body', 'oauthUserId'],
      interServerAuthSecret: ['header', 'x-fimidara-inter-server-auth-secret'],
    } as const;
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/loginWithOAuth',
        method: 'POST',
      },
      opts,
      mapping
    );
  };
  signupWithOAuth = async (
    props: SignupWithOAuthEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<LoginResult> => {
    const mapping = {
      name: ['body', 'name'],
      email: ['body', 'email'],
      emailVerifiedAt: ['body', 'emailVerifiedAt'],
      oauthUserId: ['body', 'oauthUserId'],
      interServerAuthSecret: ['header', 'x-fimidara-inter-server-auth-secret'],
    } as const;
    return this.executeJson(
      {
        data: props,
        path: '/v1/users/signupWithOAuth',
        method: 'POST',
      },
      opts,
      mapping
    );
  };
}
export class WorkspacesEndpoints extends FimidaraEndpointsBase {
  addWorkspace = async (
    props: AddWorkspaceEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<AddWorkspaceEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/workspaces/addWorkspace',
        method: 'POST',
      },
      opts
    );
  };
  getUserWorkspaces = async (
    props?: GetUserWorkspacesEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetUserWorkspacesEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/workspaces/getUserWorkspaces',
        method: 'POST',
      },
      opts
    );
  };
  countUserWorkspaces = async (
    opts?: FimidaraEndpointOpts
  ): Promise<CountItemsResult> => {
    return this.executeJson(
      {
        path: '/v1/workspaces/countUserWorkspaces',
        method: 'POST',
      },
      opts
    );
  };
}
export class InternalsEndpoints extends FimidaraEndpointsBase {
  getWaitlistedUsers = async (
    props?: GetWaitlistedUsersEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWaitlistedUsersEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/internals/getWaitlistedUsers',
        method: 'POST',
      },
      opts
    );
  };
  upgradeWaitlistedUsers = async (
    props: UpgradeWaitlistedUsersEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<void> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/internals/upgradeWaitlistedUsers',
        method: 'POST',
      },
      opts
    );
  };
  getUsers = async (
    props?: GetUsersEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetUsersEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/internals/getUsers',
        method: 'POST',
      },
      opts
    );
  };
  getWorkspaces = async (
    props?: GetWorkspacesEndpointParams,
    opts?: FimidaraEndpointOpts
  ): Promise<GetWorkspacesEndpointResult> => {
    return this.executeJson(
      {
        data: props,
        path: '/v1/internals/getWorkspaces',
        method: 'POST',
      },
      opts
    );
  };
}
export class FimidaraEndpoints extends FimidaraEndpointsBase {
  collaborationRequests = new CollaborationRequestsEndpoints(this.config, this);
  collaborators = new CollaboratorsEndpoints(this.config, this);
  users = new UsersEndpoints(this.config, this);
  workspaces = new WorkspacesEndpoints(this.config, this);
  internals = new InternalsEndpoints(this.config, this);
}
