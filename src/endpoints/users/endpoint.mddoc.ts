import {EmptyObject} from 'type-fest';
import {PublicWorkspaceResource} from '../../definitions/system.js';
import {PublicUser} from '../../definitions/user.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  InferSdkParamsType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {kEndpointConstants} from '../constants.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import {
  HttpEndpointRequestHeaders_ContentType,
  HttpEndpointRequestHeaders_InterServerAuth,
} from '../types.js';
import {ChangePasswordWithCurrentPasswordEndpointParams} from './changePasswordWithCurrentPassword/types.js';
import {ChangePasswordWithTokenEndpointParams} from './changePasswordWithToken/types.js';
import {kUserConstants} from './constants.js';
import {ForgotPasswordEndpointParams} from './forgotPassword/types.js';
import {LoginEndpointParams, LoginResult} from './login/types.js';
import {LoginWithOAuthEndpointParams} from './loginWithOauth/types.js';
import {RefreshUserTokenEndpointParams} from './refreshToken/types.js';
import {SignupEndpointParams} from './signup/types.js';
import {SignupWithOAuthEndpointParams} from './signupWithOAuth/types.js';
import {
  ChangePasswordWithCurrentPasswordHttpEndpoint,
  ChangePasswordWithTokenHttpEndpoint,
  ConfirmEmailAddressHttpEndpoint,
  ForgotPasswordHttpEndpoint,
  GetUserDataHttpEndpoint,
  LoginHttpEndpoint,
  LoginWithOAuthHttpEndpoint,
  RefreshUserTokenHttpEndpoint,
  SendEmailVerificationCodeHttpEndpoint,
  SignupHttpEndpoint,
  SignupWithOAuthHttpEndpoint,
  UpdateUserHttpEndpoint,
  UserExistsHttpEndpoint,
} from './types.js';
import {
  UpdateUserEndpointParams,
  UpdateUserEndpointResult,
} from './updateUser/types.js';
import {
  UserExistsEndpointParams,
  UserExistsEndpointResult,
} from './userExists/types.js';

const currentPassword = fReusables.password
  .clone()
  .setDescription('Current password');
const newPassword = fReusables.password.clone().setDescription('New password');

const user = mddocConstruct
  .constructFieldObject<PublicUser>()
  .setName('User')
  .setFields({
    ...fReusables.resourceParts,
    firstName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.firstName
    ),
    lastName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.lastName
    ),
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
    passwordLastChangedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.date
    ),
    requiresPasswordChange: mddocConstruct.constructFieldObjectField(
      false,
      mddocConstruct.constructFieldBoolean()
    ),
    isEmailVerified: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.dateOrNull
    ),
    emailVerificationEmailSentAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.dateOrNull
    ),
    workspaces: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicWorkspaceResource>()
        .setType(
          mddocConstruct
            .constructFieldObject<PublicWorkspaceResource>()
            .setFields(fReusables.workspaceResourceParts)
            .setName('PublicWorkspaceResource')
        )
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
    jwtToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
    clientJwtToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
    refreshToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.refreshTokenString
    ),
    jwtTokenExpiresAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.jwtTokenExpiresAt
    ),
  });
const signupParams = mddocConstruct
  .constructFieldObject<SignupEndpointParams>()
  .setName('SignupEndpointParams')
  .setFields({
    firstName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.firstName
    ),
    lastName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.lastName
    ),
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
    password: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.password
    ),
  });
const signupWithOAuthParams = mddocConstruct
  .constructFieldObject<SignupWithOAuthEndpointParams>()
  .setName('SignupWithOAuthEndpointParams')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.date
    ),
    oauthUserId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.providedResourceId
    ),
  });
const loginParams = mddocConstruct
  .constructFieldObject<LoginEndpointParams>()
  .setName('LoginParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
    password: mddocConstruct.constructFieldObjectField(true, currentPassword),
  });
const loginWithOAuthParams = mddocConstruct
  .constructFieldObject<LoginWithOAuthEndpointParams>()
  .setName('LoginWithOAuthEndpointParams')
  .setFields({
    oauthUserId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.providedResourceId
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.date
    ),
  });
const forgotPasswordParams = mddocConstruct
  .constructFieldObject<ForgotPasswordEndpointParams>()
  .setName('ForgotPasswordEndpointParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
  });
const changePasswordWithCurrentPasswordParams = mddocConstruct
  .constructFieldObject<ChangePasswordWithCurrentPasswordEndpointParams>()
  .setName('ChangePasswordWithCurrentPasswordEndpointParams')
  .setFields({
    currentPassword: mddocConstruct.constructFieldObjectField(
      true,
      currentPassword
    ),
    password: mddocConstruct.constructFieldObjectField(true, newPassword),
  });
