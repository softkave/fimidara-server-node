import {PublicCollaborator} from '../../definitions/user.js';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc.js';
import {CountWorkspaceCollaborationRequestsHttpEndpoint} from '../collaborationRequests/types.js';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc.js';
import {collaboratorConstants} from './constants.js';
import {CountWorkspaceCollaboratorsEndpointParams} from './countWorkspaceCollaborators/types.js';
import {
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
} from './getCollaborator/types.js';
import {
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult,
} from './getCollaboratorsWithoutPermission/types.js';
import {
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types.js';
import {RemoveCollaboratorEndpointParams} from './removeCollaborator/types.js';
import {
  GetCollaboratorHttpEndpoint,
  GetCollaboratorsWithoutPermissionHttpEndpoint,
  GetWorkspaceCollaboratorsHttpEndpoint,
  RemoveCollaboratorHttpEndpoint,
} from './types.js';

const collaborator = mddocConstruct
  .constructFieldObject<PublicCollaborator>()
  .setName('Collaborator')
  .setFields({
    ...fReusables.workspaceResourceParts,
    firstName: mddocConstruct.constructFieldObjectField(true, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(true, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
  });

const getWorkspaceCollaboratorsParams = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaboratorsEndpointParams>()
  .setName('GetWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  });
const getWorkspaceCollaboratorsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaboratorsEndpointResult>()
  .setName('GetWorkspaceCollaboratorsEndpointResult')
  .setFields({
    collaborators: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicCollaborator>().setType(collaborator)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const getCollaboratorsWithoutPermissionParams = mddocConstruct
  .constructFieldObject<GetCollaboratorsWithoutPermissionEndpointParams>()
  .setName('GetCollaboratorsWithoutPermissionEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const getCollaboratorsWithoutPermissionResponseBody = mddocConstruct
  .constructFieldObject<GetCollaboratorsWithoutPermissionEndpointResult>()
  .setName('GetCollaboratorsWithoutPermissionEndpointResult')
  .setFields({
    collaboratorIds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<string>().setType(fReusables.id)
    ),
  })
  .setDescription(
    'Get workspace collaborators without permissions endpoint success result'
  );

const countWorkspaceCollaboratorsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceCollaboratorsEndpointParams>()
  .setName('CountWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const getCollaboratorParams = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
const getCollaboratorResponseBody = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointResult>()
  .setName('GetCollaboratorEndpointResult')
  .setFields({
    collaborator: mddocConstruct.constructFieldObjectField(true, collaborator),
  });
const removeCollaboratorParams = mddocConstruct
  .constructFieldObject<RemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  });
export const getCollaboratorEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetCollaboratorHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetCollaboratorHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetCollaboratorHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetCollaboratorHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetCollaboratorHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetCollaboratorHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collaboratorConstants.routes.getCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaboratorParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getCollaboratorResponseBody)
  .setName('GetCollaboratorEndpoint');

export const removeCollaboratorEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      RemoveCollaboratorHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collaboratorConstants.routes.removeCollaborator)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(removeCollaboratorParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('RemoveCollaboratorEndpoint');

export const getWorkspaceCollaboratorsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceCollaboratorsHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collaboratorConstants.routes.getWorkspaceCollaborators)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceCollaboratorsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceCollaboratorsResponseBody)
  .setName('GetWorkspaceCollaboratorsEndpoint');

export const countWorkspaceCollaboratorsEndpointDefinition = mddocConstruct
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
  .setBasePathname(collaboratorConstants.routes.countWorkspaceCollaborators)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceCollaboratorsParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceCollaboratorsEndpoint');

export const getCollaboratorsWithoutPermissionEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetCollaboratorsWithoutPermissionHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(collaboratorConstants.routes.getCollaboratorsWithoutPermission)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getCollaboratorsWithoutPermissionParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getCollaboratorsWithoutPermissionResponseBody)
  .setName('GetCollaboratorsWithoutPermissionEndpoint');
