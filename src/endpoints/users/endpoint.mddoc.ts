import {PublicUser, UserWorkspace} from '../../definitions/user';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './changePasswordWithCurrentPassword/types';
import {ChangePasswordWithTokenEndpointParams} from './changePasswordWithToken/types';
import {userConstants} from './constants';
import {ForgotPasswordEndpointParams} from './forgotPassword/types';
import {LoginEndpointParams, LoginResult} from './login/types';
import {SignupEndpointParams} from './signup/types';
import {UpdateUserEndpointParams, UpdateUserEndpointResult} from './updateUser/types';
import {UserExistsEndpointParams, UserExistsEndpointResult} from './userExists/types';

const currentPassword = fReusables.password.clone().setDescription('Current password.');
const newPassword = fReusables.password.clone().setDescription('New password.');

const userWorkspace = FieldObject.construct<UserWorkspace>()
  .setName('UserWorkspace')
  .setFields({
    joinedAt: FieldObject.requiredField(fReusables.date),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
  });

const user = FieldObject.construct<PublicUser>()
  .setName('User')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    firstName: FieldObject.requiredField(fReusables.firstName),
    lastName: FieldObject.requiredField(fReusables.lastName),
    email: FieldObject.requiredField(fReusables.emailAddress),
    passwordLastChangedAt: FieldObject.requiredField(fReusables.date),
    requiresPasswordChange: FieldObject.optionalField(FieldBoolean.construct()),
    isEmailVerified: FieldObject.requiredField(FieldBoolean.construct()),
    emailVerifiedAt: FieldObject.optionalField(fReusables.date),
    emailVerificationEmailSentAt: FieldObject.optionalField(fReusables.date),
    workspaces: FieldObject.requiredField(
      FieldArray.construct<UserWorkspace>().setType(userWorkspace)
    ),
    isOnWaitlist: FieldObject.requiredField(FieldBoolean.construct()),
  });

const loginResponseBody = FieldObject.construct<LoginResult>()
  .setName('LoginResult')
  .setFields({
    user: FieldObject.requiredField(user),
    token: FieldObject.requiredField(fReusables.tokenString),
    clientAssignedToken: FieldObject.requiredField(fReusables.tokenString),
  })
  .setRequired(true)
  .setDescription('User login result.');

const signupParams = FieldObject.construct<SignupEndpointParams>()
  .setName('SignupEndpointParams')
  .setFields({
    firstName: FieldObject.requiredField(fReusables.firstName),
    lastName: FieldObject.requiredField(fReusables.lastName),
    email: FieldObject.requiredField(fReusables.emailAddress),
    password: FieldObject.requiredField(fReusables.password),
  })
  .setRequired(true)
  .setDescription('Signup user endpoint params.');

const loginParams = FieldObject.construct<LoginEndpointParams>()
  .setName('LoginParams')
  .setFields({
    email: FieldObject.requiredField(fReusables.emailAddress),
    password: FieldObject.requiredField(currentPassword),
  })
  .setRequired(true)
  .setDescription('Login endpoint params.');

const forgotPasswordParams = FieldObject.construct<ForgotPasswordEndpointParams>()
  .setName('ForgotPasswordEndpointParams')
  .setFields({
    email: FieldObject.requiredField(fReusables.emailAddress),
  })
  .setRequired(true)
  .setDescription('Forgot password endpoint params.');

const changePasswordWithCurrentPasswordParams =
  FieldObject.construct<ChangePasswordWithCurrentPasswordEndpointParams>()
    .setName('ChangePasswordWithCurrentPasswordEndpointParams')
    .setFields({
      currentPassword: FieldObject.requiredField(currentPassword),
      password: FieldObject.requiredField(newPassword),
    })
    .setRequired(true)
    .setDescription('Change password with current password endpoint params.');

const changePasswordWithTokenParams = FieldObject.construct<ChangePasswordWithTokenEndpointParams>()
  .setName('ChangePasswordWithTokenEndpointParams')
  .setFields({password: FieldObject.requiredField(newPassword)})
  .setRequired(true)
  .setDescription('Change password with token endpoint params.');

