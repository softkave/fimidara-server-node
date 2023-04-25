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
import {UsersPrivateExportedEndpoints, UsersPublicExportedEndpoints} from './types';
import updateUser from './updateUser/handler';
import userExists from './userExists/handler';

export function getUsersPublicHttpEndpoints() {
  const usersExportedEndpoints: UsersPublicExportedEndpoints = {
    getUserData: {
      fn: getUserData,
      mddocHttpDefinition: getUserDataEndpointDefinition,
    },
    updateUser: {
      fn: updateUser,
      mddocHttpDefinition: updateUserEndpointDefinition,
    },
  };
  return usersExportedEndpoints;
}

export function getUsersPrivateHttpEndpoints() {
  const usersExportedEndpoints: UsersPrivateExportedEndpoints = {
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
    userExists: {
      fn: userExists,
      mddocHttpDefinition: userExistsEndpointDefinition,
    },
  };
  return usersExportedEndpoints;
}
