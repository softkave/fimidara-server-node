import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {
  ChangePasswordWithCurrentPasswordEndpoint,
  ChangePasswordWithCurrentPasswordEndpointParams,
} from './changePasswordWithCurrentPassword/types';
import {
  ChangePasswordWithTokenEndpoint,
  ChangePasswordWithTokenEndpointParams,
} from './changePasswordWithToken/types';
import {ConfirmEmailAddressEndpoint} from './confirmEmailAddress/types';
import {ForgotPasswordEndpoint, ForgotPasswordEndpointParams} from './forgotPassword/types';
import {GetUserDataEndpoint} from './getUserData/types';
import {LoginEndpoint, LoginEndpointParams, LoginResult} from './login/types';
import {
  SendEmailVerificationCodeEndpoint,
  SendEmailVerificationCodeEndpointParams,
} from './sendEmailVerificationCode/types';
import {SignupEndpoint, SignupEndpointParams} from './signup/types';
import {
  UpdateUserEndpoint,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
} from './updateUser/types';
import {
  UserExistsEndpoint,
  UserExistsEndpointParams,
  UserExistsEndpointResult,
} from './userExists/types';

export type SignupHttpEndpoint = HttpEndpoint<
  SignupEndpoint,
  SignupEndpointParams,
  LoginResult,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type LoginHttpEndpoint = HttpEndpoint<
  LoginEndpoint,
  LoginEndpointParams,
  LoginResult,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type ForgotPasswordHttpEndpoint = HttpEndpoint<
  ForgotPasswordEndpoint,
  ForgotPasswordEndpointParams,
  {},
  HttpEndpointRequestHeaders_ContentType,
  {}
>;
export type ChangePasswordWithCurrentPasswordHttpEndpoint = HttpEndpoint<
  ChangePasswordWithCurrentPasswordEndpoint,
  ChangePasswordWithCurrentPasswordEndpointParams,
  LoginResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type ChangePasswordWithTokenHttpEndpoint = HttpEndpoint<
  ChangePasswordWithTokenEndpoint,
  ChangePasswordWithTokenEndpointParams,
  LoginResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UpdateUserHttpEndpoint = HttpEndpoint<
  UpdateUserEndpoint,
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type GetUserDataHttpEndpoint = HttpEndpoint<
  GetUserDataEndpoint,
  {},
  LoginResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type UserExistsHttpEndpoint = HttpEndpoint<
  UserExistsEndpoint,
  UserExistsEndpointParams,
  UserExistsEndpointResult,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type ConfirmEmailAddressHttpEndpoint = HttpEndpoint<
  ConfirmEmailAddressEndpoint,
  {},
  LoginResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength
>;
export type SendEmailVerificationCodeHttpEndpoint = HttpEndpoint<
  SendEmailVerificationCodeEndpoint,
  SendEmailVerificationCodeEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired,
  {}
>;

export type UsersPublicExportedEndpoints = {
  updateUser: ExportedHttpEndpointWithMddocDefinition<UpdateUserHttpEndpoint>;
  getUserData: ExportedHttpEndpointWithMddocDefinition<GetUserDataHttpEndpoint>;
};
export type UsersPrivateExportedEndpoints = {
  signup: ExportedHttpEndpointWithMddocDefinition<SignupHttpEndpoint>;
  login: ExportedHttpEndpointWithMddocDefinition<LoginHttpEndpoint>;
  forgotPassword: ExportedHttpEndpointWithMddocDefinition<ForgotPasswordHttpEndpoint>;
  changePasswordWithCurrentPassword: ExportedHttpEndpointWithMddocDefinition<ChangePasswordWithCurrentPasswordHttpEndpoint>;
  changePasswordWithToken: ExportedHttpEndpointWithMddocDefinition<ChangePasswordWithTokenHttpEndpoint>;
  userExists: ExportedHttpEndpointWithMddocDefinition<UserExistsHttpEndpoint>;
  confirmEmailAddress: ExportedHttpEndpointWithMddocDefinition<ConfirmEmailAddressHttpEndpoint>;
  sendEmailVerificationCode: ExportedHttpEndpointWithMddocDefinition<SendEmailVerificationCodeHttpEndpoint>;
};
