import {PublicAgentToken} from '../../definitions/agentToken.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult,
  NewAgentTokenInput,
} from './addToken/types.js';
import {kAgentTokenConstants} from './constants.js';
import {CountWorkspaceAgentTokensEndpointParams} from './countWorkspaceTokens/types.js';
import {DeleteAgentTokenEndpointParams} from './deleteToken/types.js';
import {
  EncodeAgentTokenEndpointParams,
  EncodeAgentTokenEndpointResult,
} from './encodeToken/types.js';
import {
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
} from './getToken/types.js';
import {
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
} from './getWorkspaceTokens/types.js';
import {
  RefreshAgentTokenEndpointParams,
  RefreshAgentTokenEndpointResult,
} from './refreshToken/types.js';
import {
  AddAgentTokenHttpEndpoint,
  CountWorkspaceAgentTokensHttpEndpoint,
  DeleteAgentTokenHttpEndpoint,
  EncodeAgentTokenHttpEndpoint,
  GetAgentTokenHttpEndpoint,
  GetWorkspaceAgentTokensHttpEndpoint,
  RefreshAgentTokenHttpEndpoint,
  UpdateAgentTokenHttpEndpoint,
} from './types.js';
import {
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
} from './updateToken/types.js';

const shouldRefresh = mddocConstruct
  .constructFieldBoolean()
  .setDescription('Whether the token should be refreshed.');
const shouldEncode = mddocConstruct
  .constructFieldBoolean()
  .setDescription(
    'Whether the token returned should include the token encoded in JWT format.'
  );
const refreshDurationMs = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    'The duration in milliseconds for which a generated JWT token, not the actual agent token, is valid.'
  );

const newAgentTokenInput = mddocConstruct
  .constructFieldObject<NewAgentTokenInput>()
  .setName('NewAgentTokenInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    expiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    shouldRefresh: mddocConstruct.constructFieldObjectField(
      false,
      shouldRefresh
    ),
    refreshDuration: mddocConstruct.constructFieldObjectField(
      false,
      refreshDurationMs
    ),
  });

const agentToken = mddocConstruct
  .constructFieldObject<PublicAgentToken>()
  .setName('AgentToken')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    jwtToken: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.tokenString
    ),
    refreshToken: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.refreshTokenString
    ),
    expiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceIdOrNull
    ),
    jwtTokenExpiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.jwtTokenExpiresAt
    ),
    shouldRefresh: mddocConstruct.constructFieldObjectField(
      false,
      shouldRefresh
    ),
    refreshDuration: mddocConstruct.constructFieldObjectField(
      false,
      refreshDurationMs
    ),
  });

const addAgentTokenParams = mddocConstruct
  .constructFieldObject<AddAgentTokenEndpointParams>()
  .setName('AddAgentTokenEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.description
    ),
    expiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    shouldEncode: mddocConstruct.constructFieldObjectField(false, shouldEncode),
    shouldRefresh: mddocConstruct.constructFieldObjectField(
      false,
      shouldRefresh
    ),
    refreshDuration: mddocConstruct.constructFieldObjectField(
      false,
      refreshDurationMs
    ),
  });

const addAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<AddAgentTokenEndpointResult>()
  .setName('AddAgentTokenEndpointResult')
  .setFields({
    token: mddocConstruct.constructFieldObjectField(true, agentToken),
  });

const getWorkspaceAgentTokensParams = mddocConstruct
  .constructFieldObject<GetWorkspaceAgentTokensEndpointParams>()
  .setName('GetWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
    shouldEncode: mddocConstruct.constructFieldObjectField(false, shouldEncode),
  });
const getWorkspaceAgentTokensSuccessResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceAgentTokensEndpointResult>()
  .setName('GetWorkspaceAgentTokensEndpointResult')
  .setFields({
    tokens: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicAgentToken>().setType(agentToken)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });

