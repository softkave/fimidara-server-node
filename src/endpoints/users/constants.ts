import {kEndpointConstants} from '../constants.js';

export const kUserConstants = {
  minNameLength: 1,
  maxNameLength: 50,
  minPasswordLength: 7,
  maxPasswordLength: 45,
  changePasswordTokenExpDurationInDays: 2,
  defaultTokenQueryParam: 't',
  confirmEmailTokenQueryParam: 'ct',
  phoneVerificationCodeExpirationDurationInMins: 10,
  emailVerificationCodeExpirationDurationInMins: 30,
  verificationCodeRateLimitInMins: 1,
  emailVerificationCodeLength: 5,
  routes: {
    signup: `${kEndpointConstants.apiv1}/users/signup`,
    login: `${kEndpointConstants.apiv1}/users/login`,
    forgotPassword: `${kEndpointConstants.apiv1}/users/forgotPassword`,
    changePasswordWithCurrentPassword: `${kEndpointConstants.apiv1}/users/changePasswordWithCurrentPassword`,
    changePasswordWithToken: `${kEndpointConstants.apiv1}/users/changePasswordWithToken`,
    changePassword: `${kEndpointConstants.apiv1}/users/changePassword`,
    updateUser: `${kEndpointConstants.apiv1}/users/updateUser`,
    getUserData: `${kEndpointConstants.apiv1}/users/getUserData`,
    userExists: `${kEndpointConstants.apiv1}/users/userExists`,
    confirmEmailAddress: `${kEndpointConstants.apiv1}/users/confirmEmailAddress`,
    sendEmailVerificationCode: `${kEndpointConstants.apiv1}/users/sendEmailVerificationCode`,
    refreshToken: `${kEndpointConstants.apiv1}/users/refreshToken`,
  },
};
