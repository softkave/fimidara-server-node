import {IPublicProgramAccessToken} from '../../definitions/programAccessToken';
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
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints';
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

const newProgramAccessTokenInput = new FieldObject<ExcludeTags<INewProgramAccessTokenInput>>()
  .setName('NewProgramAccessTokenInput')
  .setFields({
    name: fReusables.nameNotRequired,
    description: fReusables.descriptionNotRequired,
    permissionGroups: fReusables.assignPermissionGroupListNotRequired,
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
    workspaceId: fReusables.workspaceIdInputNotRequired,
    token: newProgramAccessTokenInput,
  })
  .setRequired(true)
  .setDescription('Add program access token endpoint params.');
const addProgramAccessTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddProgramAccessTokenEndpointResult>()
        .setName('AddProgramAccessTokenEndpointSuccessResult')
        .setFields({token: programAccessToken})
        .setRequired(true)
        .setDescription('Add program access token endpoint success result.')
    ),
];

const getWorkspaceProgramAccessTokensParams = new FieldObject<IGetWorkspaceProgramAccessTokensEndpointParams>()
  .setName('GetWorkspaceProgramAccessTokensEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Get workspace program access tokens endpoint params.');
const getWorkspaceProgramAccessTokensResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceProgramAccessTokensEndpointResult>()
        .setName('GetWorkspaceProgramAccessTokensEndpointSuccessResult')
        .setFields({tokens: new FieldArray().setType(programAccessToken)})
        .setRequired(true)
        .setDescription('Get workspace program access tokens endpoint success result.')
    ),
];

const updateProgramAccessTokenParams = new FieldObject<IUpdateProgramAccessTokenEndpointParams>()
  .setName('UpdateProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
    token: partialFieldObject(newProgramAccessTokenInput),
  })
  .setRequired(true)
  .setDescription('Update program access token endpoint params.');
const updateProgramAccessTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateProgramAccessTokenEndpointResult>()
        .setName('UpdateProgramAccessTokenEndpointSuccessResult')
        .setFields({token: programAccessToken})
        .setRequired(true)
        .setDescription('Update program access token endpoint success result.')
    ),
];

const getProgramAccessTokenParams = new FieldObject<IGetProgramAccessTokenEndpointParams>()
  .setName('UpdateProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
  })
  .setRequired(true)
  .setDescription('Get program access token endpoint params.');
const getProgramAccessTokenResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetProgramAccessTokenEndpointResult>()
        .setName('UpdateProgramAccessTokenEndpointSuccessResult')
        .setFields({token: programAccessToken})
        .setRequired(true)
        .setDescription('Get program access token endpoint success result.')
    ),
];

const deleteProgramAccessTokenParams = new FieldObject<IDeleteProgramAccessTokenEndpointParams>()
  .setName('DeleteProgramAccessTokenEndpointParams')
  .setFields({
    tokenId: fReusables.idNotRequired,
    onReferenced: fReusables.effectOnReferencedNotRequired,
  })
  .setRequired(true)
  .setDescription('Delete program access token endpoint params.');

export const addProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/addToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addProgramAccessTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addProgramAccessTokenResult)
  .setName('Add Program Access Token Endpoint')
  .setDescription('Add program access token endpoint.');

export const getProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/getToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getProgramAccessTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getProgramAccessTokenResult)
  .setName('Get Program Access Token Endpoint')
  .setDescription('Get program access token endpoint.');

export const updateProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/updateToken')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateProgramAccessTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateProgramAccessTokenResult)
  .setName('Update Program Access Token Endpoint')
  .setDescription('Update program access token endpoint.');

export const deleteProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/deleteToken')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteProgramAccessTokenParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Program Access Token Endpoint')
  .setDescription('Delete program access token endpoint.');

export const getWorkspaceProgramAccessTokenEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/programAccessTokens/getWorkspaceTokens')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceProgramAccessTokensParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceProgramAccessTokensResult)
  .setName('Get Workspace Program Access Tokens Endpoint')
  .setDescription('Get workspace program access tokens endpoint.');
