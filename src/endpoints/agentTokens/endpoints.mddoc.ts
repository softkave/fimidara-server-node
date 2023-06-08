import {PublicAgentToken} from '../../definitions/agentToken';
import {
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
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
import {UpdateAgentTokenEndpointParams, UpdateAgentTokenEndpointResult} from './updateToken/types';

const newAgentTokenInput = FieldObject.construct<NewAgentTokenInput>()
  .setName('NewAgentTokenInput')
  .setFields({
    name: FieldObject.optionalField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
    expires: FieldObject.optionalField(fReusables.expires),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const agentToken = FieldObject.construct<PublicAgentToken>()
  .setName('AgentToken')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    name: FieldObject.optionalField(fReusables.name),
    description: FieldObject.optionalField(fReusables.description),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
    tokenStr: FieldObject.requiredField(fReusables.tokenString),
    expires: FieldObject.optionalField(fReusables.expires),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  });

const addAgentTokenParams = FieldObject.construct<AddAgentTokenEndpointParams>()
  .setName('AddAgentTokenEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceId),
    token: FieldObject.requiredField(newAgentTokenInput),
  })
  .setRequired(true)
  .setDescription('Add agent token endpoint params.');
const addAgentTokenSuccessResponseBody = FieldObject.construct<AddAgentTokenEndpointResult>()
  .setName('AddAgentTokenEndpointResult')
  .setFields({token: FieldObject.requiredField(agentToken)})
  .setRequired(true)
  .setDescription('Add agent token endpoint success result.');

const getWorkspaceAgentTokensParams = FieldObject.construct<GetWorkspaceAgentTokensEndpointParams>()
  .setName('GetWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    page: FieldObject.optionalField(fReusables.page),
    pageSize: FieldObject.optionalField(fReusables.pageSize),
  })
  .setRequired(true)
  .setDescription('Get workspace agent tokens endpoint params.');
const getWorkspaceAgentTokensSuccessResponseBody =
  FieldObject.construct<GetWorkspaceAgentTokensEndpointResult>()
    .setName('GetWorkspaceAgentTokensEndpointResult')
    .setFields({
      tokens: FieldObject.requiredField(
        FieldArray.construct<PublicAgentToken>().setType(agentToken)
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Add agent token endpoint success result.');

const countWorkspaceAgentTokensParams =
  FieldObject.construct<CountWorkspaceAgentTokensEndpointParams>()
    .setName('CountWorkspaceAgentTokensEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    })
    .setRequired(true)
    .setDescription('Count workspace agent tokens endpoint params.');

const updateAgentTokenParams = FieldObject.construct<UpdateAgentTokenEndpointParams>()
  .setName('UpdateAgentTokenEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    tokenId: FieldObject.optionalField(fReusables.id),
    onReferenced: FieldObject.optionalField(fReusables.effectOnReferenced),
    token: FieldObject.requiredField(newAgentTokenInput),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
  })
  .setRequired(true)
  .setDescription('Update agent token endpoint params.');
const updateAgentTokenSuccessResponseBody = FieldObject.construct<UpdateAgentTokenEndpointResult>()
  .setName('UpdateAgentTokenEndpointResult')
  .setFields({token: FieldObject.requiredField(agentToken)})
  .setRequired(true)
  .setDescription('Update agent token endpoint success result.');

const getAgentTokenParams = FieldObject.construct<GetAgentTokenEndpointParams>()
  .setName('GetAgentTokenEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    tokenId: FieldObject.optionalField(fReusables.id),
    onReferenced: FieldObject.optionalField(fReusables.effectOnReferenced),
  })
  .setRequired(true)
  .setDescription('Get agent token endpoint params.');
const getAgentTokenSuccessBody = FieldObject.construct<GetAgentTokenEndpointResult>()
  .setName('GetAgentTokenEndpointResult')
  .setFields({token: FieldObject.requiredField(agentToken)})
  .setRequired(true)
  .setDescription('Get agent token endpoint success result.');

const deleteAgentTokenParams = FieldObject.construct<DeleteAgentTokenEndpointParams>()
  .setName('DeleteAgentTokenEndpointParams')
  .setFields({
    tokenId: FieldObject.optionalField(fReusables.id),
    onReferenced: FieldObject.optionalField(fReusables.effectOnReferenced),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Delete agent token endpoint params.');

export const addAgentTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddAgentTokenEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: AddAgentTokenEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addAgentTokenParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseBody(addAgentTokenSuccessResponseBody)
  .setName('AddAgentTokenEndpoint')
  .setDescription('Add agent token endpoint.');

export const getAgentTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetAgentTokenEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetAgentTokenEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getAgentTokenParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getAgentTokenSuccessBody)
  .setName('GetAgentTokenEndpoint')
  .setDescription('Get agent token endpoint.');

export const updateAgentTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateAgentTokenEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateAgentTokenEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateAgentTokenParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateAgentTokenSuccessResponseBody)
  .setName('UpdateAgentTokenEndpoint')
  .setDescription('Update agent token endpoint.');

export const deleteAgentTokenEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: DeleteAgentTokenEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteAgentTokenParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteAgentTokenEndpoint')
  .setDescription('Delete agent token endpoint.');

export const getWorkspaceAgentTokensEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspaceAgentTokensEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceAgentTokensEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceAgentTokensParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceAgentTokensSuccessResponseBody)
  .setName('GetWorkspaceAgentTokensEndpoint')
  .setDescription('Get workspace agent tokens endpoint.');

export const countWorkspaceAgentTokensEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountWorkspaceAgentTokensEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(agentTokenConstants.routes.countWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceAgentTokensParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceAgentTokensEndpoint')
  .setDescription('Count workspace agent tokens endpoint.');
