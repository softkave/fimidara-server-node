import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler';
import changePasswordWithToken from './changePasswordWithToken/handler';
import confirmEmailAddress from './confirmEmailAddress/handler';
import {
  changePasswordWithCurrentPasswordEndpointDefinition,
  changePasswordWithTokenEndpointDefinition,
  confirmEmailAddressEndpointDefinition,
  forgotPasswordEndpointDefinition,
  getUserDataEndpointDefinition,
  loginEndpointDefinition,
  sendEmailVerificationCodeEndpointDefinition,
  signupEndpointDefinition,
  updateUserEndpointDefinition,
  userExistsEndpointDefinition,
} from './endpoint.mddoc';
import forgotPassword from './forgotPassword/forgotPassword';
import getUserData from './getUserData/getUserData';
import login from './login/login';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler';
import signup from './signup/signup';
import {UsersExportedEndpoints} from './types';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';

export const usersExportedEndpoints: UsersExportedEndpoints = {
  changePasswordWithCurrentPassword: {
    fn: changePasswordWithCurrentPassword,
    mddocHttpDefinition: changePasswordWithCurrentPasswordEndpointDefinition,
  },
  changePasswordWithToken: {
    fn: changePasswordWithToken,
    mddocHttpDefinition: changePasswordWithTokenEndpointDefinition,
  },
  confirmEmailAddress: {
    fn: confirmEmailAddress,
    mddocHttpDefinition: confirmEmailAddressEndpointDefinition,
  },
  forgotPassword: {
    fn: forgotPassword,
    mddocHttpDefinition: forgotPasswordEndpointDefinition,
  },
  getUserData: {
    fn: getUserData,
    mddocHttpDefinition: getUserDataEndpointDefinition,
  },
  login: {
    fn: login,
    mddocHttpDefinition: loginEndpointDefinition,
  },
  sendEmailVerificationCode: {
    fn: sendEmailVerificationCode,
    mddocHttpDefinition: sendEmailVerificationCodeEndpointDefinition,
  },
  signup: {
    fn: signup,
    mddocHttpDefinition: signupEndpointDefinition,
  },
  updateUser: {
    fn: updateUser,
    mddocHttpDefinition: updateUserEndpointDefinition,
  },
  userExists: {
    fn: userExists,
    mddocHttpDefinition: userExistsEndpointDefinition,
  },
};
