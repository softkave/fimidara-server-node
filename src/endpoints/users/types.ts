import {ExportedHttpEndpoint} from '../types';
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

export type UsersExportedEndpoints = {
  signup: ExportedHttpEndpoint<SignupEndpoint>;
  login: ExportedHttpEndpoint<LoginEndpoint>;
  forgotPassword: ExportedHttpEndpoint<ForgotPasswordEndpoint>;
  changePasswordWithCurrentPassword: ExportedHttpEndpoint<ChangePasswordWithCurrentPasswordEndpoint>;
  changePasswordWithToken: ExportedHttpEndpoint<ChangePasswordWithTokenEndpoint>;
  updateUser: ExportedHttpEndpoint<UpdateUserEndpoint>;
  getUserData: ExportedHttpEndpoint<GetUserDataEndpoint>;
  userExists: ExportedHttpEndpoint<UserExistsEndpoint>;
  confirmEmailAddress: ExportedHttpEndpoint<ConfirmEmailAddressEndpoint>;
  sendEmailVerificationCode: ExportedHttpEndpoint<SendEmailVerificationCodeEndpoint>;
};
