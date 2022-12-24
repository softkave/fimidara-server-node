import {IPublicProgramAccessToken} from '../../definitions/programAccessToken';
import {
  asFieldObjectAny,
  FieldArray,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  orUndefined,
  partialFieldObject,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
import {
  IAddProgramAccessTokenEndpointParams,
  IAddProgramAccessTokenEndpointResult,
  INewProgramAccessTokenInput,
} from './addToken/types';
import {IDeleteProgramAccessTokenEndpointParams} from './deleteToken/types';
import {IGetProgramAccessTokenEndpointParams, IGetProgramAccessTokenEndpointResult} from './getToken/types';
import {
  IGetWorkspaceProgramAccessTokensEndpointParams,
  IGetWorkspaceProgramAccessTokensEndpointResult,
} from './getWorkspaceTokens/types';
import {IUpdateProgramAccessTokenEndpointParams, IUpdateProgramAccessTokenEndpointResult} from './updateToken/types';

const newProgramAccessTokenInput = new FieldObject<INewProgramAccessTokenInput>()
  .setName('NewProgramAccessTokenInput')
  .setFields({
    name: fReusables.nameOrUndefined,
    description: fReusables.descriptionOrUndefined,
    permissionGroups: fReusables.assignPermissionGroupListOrUndefined,
  });

const programAccessToken = new FieldObject<IPublicProgramAccessToken>().setName('ProgramAccessToken').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.name,
  description: fReusables.descriptionOrUndefined,
  workspaceId: fReusables.workspaceId,
  permissionGroups: fReusables.assignPermissionGroupList,
  tokenStr: fReusables.tokenString,
});

const addProgramAccessTokenParams = new FieldObject<IAddProgramAccessTokenEndpointParams>()
  .setName('AddProgramAccessTokenEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
    token: newProgramAccessTokenInput,
  })
  .setRequired(true);

const addProgramAccessTokenResult = new FieldObject<IAddProgramAccessTokenEndpointResult & IBaseEndpointResult>()
  .setName('AddProgramAccessTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(programAccessToken),
  })
  .setRequired(true)
  .setDescription('Add program access token endpoint result');

const getWorkspaceProgramAccessTokensParams = new FieldObject<IGetWorkspaceProgramAccessTokensEndpointParams>()
  .setName('GetWorkspaceProgramAccessTokensEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputOrUndefined,
  })
  .setRequired(true);

const getWorkspaceProgramAccessTokensResult = new FieldObject<
  IGetWorkspaceProgramAccessTokensEndpointResult & IBaseEndpointResult
>()
  .setName('GetWorkspaceProgramAccessTokensEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    tokens: orUndefined(new FieldArray().setType(programAccessToken)),
  })
  .setRequired(true)
  .setDescription('Get workspace program access tokens endpoint result');

const updateProgramAccessTokenParams = new FieldObject<IUpdateProgramAccessTokenEndpointParams>()
  .setName('UpdateProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
    token: partialFieldObject(newProgramAccessTokenInput),
  })
  .setRequired(true);

const updateProgramAccessTokenResult = new FieldObject<IUpdateProgramAccessTokenEndpointResult & IBaseEndpointResult>()
  .setName('UpdateProgramAccessTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(programAccessToken),
  })
  .setRequired(true)
  .setDescription('Update program access token endpoint result');

const getProgramAccessTokenParams = new FieldObject<IGetProgramAccessTokenEndpointParams>()
  .setName('UpdateProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
  })
  .setRequired(true);

const getProgramAccessTokenResult = new FieldObject<IGetProgramAccessTokenEndpointResult & IBaseEndpointResult>()
  .setName('UpdateProgramAccessTokenEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    token: orUndefined(programAccessToken),
  })
  .setRequired(true)
  .setDescription('Get program access token endpoint result');

const deleteProgramAccessTokenParams = new FieldObject<IDeleteProgramAccessTokenEndpointParams>()
  .setName('DeleteProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idOrUndefined,
    onReferenced: fReusables.effectOnReferencedOrUndefined,
  })
  .setRequired(true);

export const addProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/addToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addProgramAccessTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(addProgramAccessTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/getToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getProgramAccessTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getProgramAccessTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/updateToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateProgramAccessTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateProgramAccessTokenResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const deleteProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/deleteToken')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteProgramAccessTokenParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(httpResponseItems.defaultResponse)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getWorkspaceProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/getWorkspaceTokens')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceProgramAccessTokensParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getWorkspaceProgramAccessTokensResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);
