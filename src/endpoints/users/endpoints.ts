import {kEndpointTag} from '../types.js';
import changePasswordEndpoint from './changePassword/handler.js';
import changePasswordWithCurrentPassword from './changePasswordWithCurrentPassword/handler.js';
import confirmEmailAddressEndpoint from './confirmEmailAddress/handler.js';
import {
  changePasswordWithCurrentPasswordEndpointDefinition,
  changePasswordWithTokenEndpointDefinition,
  confirmEmailAddressEndpointDefinition,
  forgotPasswordEndpointDefinition,
  getUserDataEndpointDefinition,
  loginEndpointDefinition,
  refreshUserTokenEndpointDefinition,
  sendEmailVerificationCodeEndpointDefinition,
  signupEndpointDefinition,
  updateUserEndpointDefinition,
  userExistsEndpointDefinition,
} from './endpoint.mddoc.js';
import forgotPasswordEndpoint from './forgotPassword/handler.js';
import getUserData from './getUser/handler.js';
import loginEndpoint from './login/handler.js';
import refreshUserTokenEndpoint from './refreshToken/handler.js';
import sendEmailVerificationCodeEndpoint from './sendEmailVerificationCode/handler.js';
import signupEndpoint from './signup/handler.js';
import {UsersExportedEndpoints} from './types.js';
import updateUserEndpoint from './updateUser/handler.js';
import userExistsEndpoint from './userExists/handler.js';

export function getUsersHttpEndpoints() {
  const usersExportedEndpoints: UsersExportedEndpoints = {
    getUserData: {
      tag: [kEndpointTag.private],
      fn: getUserData,
      mddocHttpDefinition: getUserDataEndpointDefinition,
    },
    updateUser: {
      tag: [kEndpointTag.private],
      fn: updateUserEndpoint,
      mddocHttpDefinition: updateUserEndpointDefinition,
    },
    changePasswordWithCurrentPassword: {
      tag: [kEndpointTag.private],
      fn: changePasswordWithCurrentPassword,
      mddocHttpDefinition: changePasswordWithCurrentPasswordEndpointDefinition,
    },
    changePasswordWithToken: {
      tag: [kEndpointTag.private],
      fn: changePasswordEndpoint,
      mddocHttpDefinition: changePasswordWithTokenEndpointDefinition,
    },
    confirmEmailAddress: {
      tag: [kEndpointTag.private],
      fn: confirmEmailAddressEndpoint,
      mddocHttpDefinition: confirmEmailAddressEndpointDefinition,
    },
    forgotPassword: {
      tag: [kEndpointTag.private],
      fn: forgotPasswordEndpoint,
      mddocHttpDefinition: forgotPasswordEndpointDefinition,
    },
    login: {
      tag: [kEndpointTag.private],
      fn: loginEndpoint,
      mddocHttpDefinition: loginEndpointDefinition,
    },
    sendEmailVerificationCode: {
      tag: [kEndpointTag.private],
      fn: sendEmailVerificationCodeEndpoint,
      mddocHttpDefinition: sendEmailVerificationCodeEndpointDefinition,
    },
    refreshToken: {
      tag: [kEndpointTag.private],
      fn: refreshUserTokenEndpoint,
      mddocHttpDefinition: refreshUserTokenEndpointDefinition,
    },
    signup: {
      tag: [kEndpointTag.private],
      fn: signupEndpoint,
      mddocHttpDefinition: signupEndpointDefinition,
    },
    userExists: {
      tag: [kEndpointTag.private],
      fn: userExistsEndpoint,
      mddocHttpDefinition: userExistsEndpointDefinition,
    },
  };

  return usersExportedEndpoints;
}
