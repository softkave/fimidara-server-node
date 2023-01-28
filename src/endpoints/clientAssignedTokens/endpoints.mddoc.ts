import {IPublicClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ExcludeTags} from '../../definitions/tag';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  orUndefinedOrNull,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints.mddoc';
import {
  IAddClientAssignedTokenEndpointParams,
  IAddClientAssignedTokenEndpointResult,
  INewClientAssignedTokenInput,
} from './addToken/types';
import {clientAssignedTokenConstants} from './constants';
import {IDeleteClientAssignedTokenEndpointParams} from './deleteToken/types';
import {IGetClientAssignedTokenEndpointParams, IGetClientAssignedTokenEndpointResult} from './getToken/types';
import {
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {IUpdateClientAssignedTokenEndpointParams, IUpdateClientAssignedTokenEndpointResult} from './updateToken/types';

const newClientAssignedTokenInput = new FieldObject<ExcludeTags<INewClientAssignedTokenInput>>()
  .setName('NewClientAssignedTokenInput')
  .setFields({
    providedResourceId: fReusables.providedResourceIdNotRequired,
    name: fReusables.nameNotRequired,
    description: fReusables.descriptionNotRequired,
    expires: fReusables.expiresNotRequired,
    permissionGroups: fReusables.assignPermissionGroupListNotRequired,
  });

const clientAssignedToken = new FieldObject<IPublicClientAssignedToken>().setName('ClientAssignedToken').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.name,
  description: fReusables.descriptionOrUndefined,
  expires: fReusables.expiresOrUndefined,
  providedResourceId: orUndefinedOrNull(fReusables.providedResourceId),
  workspaceId: fReusables.workspaceId,
  permissionGroups: fReusables.assignPermissionGroupList,
  tokenStr: fReusables.tokenString,
});

const addClientAssignedTokenParams = new FieldObject<IAddClientAssignedTokenEndpointParams>()
  .setName('AddClientAssignedTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    token: newClientAssignedTokenInput,
  })
  .setRequired(true)
  .setDescription('Add client assigned token endpoint params.');
const addClientAssignedTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddClientAssignedTokenEndpointResult>()
        .setName('AddClientAssignedTokenEndpointSuccessResult')
        .setFields({token: clientAssignedToken})
        .setRequired(true)
        .setDescription('Add client assigned token endpoint success result.')
    ),
];

const getWorkspaceClientAssignedTokensParams = new FieldObject<IGetWorkspaceClientAssignedTokensEndpointParams>()
  .setName('GetWorkspaceClientAssignedTokensEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Get workspace client assigned tokens endpoint params.');

const getWorkspaceClientAssignedTokensResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceClientAssignedTokensEndpointResult>()
        .setName('GetWorkspaceClientAssignedTokensEndpointSuccessResult')
        .setFields({tokens: new FieldArray().setType(clientAssignedToken)})
        .setRequired(true)
        .setDescription('Get workspace client assigned tokens endpoint success result.')
    ),
];

const updateClientAssignedTokenParams = new FieldObject<IUpdateClientAssignedTokenEndpointParams>()
  .setName('UpdateClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
    token: partialFieldObject(newClientAssignedTokenInput),
  })
  .setRequired(true)
  .setDescription('Update client assigned token endpoint params.');
const updateClientAssignedTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateClientAssignedTokenEndpointResult>()
        .setName('UpdateClientAssignedTokenEndpointSuccessResult')
        .setFields({token: clientAssignedToken})
        .setRequired(true)
        .setDescription('Update client assigned token endpoint Successresult')
    ),
];

const getClientAssignedTokenParams = new FieldObject<IGetClientAssignedTokenEndpointParams>()
  .setName('GetClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Get client assigned token endpoint params.');
const getClientAssignedTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetClientAssignedTokenEndpointResult>()
        .setName('GetClientAssignedTokenEndpointSuccessResult')
        .setFields({token: clientAssignedToken})
        .setRequired(true)
        .setDescription('Get client assigned token endpoint success result.')
    ),
];

const deleteClientAssignedTokenParams = new FieldObject<IDeleteClientAssignedTokenEndpointParams>()
  .setName('DeleteClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    providedResourceId: fReusables.providedResourceIdNotRequired,
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Delete client assigned token endpoint params.');

export const addClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(clientAssignedTokenConstants.routes.addToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addClientAssignedTokenResult)
  .setName('Add Client Assigned Token Endpoint')
  .setDescription('Add client assigned token endpoint.');

export const getClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(clientAssignedTokenConstants.routes.getToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getClientAssignedTokenResult)
  .setName('Get Client Assigned Token Endpoint')
  .setDescription('Get client assigned token endpoint.');

export const updateClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(clientAssignedTokenConstants.routes.updateToken)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateClientAssignedTokenResult)
  .setName('Update Client Assigned Token Endpoint')
  .setDescription('Update client assigned token endpoint.');

export const deleteClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(clientAssignedTokenConstants.routes.deleteToken)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Client Assigned Token Endpoint')
  .setDescription('Delete client assigned token endpoint.');

export const getWorkspaceClientAssignedTokensEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(clientAssignedTokenConstants.routes.getWorkspaceTokens)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceClientAssignedTokensParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceClientAssignedTokensResult)
  .setName('Get Workspace Client Assigned Tokens Endpoint')
  .setDescription('Get workspace client assigned tokens endpoint.');
