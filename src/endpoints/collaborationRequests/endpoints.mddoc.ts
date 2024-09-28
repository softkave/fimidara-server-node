import {
  kCollaborationRequestStatusTypeMap,
  PublicCollaborationRequestForUser,
  PublicCollaborationRequestForWorkspace,
} from '../../definitions/collaborationRequest.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {collabRequestConstants} from './constants.js';
import {CountWorkspaceCollaborationRequestsEndpointParams} from './countWorkspaceRequests/types.js';
import {DeleteCollaborationRequestEndpointParams} from './deleteRequest/types.js';
import {
  GetUserCollaborationRequestEndpointParams,
  GetUserCollaborationRequestEndpointResult,
} from './getUserRequest/types.js';
import {
  GetUserCollaborationRequestsEndpointParams,
  GetUserCollaborationRequestsEndpointResult,
} from './getUserRequests/types.js';
import {
  GetWorkspaceCollaborationRequestEndpointParams,
  GetWorkspaceCollaborationRequestEndpointResult,
} from './getWorkspaceRequest/types.js';
import {
  GetWorkspaceCollaborationRequestsEndpointParams,
  GetWorkspaceCollaborationRequestsEndpointResult,
} from './getWorkspaceRequests/types.js';
import {
  RespondToCollaborationRequestEndpointParams,
  RespondToCollaborationRequestEndpointResult,
} from './respondToRequest/types.js';
import {
  RevokeCollaborationRequestEndpointParams,
  RevokeCollaborationRequestEndpointResult,
} from './revokeRequest/types.js';
import {
  SendCollaborationRequestEndpointParams,
  SendCollaborationRequestEndpointResult,
} from './sendRequest/types.js';
import {
  CountUserCollaborationRequestsHttpEndpoint,
  CountWorkspaceCollaborationRequestsHttpEndpoint,
  DeleteCollaborationRequestHttpEndpoint,
  GetUserCollaborationRequestHttpEndpoint,
  GetUserCollaborationRequestsHttpEndpoint,
  GetWorkspaceCollaborationRequestHttpEndpoint,
  GetWorkspaceCollaborationRequestsHttpEndpoint,
  RespondToCollaborationRequestHttpEndpoint,
  RevokeCollaborationRequestHttpEndpoint,
  SendCollaborationRequestHttpEndpoint,
  UpdateCollaborationRequestHttpEndpoint,
} from './types.js';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestEndpointResult,
  UpdateCollaborationRequestInput,
} from './updateRequest/types.js';

const recipientEmail = mddocConstruct
  .constructFieldString()
  .setDescription("Recipient's email address");
const message = mddocConstruct
  .constructFieldString()
  .setDescription('Message to recipient');
const statusType = mddocConstruct
  .constructFieldString()
  .setDescription('Collaboration request status')
  .setValid(Object.values(kCollaborationRequestStatusTypeMap))
  .setEnumName('CollaborationRequestStatusType');
const response = mddocConstruct
  .constructFieldString()

  .setValid([
    kCollaborationRequestStatusTypeMap.Accepted,
    kCollaborationRequestStatusTypeMap.Declined,
  ])
  .setEnumName('CollaborationRequestResponseType');

const updateCollaborationRequestInput = mddocConstruct
  .constructFieldObject<UpdateCollaborationRequestInput>()
  .setName('UpdateCollaborationRequestInput')
  .setFields({
    message: mddocConstruct.constructFieldObjectField(false, message),
    expires: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
  });

const collaborationRequestForUser = mddocConstruct
  .constructFieldObject<PublicCollaborationRequestForUser>()
  .setName('CollaborationRequestForUser')
  .setFields({
    ...fReusables.resourceParts,
    recipientEmail: mddocConstruct.constructFieldObjectField(
      true,
      recipientEmail
    ),
    message: mddocConstruct.constructFieldObjectField(true, message),
    expiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
    workspaceName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceName
    ),
    readAt: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    status: mddocConstruct.constructFieldObjectField(true, statusType),
    statusDate: mddocConstruct.constructFieldObjectField(true, fReusables.date),
  });
