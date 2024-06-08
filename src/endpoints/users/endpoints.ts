import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler.js';
import changePasswordWithToken from './changePasswordWithToken/handler.js';
import confirmEmailAddress from './confirmEmailAddress/handler.js';
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
} from './endpoint.mddoc.js';
import forgotPassword from './forgotPassword/forgotPassword.js';
import getUserData from './getUserData/getUserData.js';
import login from './login/login.js';
import sendEmailVerificationCode from './sendEmailVerificationCode/handler.js';
import signup from './signup/signup.js';
import {UsersPrivateExportedEndpoints, UsersPublicExportedEndpoints} from './types.js';
import updateUser from './updateUser/handler.js';
import userExists from './userExists/handler.js';

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