const changePasswordWithTokenParams = mddocConstruct
  .constructFieldObject<ChangePasswordWithTokenEndpointParams>()
  .setName('ChangePasswordWithTokenEndpointParams')
  .setFields({
    password: mddocConstruct.constructFieldObjectField(true, newPassword),
  });
const updateUserParams = mddocConstruct
  .constructFieldObject<UpdateUserEndpointParams>()
  .setName('UpdateUserEndpointParams')
  .setFields({
    firstName: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.firstName
    ),
    lastName: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.lastName
    ),
    email: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.emailAddress
    ),
  });
const updateUserResponseBody = mddocConstruct
  .constructFieldObject<UpdateUserEndpointResult>()
  .setName('UpdateUserEndpointResult')
  .setFields({
    user: mddocConstruct.constructFieldObjectField(true, user),
  });
const userExistsParams = mddocConstruct
  .constructFieldObject<UserExistsEndpointParams>()
  .setName('UserExistsEndpointParams')
  .setFields({
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
  });
const refreshUserTokenParams = mddocConstruct
  .constructFieldObject<RefreshUserTokenEndpointParams>()
  .setName('RefreshUserTokenEndpointParams')
  .setFields({
    refreshToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.refreshTokenString
    ),
  });
const userExistsHttpResponseBody = mddocConstruct
  .constructFieldObject<UserExistsEndpointResult>()
  .setFields({
    exists: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldBoolean()
    ),
  })
  .setName('UserExistsEndpointResult');

const signupWithOAuthSdkParamsDef = mddocConstruct
  .constructFieldObject<
    SignupWithOAuthEndpointParams & {
      interServerAuthSecret: string;
    }
  >()
  .setName('SignupWithOAuthEndpointParams')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(true, fReusables.name),
    email: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.emailAddress
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.date
    ),
    oauthUserId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.providedResourceId
    ),
    interServerAuthSecret: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
  });

const signupWithOAuthSdkParams = mddocConstruct
  .constructSdkParamsBody<
    /** TSdkParams */ SignupWithOAuthEndpointParams & {
      interServerAuthSecret: string;
    },
    /** TRequestHeaders */ HttpEndpointRequestHeaders_ContentType &
      HttpEndpointRequestHeaders_InterServerAuth,
    /** TPathParameters */ EmptyObject,
    /** TQuery */ EmptyObject,
    /** TRequestBody */ SignupWithOAuthEndpointParams
  >(key => {
    switch (key) {
      case 'email':
        return ['body', 'email'];
      case 'name':
        return ['body', 'name'];
      case 'oauthUserId':
        return ['body', 'oauthUserId'];
      case 'emailVerifiedAt':
        return ['body', 'emailVerifiedAt'];
      case 'interServerAuthSecret':
        return ['header', 'x-fimidara-inter-server-auth-secret'];
      default:
        return undefined;
    }
  })
  .setDef(signupWithOAuthSdkParamsDef)
  .setSerializeAs('json');

const signupWithOAuthHttpHeaders = mddocConstruct
  .constructFieldObject<
    HttpEndpointRequestHeaders_ContentType &
      HttpEndpointRequestHeaders_InterServerAuth
  >()
  .setFields({
    [kEndpointConstants.headers.contentType]:
      mddocConstruct.constructFieldObjectField(
        true,
        mddocEndpointHttpHeaderItems.requestHeaderItem_JsonContentType
      ),
    [kEndpointConstants.headers.interServerAuthSecret]:
      mddocConstruct.constructFieldObjectField(
        true,
        mddocEndpointHttpHeaderItems.requestHeaderItem_InterServerAuthSecret
      ),
  });

const loginWithOAuthSdkParamsDef = mddocConstruct
  .constructFieldObject<
    LoginWithOAuthEndpointParams & {
      interServerAuthSecret: string;
    }
  >()
  .setName('LoginWithOAuthEndpointParams')
  .setFields({
    oauthUserId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.providedResourceId
    ),
    interServerAuthSecret: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
    emailVerifiedAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.date
    ),
  });

