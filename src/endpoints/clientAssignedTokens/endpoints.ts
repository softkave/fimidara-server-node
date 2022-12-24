import {IPublicClientAssignedToken} from '../../definitions/clientAssignedToken';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  orUndefined,
  orUndefinedOrNull,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
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
  .setRequired(true);

const addClientAssignedTokenResult = new FieldObject<IAddClientAssignedTokenEndpointResult & IBaseEndpointResult>()
  .setName('AddClientAssignedTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(clientAssignedToken),
  })
  .setRequired(true)
  .setDescription('Add client assigned token endpoint result');

const getWorkspaceClientAssignedTokensParams = new FieldObject<IGetWorkspaceClientAssignedTokensEndpointParams>()
  .setName('GetWorkspaceClientAssignedTokensEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

const getWorkspaceClientAssignedTokensResult = new FieldObject<
  IGetWorkspaceClientAssignedTokensEndpointResult & IBaseEndpointResult
>()
  .setName('GetWorkspaceClientAssignedTokensEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    tokens: orUndefined(new FieldArray().setType(clientAssignedToken)),
  })
  .setRequired(true)
  .setDescription('Get workspace client assigned tokens endpoint result');

const updateClientAssignedTokenParams = new FieldObject<IUpdateClientAssignedTokenEndpointParams>()
  .setName('UpdateClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    token: partialFieldObject(newClientAssignedTokenInput),
  })
  .setRequired(true);

const updateClientAssignedTokenResult = new FieldObject<
  IUpdateClientAssignedTokenEndpointResult & IBaseEndpointResult
>()
  .setName('UpdateClientAssignedTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(clientAssignedToken),
  })
  .setRequired(true)
  .setDescription('Update client assigned token endpoint result');

const getClientAssignedTokenParams = new FieldObject<IGetClientAssignedTokenEndpointParams>()
  .setName('UpdateClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

const getClientAssignedTokenResult = new FieldObject<IGetClientAssignedTokenEndpointResult & IBaseEndpointResult>()
  .setName('UpdateClientAssignedTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(clientAssignedToken),
  })
  .setRequired(true)
  .setDescription('Get client assigned token endpoint result');

const deleteClientAssignedTokenParams = new FieldObject<IDeleteClientAssignedTokenEndpointParams>()
  .setName('DeleteClientAssignedTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    providedResourceId: fReusables.providedResourceIdOrUndefined,
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

export const addClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/addToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addClientAssignedTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(addClientAssignedTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/getToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getClientAssignedTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getClientAssignedTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/updateToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateClientAssignedTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateClientAssignedTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const deleteClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/deleteToken')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteClientAssignedTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(httpResponseItems.defaultResponse)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getWorkspaceClientAssignedTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/clientAssignedTokens/getWorkspaceTokens')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceClientAssignedTokensParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getWorkspaceClientAssignedTokensResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);
