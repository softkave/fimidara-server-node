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
} from './private-types';

class UsersEndpoints extends FimidaraEndpointsBase {
  changePasswordWithCurrentPassword = async (
    props: FimidaraEndpointParamsRequired<ChangePasswordWithCurrentPasswordEndpointParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/changePasswordWithCurrentPassword',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  changePasswordWithToken = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/users/changePasswordWithToken',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  confirmEmailAddress = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/users/confirmEmailAddress',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  forgotPassword = async (
    props: FimidaraEndpointParamsRequired<ForgotPasswordEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/forgotPassword',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  login = async (
    props: FimidaraEndpointParamsRequired<LoginParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/login',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  sendEmailVerificationCode = async (
    props?: FimidaraEndpointParamsOptional<undefined>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: undefined,
      formdata: undefined,
      path: '/v1/users/sendEmailVerificationCode',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  signup = async (
    props: FimidaraEndpointParamsRequired<SignupEndpointParams>
  ): Promise<FimidaraEndpointResult<LoginResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/signup',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  userExists = async (
    props: FimidaraEndpointParamsRequired<UserExistsEndpointParams>
  ): Promise<FimidaraEndpointResult<UserExistsEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/users/userExists',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class CollaboratorsEndpoints extends FimidaraEndpointsBase {
  getCollaboratorsWithoutPermission = async (
    props?: FimidaraEndpointParamsOptional<GetCollaboratorsWithoutPermissionEndpointParams>
  ): Promise<
    FimidaraEndpointResult<GetCollaboratorsWithoutPermissionEndpointResult>
  > => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/collaborators/getCollaboratorsWithoutPermission',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}
class InternalsEndpoints extends FimidaraEndpointsBase {
  getWaitlistedUsers = async (
    props?: FimidaraEndpointParamsOptional<GetWaitlistedUsersEndpointParams>
  ): Promise<FimidaraEndpointResult<GetWaitlistedUsersEndpointResult>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/internals/getWaitlistedUsers',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
  upgradeWaitlistedUsers = async (
    props: FimidaraEndpointParamsRequired<UpgradeWaitlistedUsersEndpointParams>
  ): Promise<FimidaraEndpointResult<undefined>> => {
    const response = await invokeEndpoint({
      token: this.getAuthToken(props),
      data: props?.body,
      formdata: undefined,
      path: '/v1/internals/upgradeWaitlistedUsers',
      method: 'POST',
    });
    const result = {
      headers: response.headers as any,
      body: await response.json(),
    };
    return result;
  };
}

export class FimidaraEndpoints extends FimidaraEndpointsBase {
  users = new UsersEndpoints(this.config, this);
  collaborators = new CollaboratorsEndpoints(this.config, this);
  internals = new InternalsEndpoints(this.config, this);
}
