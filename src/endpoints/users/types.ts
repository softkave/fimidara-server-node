import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_ContentType,
} from '../types.js';
import {ChangePasswordWithCurrentPasswordEndpoint} from './changePasswordWithCurrentPassword/types.js';
import {ChangePasswordWithTokenEndpoint} from './changePasswordWithToken/types.js';
import {ConfirmEmailAddressEndpoint} from './confirmEmailAddress/types.js';
import {ForgotPasswordEndpoint} from './forgotPassword/types.js';
import {GetUserDataEndpoint} from './getUserData/types.js';
import {LoginEndpoint} from './login/types.js';
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
export type ForgotPasswordHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  ForgotPasswordEndpoint,
  HttpEndpointRequestHeaders_ContentType
>;
export type ChangePasswordWithCurrentPasswordHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ChangePasswordWithCurrentPasswordEndpoint>;
export type ChangePasswordWithTokenHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ChangePasswordWithTokenEndpoint>;
export type UpdateUserHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<UpdateUserEndpoint>;
export type GetUserDataHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<GetUserDataEndpoint>;
export type UserExistsHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<
  UserExistsEndpoint,
  HttpEndpointRequestHeaders_ContentType
>;
export type ConfirmEmailAddressHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<ConfirmEmailAddressEndpoint>;
export type SendEmailVerificationCodeHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<SendEmailVerificationCodeEndpoint>;

export type UsersPublicExportedEndpoints = {
  updateUser: UpdateUserHttpEndpoint;
  getUserData: GetUserDataHttpEndpoint;
};
export type UsersPrivateExportedEndpoints = {
  signup: SignupHttpEndpoint;
  login: LoginHttpEndpoint;
  forgotPassword: ForgotPasswordHttpEndpoint;
  changePasswordWithCurrentPassword: ChangePasswordWithCurrentPasswordHttpEndpoint;
  changePasswordWithToken: ChangePasswordWithTokenHttpEndpoint;
  userExists: UserExistsHttpEndpoint;
  confirmEmailAddress: ConfirmEmailAddressHttpEndpoint;
  sendEmailVerificationCode: SendEmailVerificationCodeHttpEndpoint;
};
