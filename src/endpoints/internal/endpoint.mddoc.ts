import {PublicUser} from '../../definitions/user';
import {PublicWorkspace} from '../../definitions/workspace';
import {
  FieldBinaryType,
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc';
import {userEndpointsMddocParts} from '../users/endpoint.mddoc';
import {workspaceEndpointsMddocParts} from '../workspaces/endpoints.mddoc';
import {internalConstants} from './constants';
import {GetUsersEndpointParams, GetUsersEndpointResult} from './getUsers/types';
import {
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types';
import {GetWorkspacesEndpointParams, GetWorkspacesEndpointResult} from './getWorkspaces/types';
import {
  GetUsersHttpEndpoint,
  GetWaitlistedUsersHttpEndpoint,
  GetWorkspacesHttpEndpoint,
  UpgradeWaitlistedUsersHttpEndpoint,
} from './types';
import {UpgradeWaitlistedUsersEndpointParams} from './upgradeWaitlistedUsers/types';

const getWaitlistedUsersParams = mddocConstruct
  .constructFieldObject<GetWaitlistedUsersEndpointParams>()
  .setName('GetWaitlistedUsersEndpointParams')
  .setFields({})
  .setDescription('Retrieve waitlisted users endpoint params.');
const getWaitlistedUsersResponseBody = mddocConstruct
  .constructFieldObject<GetWaitlistedUsersEndpointResult>()
  .setName('GetWaitlistedUsersEndpointResult')
  .setFields({
    users: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicUser>().setType(userEndpointsMddocParts.user)
    ),
  })
  .setDescription('Retrieve waitlisted users result.');

const getUsersParams = mddocConstruct
  .constructFieldObject<GetUsersEndpointParams>()
  .setName('GetUsersEndpointParams')
  .setFields({})
  .setDescription('Retrieve users endpoint params.');
const getUsersResponseBody = mddocConstruct
  .constructFieldObject<GetUsersEndpointResult>()
  .setName('GetUsersEndpointResult')
  .setFields({
    users: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicUser>().setType(userEndpointsMddocParts.user)
    ),
  })
  .setDescription('Retrieve users result.');

const getWorkspacesParams = mddocConstruct
  .constructFieldObject<GetWorkspacesEndpointParams>()
  .setName('GetWorkspacesEndpointParams')
  .setFields({})
  .setDescription('Retrieve workspaces endpoint params.');
const getWorkspacesResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspacesEndpointResult>()
  .setName('GetWorkspacesEndpointResult')
  .setFields({
    workspaceList: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicWorkspace>()
        .setType(workspaceEndpointsMddocParts.workspace)
    ),
  })
  .setDescription('Retrieve workspaces result.');

const upgradeWaitlistedUsersParams = mddocConstruct
  .constructFieldObject<UpgradeWaitlistedUsersEndpointParams>()
  .setName('UpgradeWaitlistedUsersEndpointParams')
  .setFields({
    userIds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<string>().setType(fReusables.id)
    ),
  })
  .setDescription('Upgrade waitlisted users endpoint params.');

export const getWaitlistedUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(internalConstants.routes.getWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWaitlistedUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWaitlistedUsersResponseBody)
  .setName('GetWaitlistedUsersEndpoint')
  .setDescription('Get waitlisted users endpoint.');

export const upgradeWaitlistedUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(internalConstants.routes.upgradeWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(upgradeWaitlistedUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setName('UpgradeWaitlistedUsersEndpoint')
  .setDescription('Upgrade waitlisted users endpoint.');

export const getUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<GetUsersHttpEndpoint['mddocHttpDefinition']['requestBody']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<
      GetUsersHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(internalConstants.routes.getUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUsersParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUsersResponseBody)
  .setName('GetUsersEndpoint')
  .setDescription('Get users endpoint.');

export const getWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody'],
      FieldBinaryType
    >
  >()
  .setBasePathname(internalConstants.routes.getWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacesParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspacesResponseBody)
  .setName('GetWorkspacesEndpoint')
  .setDescription('Get workspaces endpoint.');
