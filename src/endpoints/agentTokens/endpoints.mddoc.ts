import {IPublicAgentToken} from '../../definitions/agentToken';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {
  endpointHttpHeaderItems,
  endpointHttpResponseItems,
  endpointStatusCodes,
  fReusables,
} from '../endpoints.mddoc';
import {
  IAddAgentTokenEndpointParams,
  IAddAgentTokenEndpointResult,
  INewAgentTokenInput,
} from './addToken/types';
import {agentTokenConstants} from './constants';
import {IDeleteAgentTokenEndpointParams} from './deleteToken/types';
import {IGetAgentTokenEndpointParams, IGetAgentTokenEndpointResult} from './getToken/types';
import {
  IGetWorkspaceAgentTokensEndpointParams,
  IGetWorkspaceAgentTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {
  IUpdateAgentTokenEndpointParams,
  IUpdateAgentTokenEndpointResult,
} from './updateToken/types';

const newAgentTokenInput = new FieldObject<ExcludeTags<INewAgentTokenInput>>()
  .setName('NewAgentTokenInput')
  .setFields({
    name: fReusables.nameNotRequired,
    description: fReusables.descriptionNotRequired,
    expires: fReusables.expiresNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
  });

const agentToken = new FieldObject<IPublicAgentToken>().setName('AgentToken').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.name,
  description: fReusables.descriptionOrUndefined,
  workspaceId: fReusables.workspaceId,
  tokenStr: fReusables.tokenString,
  expires: fReusables.expiresOrUndefined,
  providedResourceId: fReusables.providedResourceIdOrUndefined,
});

const addAgentTokenParams = new FieldObject<IAddAgentTokenEndpointParams>()
  .setName('AddAgentTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    token: newAgentTokenInput,
  })
  .setRequired(true)
  .setDescription('Add agent token endpoint params.');
const addAgentTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddAgentTokenEndpointResult>()
        .setName('AddAgentTokenEndpointSuccessResult')
        .setFields({token: agentToken})
        .setRequired(true)
        .setDescription('Add agent token endpoint success result.')
    ),
];

const getWorkspaceAgentTokensParams = new FieldObject<IGetWorkspaceAgentTokensEndpointParams>()
  .setName('GetWorkspaceAgentTokensEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    page: fReusables.pageNotRequired,
    pageSize: fReusables.pageSizeNotRequired,
  })
  .setRequired(true)
  .setDescription('Get workspace agent tokens endpoint params.');
const getWorkspaceAgentTokensResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceAgentTokensEndpointResult>()
        .setName('GetWorkspaceAgentTokensEndpointSuccessResult')
        .setFields({tokens: new FieldArray().setType(agentToken), page: fReusables.page})
        .setRequired(true)
        .setDescription('Get workspace agent tokens endpoint success result.')
    ),
];

const updateAgentTokenParams = new FieldObject<IUpdateAgentTokenEndpointParams>()
  .setName('UpdateAgentTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    token: partialFieldObject(newAgentTokenInput),
    providedResourceId: fReusables.providedResourceIdNotRequired,
  })
  .setRequired(true)
  .setDescription('Update agent token endpoint params.');
const updateAgentTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateAgentTokenEndpointResult>()
        .setName('UpdateAgentTokenEndpointSuccessResult')
        .setFields({token: agentToken})
        .setRequired(true)
        .setDescription('Update agent token endpoint success result.')
    ),
];

const getAgentTokenParams = new FieldObject<IGetAgentTokenEndpointParams>()
  .setName('UpdateAgentTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
  })
  .setRequired(true)
  .setDescription('Get agent token endpoint params.');
const getAgentTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetAgentTokenEndpointResult>()
        .setName('UpdateAgentTokenEndpointSuccessResult')
        .setFields({token: agentToken})
        .setRequired(true)
        .setDescription('Get agent token endpoint success result.')
    ),
];

const deleteAgentTokenParams = new FieldObject<IDeleteAgentTokenEndpointParams>()
  .setName('DeleteAgentTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Delete agent token endpoint params.');

export const addAgentTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(agentTokenConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addAgentTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addAgentTokenResult)
  .setName('AddAgentTokenEndpoint')
  .setDescription('Add agent token endpoint.');

export const getAgentTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(agentTokenConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getAgentTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getAgentTokenResult)
  .setName('GetAgentTokenEndpoint')
  .setDescription('Get agent token endpoint.');

export const updateAgentTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(agentTokenConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateAgentTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateAgentTokenResult)
  .setName('UpdateAgentTokenEndpoint')
  .setDescription('Update agent token endpoint.');

export const deleteAgentTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(agentTokenConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteAgentTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('DeleteAgentTokenEndpoint')
  .setDescription('Delete agent token endpoint.');

export const getWorkspaceAgentTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(agentTokenConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceAgentTokensParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceAgentTokensResult)
  .setName('GetWorkspaceAgentTokensEndpoint')
  .setDescription('Get workspace agent tokens endpoint.');
