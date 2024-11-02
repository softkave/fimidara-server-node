import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_ContentType,
} from '../types.js';
import {ChangePasswordEndpoint} from './changePassword/types.js';
import {ConfirmEmailAddressEndpoint} from './confirmEmailAddress/types.js';
import {ForgotPasswordEndpoint} from './forgotPassword/types.js';
import {GetUserEndpoint} from './getUser/types.js';
import {GetUserLoginEndpoint} from './getUserLogin/types.js';
import {GetUsersEndpoint} from './getUsers/types.js';
import {LoginEndpoint} from './login/types.js';
import {RefreshUserTokenEndpoint} from './refreshToken/types.js';
import {SendEmailVerificationCodeEndpoint} from './sendEmailVerificationCode/types.js';
import {SignupEndpoint} from './signup/types.js';
import {UpdateUserEndpoint} from './updateUser/types.js';
import {UserExistsEndpoint} from './userExists/types.js';

export type SignupHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  SignupEndpoint,
  HttpEndpointRequestHeaders_ContentType
>;
export type LoginHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  LoginEndpoint,
  HttpEndpointRequestHeaders_ContentType
>;
export type ForgotPasswordHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<
    ForgotPasswordEndpoint,
    HttpEndpointRequestHeaders_ContentType
  >;
export type ChangePasswordHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ChangePasswordEndpoint>;
export type UpdateUserHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<UpdateUserEndpoint>;
export type GetUserHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUserEndpoint>;
export type GetUsersHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUsersEndpoint>;
export type GetUserLoginHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<GetUserLoginEndpoint>;
export type UserExistsHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  UserExistsEndpoint,
  HttpEndpointRequestHeaders_ContentType
>;
export type ConfirmEmailAddressHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ConfirmEmailAddressEndpoint>;
export type SendEmailVerificationCodeHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<SendEmailVerificationCodeEndpoint>;
export type RefreshUserTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<RefreshUserTokenEndpoint>;

export type UsersExportedEndpoints = {
  updateUser: UpdateUserHttpEndpoint;
  getUser: GetUserHttpEndpoint;
  getUsers: GetUsersHttpEndpoint;
  getUserLogin: GetUserLoginHttpEndpoint;
  signup: SignupHttpEndpoint;
  login: LoginHttpEndpoint;
  forgotPassword: ForgotPasswordHttpEndpoint;
  changePassword: ChangePasswordHttpEndpoint;
  userExists: UserExistsHttpEndpoint;
  confirmEmailAddress: ConfirmEmailAddressHttpEndpoint;
  sendEmailVerificationCode: SendEmailVerificationCodeHttpEndpoint;
  refreshToken: RefreshUserTokenHttpEndpoint;
};
