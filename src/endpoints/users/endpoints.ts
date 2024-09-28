import {kEndpointTag} from '../types.js';
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
import {UsersExportedEndpoints} from './types.js';
import updateUser from './updateUser/handler.js';
import userExists from './userExists/handler.js';

export function getUsersHttpEndpoints() {
  const usersExportedEndpoints: UsersExportedEndpoints = {
    getUserData: {
      tag: [kEndpointTag.private],
      fn: getUserData,
      mddocHttpDefinition: getUserDataEndpointDefinition,
    },
    updateUser: {
      tag: [kEndpointTag.private],
      fn: updateUser,
      mddocHttpDefinition: updateUserEndpointDefinition,
    },
    changePasswordWithCurrentPassword: {
      tag: [kEndpointTag.private],
      fn: changePasswordWithCurrentPassword,
      mddocHttpDefinition: changePasswordWithCurrentPasswordEndpointDefinition,
    },
    changePasswordWithToken: {
      tag: [kEndpointTag.private],
      fn: changePasswordWithToken,
      mddocHttpDefinition: changePasswordWithTokenEndpointDefinition,
    },
    confirmEmailAddress: {
      tag: [kEndpointTag.private],
      fn: confirmEmailAddress,
      mddocHttpDefinition: confirmEmailAddressEndpointDefinition,
    },
    forgotPassword: {
      tag: [kEndpointTag.private],
      fn: forgotPassword,
      mddocHttpDefinition: forgotPasswordEndpointDefinition,
    },
    login: {
      tag: [kEndpointTag.private],
      fn: login,
      mddocHttpDefinition: loginEndpointDefinition,
    },
    sendEmailVerificationCode: {
      tag: [kEndpointTag.private],
      fn: sendEmailVerificationCode,
      mddocHttpDefinition: sendEmailVerificationCodeEndpointDefinition,
    },
    signup: {
      tag: [kEndpointTag.private],
      fn: signup,
      mddocHttpDefinition: signupEndpointDefinition,
    },
    userExists: {
      tag: [kEndpointTag.private],
      fn: userExists,
      mddocHttpDefinition: userExistsEndpointDefinition,
    },
  };

  return usersExportedEndpoints;
}