const collaborationRequestForWorkspace = mddocConstruct
  .constructFieldObject<PublicCollaborationRequestForWorkspace>()
  .setName('CollaborationRequestForWorkspace')
  .setFields({
    ...fReusables.workspaceResourceParts,
    recipientEmail: mddocConstruct.constructFieldObjectField(
      true,
      recipientEmail
    ),
    message: mddocConstruct.constructFieldObjectField(true, message),
    expiresAt: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
    workspaceName: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceName
    ),
    readAt: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    status: mddocConstruct.constructFieldObjectField(true, statusType),
    statusDate: mddocConstruct.constructFieldObjectField(true, fReusables.date),
  });

const sendCollaborationRequestParams = mddocConstruct
  .constructFieldObject<SendCollaborationRequestEndpointParams>()
  .setName('SendCollaborationRequestEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    recipientEmail: mddocConstruct.constructFieldObjectField(
      true,
      recipientEmail
    ),
    message: mddocConstruct.constructFieldObjectField(true, message),
    expires: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.expires
    ),
  });
const sendCollaborationRequestResponseBody = mddocConstruct
  .constructFieldObject<SendCollaborationRequestEndpointResult>()
  .setName('SendCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForWorkspace
    ),
  });
const getWorkspaceCollaborationRequestsParams = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaborationRequestsEndpointParams>()
  .setName('GetWorkspaceCollaborationRequestsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getWorkspaceCollaborationRequestsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaborationRequestsEndpointResult>()
  .setName('GetWorkspaceCollaborationRequestsEndpointResult')
  .setFields({
    requests: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicCollaborationRequestForWorkspace>()
        .setType(collaborationRequestForWorkspace)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const countWorkspaceCollaborationRequestsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceCollaborationRequestsEndpointParams>()
  .setName('CountWorkspaceCollaborationRequestsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const getUserCollaborationRequestsParams = mddocConstruct
  .constructFieldObject<GetUserCollaborationRequestsEndpointParams>()
  .setName('GetUserCollaborationRequestsEndpointParams')
  .setFields({
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getUserCollaborationRequestsResponseBody = mddocConstruct
  .constructFieldObject<GetUserCollaborationRequestsEndpointResult>()
  .setName('GetUserCollaborationRequestsEndpointResult')
  .setFields({
    requests: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldArray<PublicCollaborationRequestForUser>()
        .setType(collaborationRequestForUser)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const updateCollaborationRequestParams = mddocConstruct
  .constructFieldObject<UpdateCollaborationRequestEndpointParams>()
  .setName('UpdateCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    request: mddocConstruct.constructFieldObjectField(
      true,
      updateCollaborationRequestInput
    ),
  });
const updateCollaborationRequestResponseBody = mddocConstruct
  .constructFieldObject<UpdateCollaborationRequestEndpointResult>()
  .setName('UpdateCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForWorkspace
    ),
  });
const respondToCollaborationRequestParams = mddocConstruct
  .constructFieldObject<RespondToCollaborationRequestEndpointParams>()
  .setName('RespondToCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    response: mddocConstruct.constructFieldObjectField(true, response),
  });
const respondToCollaborationRequestResponseBody = mddocConstruct
  .constructFieldObject<RespondToCollaborationRequestEndpointResult>()
  .setName('RespondToCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForUser
    ),
  });
const getCollaborationRequestForUserParams = mddocConstruct
  .constructFieldObject<GetUserCollaborationRequestEndpointParams>()
  .setName('GetUserCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const getCollaborationRequestForUserResponseBody = mddocConstruct
  .constructFieldObject<GetUserCollaborationRequestEndpointResult>()
  .setName('GetUserCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForUser
    ),
  });
const getCollaborationRequestForWorkspaceParams = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaborationRequestEndpointParams>()
  .setName('GetWorkspaceCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const getCollaborationRequestForWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaborationRequestEndpointResult>()
  .setName('GetWorkspaceCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForWorkspace
    ),
  });
