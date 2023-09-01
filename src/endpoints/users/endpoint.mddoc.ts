import {PublicUser, UserWorkspace} from '../../definitions/user';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './changePasswordWithCurrentPassword/types';
import {ChangePasswordWithTokenEndpointParams} from './changePasswordWithToken/types';
import {userConstants} from './constants';
import {ForgotPasswordEndpointParams} from './forgotPassword/types';
import {LoginEndpointParams, LoginResult} from './login/types';
import {SignupEndpointParams} from './signup/types';
import {
  ChangePasswordWithCurrentPasswordHttpEndpoint,
  ChangePasswordWithTokenHttpEndpoint,
  ConfirmEmailAddressHttpEndpoint,
  ForgotPasswordHttpEndpoint,
  GetUserDataHttpEndpoint,
  LoginHttpEndpoint,
  SendEmailVerificationCodeHttpEndpoint,
  SignupHttpEndpoint,
  UpdateUserHttpEndpoint,
  UserExistsHttpEndpoint,
} from './types';
import {UpdateUserEndpointParams, UpdateUserEndpointResult} from './updateUser/types';
import {UserExistsEndpointParams, UserExistsEndpointResult} from './userExists/types';

const currentPassword = fReusables.password.clone().setDescription('Current password.');
const newPassword = fReusables.password.clone().setDescription('New password.');

const userWorkspace = mddocConstruct
  .constructFieldObject<UserWorkspace>()
  .setName('UserWorkspace')
  .setFields({
    joinedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
  });

const user = mddocConstruct
  .constructFieldObject<PublicUser>()
  .setName('User')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    firstName: mddocConstruct.constructFieldObjectField(true, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(true, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
    passwordLastChangedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    requiresPasswordChange: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct.constructFieldBoolean()
    ),
    isEmailVerified: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    emailVerificationEmailSentAt: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    workspaces: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<UserWorkspace>().setType(userWorkspace)
    ),
    isOnWaitlist: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
  });

const loginResponseBody = mddocConstruct
  .constructFieldObject<LoginResult>()
  .setName('LoginResult')
  .setFields({
    user: mddocConstruct.constructFieldObjectField(true, user),
    token: mddocConstruct.constructFieldObjectField(true, fReusables.tokenString),
    clientAssignedToken: mddocConstruct.constructFieldObjectField(true, fReusables.tokenString),
  })
  .setDescription('User login result.');

const signupParams = mddocConstruct
  .constructFieldObject<SignupEndpointParams>()
  .setName('SignupEndpointParams')
  .setFields({
    firstName: mddocConstruct.constructFieldObjectField(true, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(true, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
    password: mddocConstruct.constructFieldObjectField(true, fReusables.password),
  })
  .setDescription('Signup user endpoint params.');

const loginParams = mddocConstruct
  .constructFieldObject<LoginEndpointParams>()
  .setName('LoginParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
    password: mddocConstruct.constructFieldObjectField(true, currentPassword),
  })
  .setDescription('Login endpoint params.');

const forgotPasswordParams = mddocConstruct
  .constructFieldObject<ForgotPasswordEndpointParams>()
  .setName('ForgotPasswordEndpointParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
  })
  .setDescription('Forgot password endpoint params.');

const changePasswordWithCurrentPasswordParams = mddocConstruct
  .constructFieldObject<ChangePasswordWithCurrentPasswordEndpointParams>()
  .setName('ChangePasswordWithCurrentPasswordEndpointParams')
  .setFields({
    currentPassword: mddocConstruct.constructFieldObjectField(true, currentPassword),
    password: mddocConstruct.constructFieldObjectField(true, newPassword),
  })
  .setDescription('Change password with current password endpoint params.');

const changePasswordWithTokenParams = mddocConstruct
  .constructFieldObject<ChangePasswordWithTokenEndpointParams>()
  .setName('ChangePasswordWithTokenEndpointParams')
  .setFields({password: mddocConstruct.constructFieldObjectField(true, newPassword)})
  .setDescription('Change password with token endpoint params.');

