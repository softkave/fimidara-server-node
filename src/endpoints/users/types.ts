import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpointRequestHeaders_ContentType,
} from '../types';
import {ChangePasswordWithCurrentPasswordEndpoint} from './changePasswordWithCurrentPassword/types';
import {ChangePasswordWithTokenEndpoint} from './changePasswordWithToken/types';
import {ConfirmEmailAddressEndpoint} from './confirmEmailAddress/types';
import {ForgotPasswordEndpoint} from './forgotPassword/types';
import {GetUserDataEndpoint} from './getUserData/types';
import {LoginEndpoint} from './login/types';
import {SendEmailVerificationCodeEndpoint} from './sendEmailVerificationCode/types';
import {SignupEndpoint} from './signup/types';
import {UpdateUserEndpoint} from './updateUser/types';
import {UserExistsEndpoint} from './userExists/types';

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