const loginWithOAuthSdkParams = mddocConstruct
  .constructSdkParamsBody<
    /** TSdkParams */ LoginWithOAuthEndpointParams & {
      interServerAuthSecret: string;
    },
    /** TRequestHeaders */ HttpEndpointRequestHeaders_ContentType &
      HttpEndpointRequestHeaders_InterServerAuth,
    /** TPathParameters */ EmptyObject,
    /** TQuery */ EmptyObject,
    /** TRequestBody */ LoginWithOAuthEndpointParams
  >(key => {
    switch (key) {
      case 'oauthUserId':
        return ['body', 'oauthUserId'];
      case 'interServerAuthSecret':
        return ['header', 'x-fimidara-inter-server-auth-secret'];
      default:
        return undefined;
    }
  })
  .setDef(loginWithOAuthSdkParamsDef)
  .setSerializeAs('json');

const loginWithOAuthHttpHeaders = mddocConstruct
  .constructFieldObject<
    HttpEndpointRequestHeaders_ContentType &
      HttpEndpointRequestHeaders_InterServerAuth
  >()
  .setFields({
    [kEndpointConstants.headers.contentType]:
      mddocConstruct.constructFieldObjectField(
        true,
        mddocEndpointHttpHeaderItems.requestHeaderItem_JsonContentType
      ),
    [kEndpointConstants.headers.interServerAuthSecret]:
      mddocConstruct.constructFieldObjectField(
        true,
        mddocEndpointHttpHeaderItems.requestHeaderItem_InterServerAuthSecret
      ),
  });

export const signupEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      SignupHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      SignupHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<SignupHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      SignupHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      SignupHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      SignupHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.signup)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(signupParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('SignupEndpoint');

export const signupWithOAuthEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['responseBody']
    >,
    InferSdkParamsType<
      SignupWithOAuthHttpEndpoint['mddocHttpDefinition']['sdkParamsBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.signupWithOAuth)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(signupWithOAuthParams)
  .setSdkParamsBody(signupWithOAuthSdkParams)
  .setRequestHeaders(signupWithOAuthHttpHeaders)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('SignupWithOAuthEndpoint');

export const loginEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      LoginHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      LoginHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<LoginHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      LoginHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      LoginHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      LoginHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.login)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(loginParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('LoginEndpoint');

export const loginWithOAuthEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['responseBody']
    >,
    InferSdkParamsType<
      LoginWithOAuthHttpEndpoint['mddocHttpDefinition']['sdkParamsBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.loginWithOAuth)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(loginWithOAuthParams)
  .setSdkParamsBody(loginWithOAuthSdkParams)
  .setRequestHeaders(loginWithOAuthHttpHeaders)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('LoginWithOAuthEndpoint');

export const forgotPasswordEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ForgotPasswordHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.forgotPassword)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(forgotPasswordParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType
  )
  .setName('ForgotPasswordEndpoint');

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
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ChangePasswordWithTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.changePasswordWithToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setRequestBody(changePasswordWithTokenParams)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('ChangePasswordWithTokenEndpoint')
  .setDescription(
    'Change password with token endpoint. Uses the `Authorization` header'
  );

export const changePasswordWithCurrentPasswordEndpointDefinition =
  mddocConstruct
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
    .setBasePathname(kUserConstants.routes.changePasswordWithCurrentPassword)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(changePasswordWithCurrentPasswordParams)
    .setRequestHeaders(
      mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
    )
    .setResponseHeaders(
      mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
    )
    .setResponseBody(loginResponseBody)
    .setName('ChangePasswordWithCurrentPasswordEndpoint');

export const confirmEmailAddressEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      ConfirmEmailAddressHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.confirmEmailAddress)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('ConfirmEmailAddressEndpoint')
  .setDescription(
    'Confirm email address endpoint. Uses the `Authorization` header, and expects a token issued from `forgotPassword`'
  );

export const getUserDataEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetUserDataHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.getUserData)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('GetUserDataEndpoint')
  .setDescription('Get user data endpoint. Uses the `Authorization` header');

export const sendEmailVerificationCodeEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      SendEmailVerificationCodeHttpEndpoint['mddocHttpDefinition']['query']
    >,
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
  .setBasePathname(kUserConstants.routes.sendEmailVerificationCode)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setName('SendEmailVerificationCodeEndpoint')
  .setDescription(
    'Send email verification code endpoint. Uses the `Authorization` header, and sends a verification token to the email address of the user referenced in the token'
  );

export const updateUserEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateUserHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.updateUser)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateUserParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateUserResponseBody)
  .setName('UpdateUserEndpoint');

export const userExistsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UserExistsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.userExists)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(userExistsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(userExistsHttpResponseBody)
  .setName('UserExistsEndpoint');

export const refreshUserTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      RefreshUserTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kUserConstants.routes.refreshToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setRequestBody(refreshUserTokenParams)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(loginResponseBody)
  .setName('RefreshUserTokenEndpoint');

export const userEndpointsMddocParts = {user};