const updateUserParams = mddocConstruct
  .constructFieldObject<UpdateUserEndpointParams>()
  .setName('UpdateUserEndpointParams')
  .setFields({
    firstName: mddocConstruct.constructFieldObjectField(false, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(false, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(false, fReusables.emailAddress),
  })
  .setDescription('Update user endpoint params.');
const updateUserResponseBody = mddocConstruct
  .constructFieldObject<UpdateUserEndpointResult>()
  .setName('UpdateUserEndpointResult')
  .setFields({
    user: mddocConstruct.constructFieldObjectField(true, user),
  })
  .setDescription('Update user result.');

const userExistsParams = mddocConstruct
  .constructFieldObject<UserExistsEndpointParams>()
  .setName('UserExistsEndpointParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
  })
  .setDescription('User exists endpoint params.');
const userExistsHttpResponseBody = mddocConstruct
  .constructFieldObject<UserExistsEndpointResult>()
  .setFields({
    exists: mddocConstruct.constructFieldObjectField(true, mddocConstruct.constructFieldBoolean()),
  })
  .setName('UserExistsEndpointResult');

export const signupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<SignupHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.signup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(signupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('SignupEndpoint')
  .setDescription('Signup user endpoint.');

export const loginEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<LoginHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.login)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(loginParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('LoginEndpoint')
  .setDescription('Login endpoint.');

export const forgotPasswordEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<ForgotPasswordHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<ForgotPasswordHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<ForgotPasswordHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<ForgotPasswordHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<ForgotPasswordHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.forgotPassword)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(forgotPasswordParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setName('ForgotPasswordEndpoint')
  .setDescription('Forgot password endpoint.');

// TODO: mddoc doesn't enforce required types, we may have to switch to just
// types and objects
export const changePasswordWithTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.changePasswordWithToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setRequestBody(changePasswordWithTokenParams)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ChangePasswordWithTokenEndpoint')
  .setDescription('Change password with token endpoint. Uses the `Authorization` header.');

export const changePasswordWithCurrentPasswordEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ChangePasswordWithCurrentPasswordHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(userConstants.routes.changePasswordWithCurrentPassword)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(changePasswordWithCurrentPasswordParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ChangePasswordWithCurrentPasswordEndpoint')
  .setDescription('Change password with current password endpoint.');

export const confirmEmailAddressEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.confirmEmailAddress)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('SendEmailVerificationCodeEndpoint')
  .setDescription(
    'Confirm email address endpoint. Uses the `Authorization` header, and expects a token issued from `forgotPassword`.'
  );

export const getUserDataEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetUserDataHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetUserDataHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetUserDataHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<GetUserDataHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<GetUserDataHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetUserDataHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.getUserData)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ConfirmEmailAddressEndpoint')
  .setDescription('Confirm email address endpoint. Uses the `Authorization` header.');

export const sendEmailVerificationCodeEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(userConstants.routes.sendEmailVerificationCode)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired)
  .setName('SendEmailVerificationCodeEndpoint')
  .setDescription(
    'Send email verification code endpoint. Uses the `Authorization` header, and sends a verification token to the email address of the user referenced in the token.'
  );

export const updateUserEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<UpdateUserHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<UpdateUserHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<UpdateUserHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<UpdateUserHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<UpdateUserHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<UpdateUserHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.updateUser)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateUserParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateUserResponseBody)
  .setName('UpdateUserEndpoint')
  .setDescription('Update user endpoint.');

export const userExistsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<UserExistsHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<UserExistsHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<UserExistsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<UserExistsHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<UserExistsHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<UserExistsHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(userConstants.routes.userExists)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(userExistsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(userExistsHttpResponseBody)
  .setName('UserExistsEndpoint')
  .setDescription('User exists endpoint.');

export const userEndpointsMddocParts = {user};
