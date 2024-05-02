import {PublicUser} from '../../definitions/user.js';
import {PublicWorkspace} from '../../definitions/workspace.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {fReusables, mddocEndpointHttpHeaderItems} from '../endpoints.mddoc.js';
import {userEndpointsMddocParts} from '../users/endpoint.mddoc.js';
import {workspaceEndpointsMddocParts} from '../workspaces/endpoints.mddoc.js';
import {internalConstants} from './constants.js';
import {GetUsersEndpointParams, GetUsersEndpointResult} from './getUsers/types.js';
import {
  GetWaitlistedUsersEndpointParams,
  GetWaitlistedUsersEndpointResult,
} from './getWaitlistedUsers/types.js';
import {
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
} from './getWorkspaces/types.js';
import {
  GetUsersHttpEndpoint,
  GetWaitlistedUsersHttpEndpoint,
  GetWorkspacesHttpEndpoint,
  UpgradeWaitlistedUsersHttpEndpoint,
} from './types.js';
import {UpgradeWaitlistedUsersEndpointParams} from './upgradeWaitlistedUsers/types.js';

const getWaitlistedUsersParams = mddocConstruct
  .constructFieldObject<GetWaitlistedUsersEndpointParams>()
  .setName('GetWaitlistedUsersEndpointParams')
  .setFields({});
const getWaitlistedUsersResponseBody = mddocConstruct
  .constructFieldObject<GetWaitlistedUsersEndpointResult>()
  .setName('GetWaitlistedUsersEndpointResult')
  .setFields({
    users: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicUser>()
        .setType(userEndpointsMddocParts.user)
    ),
  });
const getUsersParams = mddocConstruct
  .constructFieldObject<GetUsersEndpointParams>()
  .setName('GetUsersEndpointParams')
  .setFields({});
const getUsersResponseBody = mddocConstruct
  .constructFieldObject<GetUsersEndpointResult>()
  .setName('GetUsersEndpointResult')
  .setFields({
    users: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicUser>()
        .setType(userEndpointsMddocParts.user)
    ),
  });
const getWorkspacesParams = mddocConstruct
  .constructFieldObject<GetWorkspacesEndpointParams>()
  .setName('GetWorkspacesEndpointParams')
  .setFields({});
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
  });
const upgradeWaitlistedUsersParams = mddocConstruct
  .constructFieldObject<UpgradeWaitlistedUsersEndpointParams>()
  .setName('UpgradeWaitlistedUsersEndpointParams')
  .setFields({
    userIds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<string>().setType(fReusables.id)
    ),
  });
export const getWaitlistedUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(internalConstants.routes.getWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWaitlistedUsersParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWaitlistedUsersResponseBody)
  .setName('GetWaitlistedUsersEndpoint');

export const upgradeWaitlistedUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpgradeWaitlistedUsersHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(internalConstants.routes.upgradeWaitlistedUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(upgradeWaitlistedUsersParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setName('UpgradeWaitlistedUsersEndpoint');

export const getUsersEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['requestHeaders']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['pathParamaters']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetUsersHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['responseHeaders']>,
    InferFieldObjectType<GetUsersHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(internalConstants.routes.getUsers)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUsersParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUsersResponseBody)
  .setName('GetUsersEndpoint');

export const getWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(internalConstants.routes.getWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspacesResponseBody)
  .setName('GetWorkspacesEndpoint');
