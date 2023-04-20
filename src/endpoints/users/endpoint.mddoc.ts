import {PublicUser, UserWorkspace} from '../../definitions/user';
import {
  FieldArray,
  FieldBoolean,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  MddocEndpointRequestHeaders_AuthRequired,
  MddocEndpointRequestHeaders_AuthRequired_ContentType,
  MddocEndpointRequestHeaders_ContentType,
  MddocEndpointResponseHeaders_ContentType_ContentLength,
  fReusables,
  mddocEndpointHttpHeaderItems,
} from '../endpoints.mddoc';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './changePasswordWithCurrentPassword/types';
import {
  ChangePasswordWithTokenEndpoint,
  ChangePasswordWithTokenEndpointParams,
} from './changePasswordWithToken/types';
import {userConstants} from './constants';
import {ForgotPasswordEndpointParams} from './forgotPassword/types';
import {LoginEndpointParams, LoginResult} from './login/types';
import {SignupEndpointParams} from './signup/types';
import {UpdateUserEndpointParams} from './updateUser/types';
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
  .setName('PublicUser')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    firstName: FieldObject.requiredField(fReusables.firstName),
    lastName: FieldObject.requiredField(fReusables.lastName),
    email: FieldObject.requiredField(fReusables.emailAddress),
    passwordLastChangedAt: FieldObject.requiredField(fReusables.date),
    isEmailVerified: FieldObject.requiredField(FieldBoolean.construct()),
    emailVerifiedAt: FieldObject.optionalField(fReusables.date),
    emailVerificationEmailSentAt: FieldObject.optionalField(fReusables.date),
    workspaces: FieldObject.requiredField(
      FieldArray.construct<UserWorkspace>().setType(userWorkspace)
    ),
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

const changePasswordWithTokenParams = FieldObject.construct<ChangePasswordWithTokenEndpoint>()
  .setName('ChangePasswordWithTokenEndpoint')
  .setFields({
    password: FieldObject.requiredField(newPassword),
  })
  .setRequired(true)
  .setDescription(
    'Change password with token endpoint params. Expects the token to be in the `Authorization` header.'
  );

const changePasswordWithCurrentPasswordParams =
  FieldObject.construct<ChangePasswordWithCurrentPasswordEndpointParams>()
    .setName('ChangePasswordWithCurrentPasswordEndpointParams')
    .setFields({
      currentPassword: FieldObject.requiredField(currentPassword),
      password: FieldObject.requiredField(newPassword),
    })
    .setRequired(true)
    .setDescription('Change password with current password endpoint params.');

const updateUserParams = FieldObject.construct<UpdateUserEndpointParams>()
  .setName('UpdateUserEndpointParams')
  .setFields({
    firstName: FieldObject.optionalField(fReusables.firstName),
    lastName: FieldObject.optionalField(fReusables.lastName),
    email: FieldObject.optionalField(fReusables.emailAddress),
  })
  .setRequired(true)
  .setDescription('Update user endpoint params.');

const userExistsParams = FieldObject.construct<UserExistsEndpointParams>()
  .setName('UserExistsEndpointParams')
  .setFields({
    email: FieldObject.requiredField(fReusables.emailAddress),
  })
  .setRequired(true)
  .setDescription('User exists endpoint params.');
const userExistsHttpResponseBody = FieldObject.construct<UserExistsEndpointResult>().setFields({
  exists: FieldObject.requiredField(FieldBoolean.construct()),
});

export const signupEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: SignupEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: MddocEndpointRequestHeaders_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: MddocEndpointRequestHeaders_ContentType;
}>()
  .setBasePathname(userConstants.routes.forgotPassword)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(forgotPasswordParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setName('ForgotPasswordEndpoint')
  .setDescription('Forgot password endpoint.');

export const changePasswordWithTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: ChangePasswordWithTokenEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.changePasswordWithToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ChangePasswordWithTokenEndpoint')
  .setDescription('Change password with token endpoint. Uses the `Authorization` header.');

export const changePasswordWithCurrentPasswordEndpointDefinition =
  HttpEndpointDefinition.construct<{
    requestBody: ChangePasswordWithCurrentPasswordEndpointParams;
    requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
    responseBody: LoginResult;
    responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
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
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.getUserData)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('ConfirmEmailAddressEndpoint')
  .setDescription('Confirm email address endpoint. Uses the `Authorization` header.');

export const sendEmailVerificationCodeEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired;
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
  requestHeaders: MddocEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LoginResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.updateUser)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateUserParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(loginResponseBody)
  .setName('UpdateUserEndpoint')
  .setDescription('Update user endpoint.');

export const userExistsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UserExistsEndpointParams;
  requestHeaders: MddocEndpointRequestHeaders_ContentType;
  responseBody: UserExistsEndpointResult;
  responseHeaders: MddocEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(userConstants.routes.userExists)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(userExistsParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(userExistsHttpResponseBody)
  .setName('UserExistsEndpoint')
  .setDescription('User exists endpoint.');
