import {PublicCollaborator} from '../../definitions/user';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {CountWorkspaceCollaborationRequestsHttpEndpoint} from '../collaborationRequests/types';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {collaboratorConstants} from './constants';
import {CountWorkspaceCollaboratorsEndpointParams} from './countWorkspaceCollaborators/types';
import {
  GetCollaboratorEndpointParams,
  GetCollaboratorEndpointResult,
} from './getCollaborator/types';
import {
  GetCollaboratorsWithoutPermissionEndpointParams,
  GetCollaboratorsWithoutPermissionEndpointResult,
} from './getCollaboratorsWithoutPermission/types';
import {
  GetWorkspaceCollaboratorsEndpointParams,
  GetWorkspaceCollaboratorsEndpointResult,
} from './getWorkspaceCollaborators/types';
import {RemoveCollaboratorEndpointParams} from './removeCollaborator/types';
import {
  GetCollaboratorHttpEndpoint,
  GetCollaboratorsWithoutPermissionHttpEndpoint,
  GetWorkspaceCollaboratorsHttpEndpoint,
  RemoveCollaboratorHttpEndpoint,
} from './types';

const collaborator = mddocConstruct
  .constructFieldObject<PublicCollaborator>()
  .setName('Collaborator')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    firstName: mddocConstruct.constructFieldObjectField(true, fReusables.firstName),
    lastName: mddocConstruct.constructFieldObjectField(true, fReusables.lastName),
    email: mddocConstruct.constructFieldObjectField(true, fReusables.emailAddress),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
    joinedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    createdAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date.clone().setDescription('Always 0.')
    ),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date.clone().setDescription('Always 0.')
    ),
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
  })
  .setDescription('Get workspace collaborators endpoint params.');
const getWorkspaceCollaboratorsResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceCollaboratorsEndpointResult>()
  .setName('GetWorkspaceCollaboratorsEndpointResult')
  .setFields({
    collaborators: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicCollaborator>().setType(collaborator)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  })
  .setDescription('Get workspace collaborators endpoint success result.');

const getCollaboratorsWithoutPermissionParams = mddocConstruct
  .constructFieldObject<GetCollaboratorsWithoutPermissionEndpointParams>()
  .setName('GetCollaboratorsWithoutPermissionEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Get workspace collaborators without permissions endpoint params.');
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
    'Get workspace collaborators without permissions endpoint success result.'
  );

const countWorkspaceCollaboratorsParams = mddocConstruct
  .constructFieldObject<CountWorkspaceCollaboratorsEndpointParams>()
  .setName('CountWorkspaceCollaboratorsEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Count workspace collaborators endpoint params.');

const getCollaboratorParams = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointParams>()
  .setName('GetCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  })
  .setDescription('Get collaborator endpoint params.');
const getCollaboratorResponseBody = mddocConstruct
  .constructFieldObject<GetCollaboratorEndpointResult>()
  .setName('GetCollaboratorEndpointResult')
  .setFields({collaborator: mddocConstruct.constructFieldObjectField(true, collaborator)})
  .setDescription('Get collaborator endpoint success result.');

const removeCollaboratorParams = mddocConstruct
  .constructFieldObject<RemoveCollaboratorEndpointParams>()
  .setName('RevokeCollaboratorEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    collaboratorId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
  })
  .setDescription('Remove collaborator endpoint params.');

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
  .setName('GetCollaboratorEndpoint')
  .setDescription('Get collaborator endpoint.');

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
  .setName('RemoveCollaboratorEndpoint')
  .setDescription('Remove collaborator endpoint.');

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
  .setName('GetWorkspaceCollaboratorsEndpoint')
  .setDescription('Get workspace collaborators endpoint.');

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
  .setName('CountWorkspaceCollaboratorsEndpoint')
  .setDescription('Count workspace collaborators endpoint.');

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
  .setName('GetCollaboratorsWithoutPermissionEndpoint')
  .setDescription('Get workspace collaborators without permissions endpoint.');