const updateUserParams = FieldObject.construct<UpdateUserEndpointParams>()
  .setName('UpdateUserEndpointParams')
  .setFields({
    firstName: FieldObject.optionalField(fReusables.firstName),
    lastName: FieldObject.optionalField(fReusables.lastName),
    email: FieldObject.optionalField(fReusables.emailAddress),
  })
  .setRequired(true)
  .setDescription('Update user endpoint params.');
const updateUserResponseBody = FieldObject.construct<UpdateUserEndpointResult>()
  .setName('UpdateUserEndpointResult')
  .setFields({
    user: FieldObject.requiredField(user),
  })
  .setRequired(true)
  .setDescription('Update user result.');

const userExistsParams = FieldObject.construct<UserExistsEndpointParams>()
  .setName('UserExistsEndpointParams')
  .setFields({
    email: FieldObject.requiredField(fReusables.emailAddress),
  })
  .setRequired(true)
  .setDescription('User exists endpoint params.');
const userExistsHttpResponseBody = FieldObject.construct<UserExistsEndpointResult>()
  .setFields({
    exists: FieldObject.requiredField(FieldBoolean.construct()),
  })
  .setName('UserExistsEndpointResult');

export const signupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: SignupEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_ContentType;
  responseBody: LoginResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.signup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(signupParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('SignupEndpoint')
  .setDescription('Signup user endpoint.');

export const loginEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: LoginEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_ContentType;
  responseBody: LoginResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.login)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(loginParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('LoginEndpoint')
  .setDescription('Login endpoint.');

export const forgotPasswordEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: ForgotPasswordEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_ContentType;
}>()
  .setBasePathname(userConstants.routes.forgotPassword)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(forgotPasswordParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setName('ForgotPasswordEndpoint')
  .setDescription('Forgot password endpoint.');

// TODO: mddoc doesn't enforce required types, we may have to switch to just
// types and objects
export const changePasswordWithTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: ChangePasswordWithTokenEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.changePasswordWithToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setRequestBody(changePasswordWithTokenParams)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ChangePasswordWithTokenEndpoint')
  .setDescription('Change password with token endpoint. Uses the `Authorization` header.');

export const changePasswordWithCurrentPasswordEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: ChangePasswordWithCurrentPasswordEndpointParams;
    requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: LoginResult;
    responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
  }>()
    .setBasePathname(userConstants.routes.changePasswordWithCurrentPassword)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(changePasswordWithCurrentPasswordParams)
    .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
    .setResponseBody(loginResponseBody)
    .setName('ChangePasswordWithCurrentPasswordEndpoint')
    .setDescription('Change password with current password endpoint.');

export const confirmEmailAddressEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.confirmEmailAddress)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('SendEmailVerificationCodeEndpoint')
  .setDescription(
    'Confirm email address endpoint. Uses the `Authorization` header, and expects a token issued from `forgotPassword`.'
  );

export const getUserDataEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.getUserData)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ConfirmEmailAddressEndpoint')
  .setDescription('Confirm email address endpoint. Uses the `Authorization` header.');

export const sendEmailVerificationCodeEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired;
}>()
  .setBasePathname(userConstants.routes.sendEmailVerificationCode)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired)
  .setName('SendEmailVerificationCodeEndpoint')
  .setDescription(
    'Send email verification code endpoint. Uses the `Authorization` header, and sends a verification token to the email address of the user referenced in the token.'
  );

export const updateUserEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateUserEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateUserEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.updateUser)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateUserParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateUserResponseBody)
  .setName('UpdateUserEndpoint')
  .setDescription('Update user endpoint.');

export const userExistsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UserExistsEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_ContentType;
  responseBody: UserExistsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.userExists)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(userExistsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(userExistsHttpResponseBody)
  .setName('UserExistsEndpoint')
  .setDescription('User exists endpoint.');

export const userEndpointsMddocParts = {user};
