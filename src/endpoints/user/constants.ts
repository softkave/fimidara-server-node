import {endpointConstants} from '../constants';

export const userConstants = {
  minNameLength: 1,
  maxNameLength: 50,
  minPasswordLength: 7,
  maxPasswordLength: 45,
  changePasswordTokenExpDurationInDays: 2,
  defaultTokenQueryParam: 't',
  confirmEmailTokenQueryParam: 'cet',
  phoneVerificationCodeExpirationDurationInMins: 10,
  emailVerificationCodeExpirationDurationInMins: 30,
  verificationCodeRateLimitInMins: 1,
  emailVerificationCodeLength: 5,
  routes: {
    signup: `${endpointConstants.apiv1}/account/signup`,
    login: `${endpointConstants.apiv1}/account/login`,
    forgotPassword: `${endpointConstants.apiv1}/account/forgotPassword`,
    changePasswordWithCurrentPassword: `${endpointConstants.apiv1}/account/changePasswordWithCurrentPassword`,
    changePasswordWithToken: `${endpointConstants.apiv1}/account/changePasswordWithToken`,
    changePassword: `${endpointConstants.apiv1}/account/changePassword`,
    updateUser: `${endpointConstants.apiv1}/account/updateUser`,
    getUserData: `${endpointConstants.apiv1}/account/getUserData`,
    userExists: `${endpointConstants.apiv1}/account/userExists`,
    confirmEmailAddress: `${endpointConstants.apiv1}/account/confirmEmailAddress`,
    sendEmailVerificationCode: `${endpointConstants.apiv1}/account/sendEmailVerificationCode`,
  },
};
