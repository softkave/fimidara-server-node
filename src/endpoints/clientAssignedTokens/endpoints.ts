import {IPublicClientAssignedToken} from '../../definitions/clientAssignedToken';
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
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
import {
  IAddClientAssignedTokenEndpointParams,
  IAddClientAssignedTokenEndpointResult,
  INewClientAssignedTokenInput,
} from './addToken/types';
import {IDeleteClientAssignedTokenEndpointParams} from './deleteToken/types';
import {IGetClientAssignedTokenEndpointParams, IGetClientAssignedTokenEndpointResult} from './getToken/types';
import {
  IGetWorkspaceClientAssignedTokensEndpointParams,
  IGetWorkspaceClientAssignedTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {IUpdateClientAssignedTokenEndpointParams, IUpdateClientAssignedTokenEndpointResult} from './updateToken/types';

const newClientAssignedTokenInput = new FieldObject<INewClientAssignedTokenInput>()
  .setName('NewClientAssignedTokenInput')
  .setFields({
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    name: fReusables.nameOrUndefined,
    description: fReusables.descriptionOrUndefined,
    expires: fReusables.expiresOrUndefined,
    permissionGroups: fReusables.assignPermissionGroupListOrUndefined,
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
  providedResourceId: orUndefinedOrNull(fReusables.id),
  workspaceId: fReusables.workspaceId,
  permissionGroups: fReusables.assignPermissionGroupList,
  tokenStr: fReusables.tokenString,
});

const addClientAssignedTokenParams = new FieldObject<IAddClientAssignedTokenEndpointParams>()
  .setName('AddClientAssignedTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
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
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true)
  .setDescription('Delete client assigned token endpoint params.');

export const addClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/addToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addClientAssignedTokenResult);

export const getClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/getToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getClientAssignedTokenResult);

export const updateClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/updateToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateClientAssignedTokenResult);

export const deleteClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/deleteToken')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteClientAssignedTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse);

export const getWorkspaceClientAssignedTokensEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/getWorkspaceTokens')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceClientAssignedTokensParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceClientAssignedTokensResult);