const countWorkspaceAgentTokensParams = mddocConstruct
  .constructFieldObject<CountWorkspaceAgentTokensEndpointParams>()
  .setName('CountWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });

const updateAgentTokenParams = mddocConstruct
  .constructFieldObject<UpdateAgentTokenEndpointParams>()
  .setName('UpdateAgentTokenEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    tokenId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    onReferenced: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.effectOnReferenced
    ),
    token: mddocConstruct.constructFieldObjectField(true, newAgentTokenInput),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    shouldEncode: mddocConstruct.constructFieldObjectField(false, shouldEncode),
  });

const updateAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<UpdateAgentTokenEndpointResult>()
  .setName('UpdateAgentTokenEndpointResult')
  .setFields({
    token: mddocConstruct.constructFieldObjectField(true, agentToken),
  });

const getAgentTokenParams = mddocConstruct
  .constructFieldObject<GetAgentTokenEndpointParams>()
  .setName('GetAgentTokenEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    tokenId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    onReferenced: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.effectOnReferenced
    ),
    shouldEncode: mddocConstruct.constructFieldObjectField(false, shouldEncode),
  });
const getAgentTokenSuccessBody = mddocConstruct
  .constructFieldObject<GetAgentTokenEndpointResult>()
  .setName('GetAgentTokenEndpointResult')
  .setFields({
    token: mddocConstruct.constructFieldObjectField(true, agentToken),
  });
const deleteAgentTokenParams = mddocConstruct
  .constructFieldObject<DeleteAgentTokenEndpointParams>()
  .setName('DeleteAgentTokenEndpointParams')
  .setFields({
    tokenId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    onReferenced: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.effectOnReferenced
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });

const refreshAgentTokenParams = mddocConstruct
  .constructFieldObject<RefreshAgentTokenEndpointParams>()
  .setName('RefreshAgentTokenEndpointParams')
  .setFields({
    refreshToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.refreshTokenString
    ),
  });

const refreshAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<RefreshAgentTokenEndpointResult>()
  .setName('RefreshAgentTokenEndpointResult')
  .setFields({
    jwtToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
    refreshToken: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.refreshTokenString
    ),
    jwtTokenExpiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.jwtTokenExpiresAt
    ),
  });

const encodeAgentTokenParams = mddocConstruct
  .constructFieldObject<EncodeAgentTokenEndpointParams>()
  .setName('EncodeAgentTokenEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
    tokenId: mddocConstruct.constructFieldObjectField(false, fReusables.id),
    onReferenced: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.effectOnReferenced
    ),
  });

const encodeAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<EncodeAgentTokenEndpointResult>()
  .setName('EncodeAgentTokenEndpointResult')
  .setFields({
    jwtToken: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.tokenString
    ),
    refreshToken: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.refreshTokenString
    ),
    jwtTokenExpiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.jwtTokenExpiresAt
    ),
  });

export const addAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseBody(addAgentTokenSuccessResponseBody)
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setName('AddAgentTokenEndpoint');

export const getAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getAgentTokenSuccessBody)
  .setName('GetAgentTokenEndpoint');

export const updateAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateAgentTokenSuccessResponseBody)
  .setName('UpdateAgentTokenEndpoint');

export const deleteAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteAgentTokenEndpoint');

export const getWorkspaceAgentTokensEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getWorkspaceAgentTokensSuccessResponseBody)
  .setName('GetWorkspaceAgentTokensEndpoint');

export const countWorkspaceAgentTokensEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceAgentTokensHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.countWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceAgentTokensEndpoint');

export const refreshAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      RefreshAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.refreshToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(refreshAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(refreshAgentTokenSuccessResponseBody)
  .setName('RefreshAgentTokenEndpoint');

export const encodeAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      EncodeAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kAgentTokenConstants.routes.encodeToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(encodeAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(encodeAgentTokenSuccessResponseBody)
  .setName('EncodeAgentTokenEndpoint');
