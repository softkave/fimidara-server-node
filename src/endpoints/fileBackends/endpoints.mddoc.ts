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
} from './configBackend/types';
import {fileBackendConstants} from './constants';
import {CountWorkspaceAgentTokensEndpointParams} from './countConfigs/types';
import {DeleteAgentTokenEndpointParams} from './deleteToken/types';
import {
  GetAgentTokenEndpointParams,
  GetAgentTokenEndpointResult,
} from './getConfig/types';
import {
  GetWorkspaceAgentTokensEndpointParams,
  GetWorkspaceAgentTokensEndpointResult,
} from './getConfigs/types';
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
} from './updateConfig/types';

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
    expires: mddocConstruct.constructFieldObjectField(false, fReusables.expires),
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
  })
  .setDescription('Add agent token endpoint params.');
const addAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<AddAgentTokenEndpointResult>()
  .setName('AddAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)})
  .setDescription('Add agent token endpoint success result.');

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
  })
  .setDescription('Get workspace agent tokens endpoint params.');
const getWorkspaceAgentTokensSuccessResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceAgentTokensEndpointResult>()
  .setName('GetWorkspaceAgentTokensEndpointResult')
  .setFields({
    tokens: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicAgentToken>().setType(agentToken)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  })
  .setDescription('Add agent token endpoint success result.');

const countWorkspaceAgentTokensParams = mddocConstruct
  .constructFieldObject<CountWorkspaceAgentTokensEndpointParams>()
  .setName('CountWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Count workspace agent tokens endpoint params.');

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
  })
  .setDescription('Update agent token endpoint params.');
const updateAgentTokenSuccessResponseBody = mddocConstruct
  .constructFieldObject<UpdateAgentTokenEndpointResult>()
  .setName('UpdateAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)})
  .setDescription('Update agent token endpoint success result.');

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
  })
  .setDescription('Get agent token endpoint params.');
const getAgentTokenSuccessBody = mddocConstruct
  .constructFieldObject<GetAgentTokenEndpointResult>()
  .setName('GetAgentTokenEndpointResult')
  .setFields({token: mddocConstruct.constructFieldObjectField(true, agentToken)})
  .setDescription('Get agent token endpoint success result.');

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
  })
  .setDescription('Delete agent token endpoint params.');

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
  .setBasePathname(fileBackendConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseBody(addAgentTokenSuccessResponseBody)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setName('AddAgentTokenEndpoint')
  .setDescription('Add agent token endpoint.');

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
  .setBasePathname(fileBackendConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getAgentTokenSuccessBody)
  .setName('GetAgentTokenEndpoint')
  .setDescription('Get agent token endpoint.');

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
  .setBasePathname(fileBackendConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateAgentTokenSuccessResponseBody)
  .setName('UpdateAgentTokenEndpoint')
  .setDescription('Update agent token endpoint.');

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
  .setBasePathname(fileBackendConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteAgentTokenParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteAgentTokenEndpoint')
  .setDescription('Delete agent token endpoint.');

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
  .setBasePathname(fileBackendConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceAgentTokensSuccessResponseBody)
  .setName('GetWorkspaceAgentTokensEndpoint')
  .setDescription('Get workspace agent tokens endpoint.');

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
  .setBasePathname(fileBackendConstants.routes.countWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceAgentTokensParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceAgentTokensEndpoint')
  .setDescription('Count workspace agent tokens endpoint.');
