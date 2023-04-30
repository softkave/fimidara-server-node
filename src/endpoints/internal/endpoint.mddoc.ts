import {PublicUser} from '../../definitions/user';
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
import {internalConstants} from './constants';
import {
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types';
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
