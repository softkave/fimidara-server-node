import {PublicUser} from '../../definitions/user';
import {PublicWorkspace} from '../../definitions/workspace';
import {
  FieldArray,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {userEndpointsMddocParts} from '../users/endpoint.mddoc';
import {workspaceEndpointsMddocParts} from '../workspaces/endpoints.mddoc';
import {internalConstants} from './constants';
import {GetUsersEndpointParams, GetUsersEndpointResult} from './getUsers/types';
import {
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types';
import {GetWorkspacesEndpointParams, GetWorkspacesEndpointResult} from './getWorkspaces/types';
import {UpgradeWaitlistedUsersEndpointParams} from './upgradeWaitlistedUsers/types';

const getWaitlistedUsersParams = FieldObject.construct<GetWaitlistedUsersEndpointParams>()
  .setName('GetWaitlistedUsersEndpointParams')
  .setFields({})
  .setRequired(true)
  .setDescription('Retrieve waitlisted users endpoint params.');
const getWaitlistedUsersResponseBody = FieldObject.construct<GetWaitlistedUsersEndpointResult>()
  .setName('GetWaitlistedUsersEndpointResult')
  .setFields({
    users: FieldObject.requiredField(
      FieldArray.construct<PublicUser>().setType(userEndpointsMddocParts.user)
    ),
  })
  .setRequired(true)
  .setDescription('Retrieve waitlisted users result.');

const getUsersParams = FieldObject.construct<GetUsersEndpointParams>()
  .setName('GetUsersEndpointParams')
  .setFields({})
  .setRequired(true)
  .setDescription('Retrieve users endpoint params.');
const getUsersResponseBody = FieldObject.construct<GetUsersEndpointResult>()
  .setName('GetUsersEndpointResult')
  .setFields({
    users: FieldObject.requiredField(
      FieldArray.construct<PublicUser>().setType(userEndpointsMddocParts.user)
    ),
  })
  .setRequired(true)
  .setDescription('Retrieve users result.');

const getWorkspacesParams = FieldObject.construct<GetWorkspacesEndpointParams>()
  .setName('GetWorkspacesEndpointParams')
  .setFields({})
  .setRequired(true)
  .setDescription('Retrieve workspaces endpoint params.');
const getWorkspacesResponseBody = FieldObject.construct<GetWorkspacesEndpointResult>()
  .setName('GetWorkspacesEndpointResult')
  .setFields({
    workspaceList: FieldObject.requiredField(
      FieldArray.construct<PublicWorkspace>().setType(workspaceEndpointsMddocParts.workspace)
    ),
  })
  .setRequired(true)
  .setDescription('Retrieve workspaces result.');

const upgradeWaitlistedUsersParams = FieldObject.construct<UpgradeWaitlistedUsersEndpointParams>()
  .setName('UpgradeWaitlistedUsersEndpointParams')
  .setFields({
    userIds: FieldObject.requiredField(FieldArray.construct<string>().setType(fReusables.id)),
  })
  .setRequired(true)
  .setDescription('Upgrade waitlisted users endpoint params.');

export const getWaitlistedUsersEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWaitlistedUsersEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWaitlistedUsersEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(internalConstants.routes.getWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWaitlistedUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWaitlistedUsersResponseBody)
  .setName('GetWaitlistedUsersEndpoint')
  .setDescription('Get waitlisted users endpoint.');

export const upgradeWaitlistedUsersEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpgradeWaitlistedUsersEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(internalConstants.routes.upgradeWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(upgradeWaitlistedUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setName('UpgradeWaitlistedUsersEndpoint')
  .setDescription('Upgrade waitlisted users endpoint.');

export const getUsersEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetUsersEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetUsersEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(internalConstants.routes.getUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUsersResponseBody)
  .setName('GetUsersEndpoint')
  .setDescription('Get users endpoint.');

export const getWorkspacesEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspacesEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspacesEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(internalConstants.routes.getWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacesParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspacesResponseBody)
  .setName('GetWorkspacesEndpoint')
  .setDescription('Get workspaces endpoint.');
