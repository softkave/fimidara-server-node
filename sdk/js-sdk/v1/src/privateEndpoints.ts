// This file is auto-generated, do not modify directly.
// Reach out to @abayomi to suggest changes.

import {
  invokeEndpoint,
  FimidaraEndpointsBase,
  FimidaraEndpointResult,
  FimidaraEndpointParamsRequired,
  FimidaraEndpointParamsOptional,
} from './utils';
import {
  ChangePasswordWithCurrentPasswordEndpointParams,
  LoginResult,
  ChangePasswordWithTokenEndpointParams,
  ForgotPasswordEndpointParams,
  LoginParams,
  SignupEndpointParams,
  UserExistsEndpointParams,
  UserExistsEndpointResult,
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult,
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
  UpgradeWaitlistedUsersEndpointParams,
  GetUsersEndpointParams,
  GetUsersEndpointResult,
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
} from './privateTypes';

export class UsersEndpoints extends FimidaraEndpointsBase {
  changePasswordWithCurrentPassword = async (
    props: FimidaraEndpointParamsRequired<ChangePasswordWithCurrentPasswordEndpointParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/changePasswordWithCurrentPassword',
        method: 'POST',
      },
      props
    );
  };
  changePasswordWithToken = async (
    props: FimidaraEndpointParamsRequired<ChangePasswordWithTokenEndpointParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/changePasswordWithToken',
        method: 'POST',
      },
      props
    );
  };
  confirmEmailAddress = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        path: '/v1/users/confirmEmailAddress',
        method: 'POST',
      },
      props
    );
  };
  forgotPassword = async (
    props: FimidaraEndpointParamsRequired<ForgotPasswordEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/forgotPassword',
        method: 'POST',
      },
      props
    );
  };
  login = async (
    props: FimidaraEndpointParamsRequired<LoginParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/login',
        method: 'POST',
      },
      props
    );
  };
  sendEmailVerificationCode = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        path: '/v1/users/sendEmailVerificationCode',
        method: 'POST',
      },
      props
    );
  };
  signup = async (
    props: FimidaraEndpointParamsRequired<SignupEndpointParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/signup',
        method: 'POST',
      },
      props
    );
  };
  userExists = async (
    props: FimidaraEndpointParamsRequired<UserExistsEndpointParams>
  ): Promise<FimidaraEndpointResult<UserExistsEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/users/userExists',
        method: 'POST',
      },
      props
    );
  };
}
export class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaboratorsWithoutPermission = async (
    props?: FimidaraEndpointParamsOptional<GetCollaboratorsWithoutPermissionEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetCollaboratorsWithoutPermissionEndpointResult>
  > => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/collaborators/getCollaboratorsWithoutPermission',
        method: 'POST',
      },
      props
    );
  };
}
export class InternalsEndpoints extends FimidaraEndpointsBase {
  getWaitlistedUsers = async (
    props?: FimidaraEndpointParamsOptional<GetWaitlistedUsersEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWaitlistedUsersEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/internals/getWaitlistedUsers',
        method: 'POST',
      },
      props
    );
  };
  upgradeWaitlistedUsers = async (
    props: FimidaraEndpointParamsRequired<UpgradeWaitlistedUsersEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/internals/upgradeWaitlistedUsers',
        method: 'POST',
      },
      props
    );
  };
  getUsers = async (
    props?: FimidaraEndpointParamsOptional<GetUsersEndpointParams>
  ): Promise<FimidaraEndpointResult<GetUsersEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/internals/getUsers',
        method: 'POST',
      },
      props
    );
  };
  getWorkspaces = async (
    props?: FimidaraEndpointParamsOptional<GetWorkspacesEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWorkspacesEndpointResult>> => {
    return this.executeJson(
      {
        data: props?.body,
        path: '/v1/internals/getWorkspaces',
        method: 'POST',
      },
      props
    );
  };
}
export class FimidaraEndpoints extends FimidaraEndpointsBase {
  users = new UsersEndpoints(this.config, this);
  collaborators = new CollaboratorsEndpoints(this.config, this);
  internals = new InternalsEndpoints(this.config, this);
}
