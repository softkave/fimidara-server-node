import {PublicAgentToken} from '../../definitions/agentToken';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {
  AddAgentTokenEndpointParams,
  AddAgentTokenEndpointResult,
  NewAgentTokenInput,
} from './addToken/types';
import {agentTokenConstants} from './constants';
import {CountWorkspaceAgentTokensEndpointParams} from './countWorkspaceTokens/types';
import {DeleteAgentTokenEndpointParams} from './deleteToken/types';
import {GetAgentTokenEndpointParams, GetAgentTokenEndpointResult} from './getToken/types';
import {
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {
  AddAgentTokenHttpEndpoint,
  CountWorkspaceAgentTokensHttpEndpoint,
  DeleteAgentTokenHttpEndpoint,
  GetAgentTokenHttpEndpoint,
  GetWorkspaceAgentTokensHttpEndpoint,
  UpdateAgentTokenHttpEndpoint,
} from './types';
import {
  UpdateAgentTokenEndpointParams,
  UpdateAgentTokenEndpointResult,
} from './updateToken/types';

const newAgentTokenInput = mddocConstruct
  .constructFieldObject<NewAgentTokenInput>()
  .setName('NewAgentTokenInput')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    expires: mddocConstruct.constructFieldObjectField(false, fReusables.expires),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceId
    ),
  });

const agentToken = mddocConstruct
  .constructFieldObject<PublicAgentToken>()
  .setName('AgentToken')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(false, fReusables.name),
    description: mddocConstruct.constructFieldObjectField(false, fReusables.description),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    tokenStr: mddocConstruct.constructFieldObjectField(true, fReusables.tokenString),
    expiresAt: mddocConstruct.constructFieldObjectField(false, fReusables.expires),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceIdOrNull
    ),
  });

const addAgentTokenParams = mddocConstruct
  .constructFieldObject<AddAgentTokenEndpointParams>()
  .setName('AddAgentTokenEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceId),
    token: mddocConstruct.constructFieldObjectField(true, newAgentTokenInput),
  });
const addAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<AddAgentTokenEndpointResult>()
  .setName('AddAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)});

const getWorkspaceAgentTokensParams = mddocConstruct
  .constructFieldObject<GetWorkspaceAgentTokensEndpointParams>()
  .setName('GetWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
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
  });
const updateAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<UpdateAgentTokenEndpointResult>()
  .setName('UpdateAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)});
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
  });
const getAgentTokenSuccessBody = mddocConstruct
  .constructFieldObject<GetAgentTokenEndpointResult>()
  .setName('GetAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)});
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
export const addAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddAgentTokenHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<AddAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(agentTokenConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseBody(addAgentTokenSuccessResponseBody)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setName('AddAgentTokenEndpoint');

export const getAgentTokenEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetAgentTokenHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetAgentTokenHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetAgentTokenHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(agentTokenConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<UpdateAgentTokenHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setBasePathname(agentTokenConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
    InferFieldObjectType<DeleteAgentTokenHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setBasePathname(agentTokenConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
  .setBasePathname(agentTokenConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
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
  .setBasePathname(agentTokenConstants.routes.countWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceAgentTokensEndpoint');
