import {endpointConstants} from '../constants';

export const userConstants = {
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
    signup: `${endpointConstants.apiv1}/users/signup`,
    login: `${endpointConstants.apiv1}/users/login`,
    forgotPassword: `${endpointConstants.apiv1}/users/forgotPassword`,
    changePasswordWithCurrentPassword: `${endpointConstants.apiv1}/users/changePasswordWithCurrentPassword`,
    changePasswordWithToken: `${endpointConstants.apiv1}/users/changePasswordWithToken`,
    changePassword: `${endpointConstants.apiv1}/users/changePassword`,
    updateUser: `${endpointConstants.apiv1}/users/updateUser`,
    getUserData: `${endpointConstants.apiv1}/users/getUserData`,
    userExists: `${endpointConstants.apiv1}/users/userExists`,
    confirmEmailAddress: `${endpointConstants.apiv1}/users/confirmEmailAddress`,
    sendEmailVerificationCode: `${endpointConstants.apiv1}/users/sendEmailVerificationCode`,
  },
};