const revokeCollaborationRequestParams = mddocConstruct
  .constructFieldObject<RevokeCollaborationRequestEndpointParams>()
  .setName('RevokeCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const revokeCollaborationRequestResponseBody = mddocConstruct
  .constructFieldObject<RevokeCollaborationRequestEndpointResult>()
  .setName('RevokeCollaborationRequestEndpointResult')
  .setFields({
    request: mddocConstruct.constructFieldObjectField(
      true,
      collaborationRequestForWorkspace
    ),
  });
const deleteCollaborationRequestParams = mddocConstruct
  .constructFieldObject<DeleteCollaborationRequestEndpointParams>()
  .setName('DeleteCollaborationRequestEndpointParams')
  .setFields({
    requestId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
export const sendCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      SendCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.sendRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(sendCollaborationRequestParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(sendCollaborationRequestResponseBody)
  .setName('SendCollaborationRequestEndpoint');

export const getUserCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.getUserRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaborationRequestForUserParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getCollaborationRequestForUserResponseBody)
  .setName('GetUserCollaborationRequestEndpoint');

export const getWorkspaceCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.getWorkspaceRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaborationRequestForWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getCollaborationRequestForWorkspaceResponseBody)
  .setName('GetWorkspaceCollaborationRequestEndpoint');

export const updateCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.updateRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateCollaborationRequestParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateCollaborationRequestResponseBody)
  .setName('UpdateCollaborationRequestEndpoint');

export const respondToCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      RespondToCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.respondToRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(respondToCollaborationRequestParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(respondToCollaborationRequestResponseBody)
  .setName('RespondToCollaborationRequestEndpoint');

export const revokeCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      RevokeCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.revokeRequest)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(revokeCollaborationRequestParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(revokeCollaborationRequestResponseBody)
  .setName('RevokeCollaborationRequestEndpoint');

export const deleteCollaborationRequestEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteCollaborationRequestHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.deleteRequest)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteCollaborationRequestParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteCollaborationRequestEndpoint');

export const getWorkspaceCollaborationRequestsEndpointDefinition =
  mddocConstruct
    .constructHttpEndpointDefinition<
      InferFieldObjectType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
      >,
      InferFieldObjectType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
      >,
      InferFieldObjectType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['query']
      >,
      InferFieldObjectOrMultipartType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestBody']
      >,
      InferFieldObjectType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
      >,
      InferFieldObjectType<
        GetWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseBody']
      >
    >()
    .setBasePathname(collabRequestConstants.routes.getWorkspaceRequests)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(getWorkspaceCollaborationRequestsParams)
    .setRequestHeaders(
      mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
    )
    .setResponseHeaders(
      mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
    )
    .setResponseBody(getWorkspaceCollaborationRequestsResponseBody)
    .setName('GetWorkspaceCollaborationRequestsEndpoint');

export const getUserCollaborationRequestsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.getUserRequests)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUserCollaborationRequestsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getUserCollaborationRequestsResponseBody)
  .setName('GetUserCollaborationRequestsEndpoint');

export const countUserCollaborationRequestsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountUserCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collabRequestConstants.routes.countUserRequests)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountUserCollaborationRequestsEndpoint');

export const countWorkspaceCollaborationRequestsEndpointDefinition =
  mddocConstruct
    .constructHttpEndpointDefinition<
      InferFieldObjectType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
      >,
      InferFieldObjectType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
      >,
      InferFieldObjectType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['query']
      >,
      InferFieldObjectOrMultipartType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['requestBody']
      >,
      InferFieldObjectType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
      >,
      InferFieldObjectType<
        CountWorkspaceCollaborationRequestsHttpEndpoint['mddocHttpDefinition']['responseBody']
      >
    >()
    .setBasePathname(collabRequestConstants.routes.countWorkspaceRequests)
    .setMethod(HttpEndpointMethod.Post)
    .setRequestBody(countWorkspaceCollaborationRequestsParams)
    .setRequestHeaders(
      mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
    )
    .setResponseHeaders(
      mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
    )
    .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
    .setName('CountWorkspaceCollaborationRequestsEndpoint');
