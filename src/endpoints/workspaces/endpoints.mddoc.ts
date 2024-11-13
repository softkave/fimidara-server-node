import {PublicWorkspace} from '../../definitions/workspace.js';
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
import {EndpointOptionalWorkspaceIdParam} from '../types.js';
import {
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
} from './addWorkspace/types.js';
import {kWorkspaceConstants} from './constants.js';
import {GetWorkspaceEndpointResult} from './getWorkspace/types.js';
import {
  GetWorkspacesEndpointParams,
  GetWorkspacesEndpointResult,
} from './getWorkspaces/types.js';
import {
  AddWorkspaceHttpEndpoint,
  CountWorkspacesHttpEndpoint,
  DeleteWorkspaceHttpEndpoint,
  GetWorkspaceHttpEndpoint,
  GetWorkspacesHttpEndpoint,
  UpdateWorkspaceHttpEndpoint,
} from './types.js';
import {
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  UpdateWorkspaceInput,
} from './updateWorkspace/types.js';

const workspaceDescription = mddocConstruct
  .constructFieldString()
  .setDescription('Workspace description')
  .setExample(
    'fimidara, a super awesome company that offers file management with access control for devs'
  );
const workspace = mddocConstruct
  .constructFieldObject<PublicWorkspace>()
  .setName('Workspace')
  .setFields({
    ...fReusables.workspaceResourceParts,
    name: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceName
    ),
    rootname: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceRootname
    ),
    rootnamepath: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.rootnamepath
    ),
    description: mddocConstruct.constructFieldObjectField(
      false,
      workspaceDescription
    ),
  });

const addWorkspaceParams = mddocConstruct
  .constructFieldObject<AddWorkspaceEndpointParams>()
  .setName('AddWorkspaceEndpointParams')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceName
    ),
    rootname: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceRootname
    ),
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    description: mddocConstruct.constructFieldObjectField(
      false,
      workspaceDescription
    ),
  });
const addWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<AddWorkspaceEndpointResult>()
  .setName('AddWorkspaceEndpointResult')
  .setFields({
    workspace: mddocConstruct.constructFieldObjectField(true, workspace),
  });
const getWorkspaceParams = mddocConstruct
  .constructFieldObject<EndpointOptionalWorkspaceIdParam>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
const getWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceEndpointResult>()
  .setName('GetWorkspaceEndpointResult')
  .setFields({
    workspace: mddocConstruct.constructFieldObjectField(true, workspace),
  });
const getWorkspacesParams = mddocConstruct
  .constructFieldObject<GetWorkspacesEndpointParams>()
  .setName('GetWorkspacesEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceId
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getWorkspacesResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspacesEndpointResult>()
  .setName('GetWorkspacesEndpointResult')
  .setFields({
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
    workspaces: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicWorkspace>().setType(workspace)
    ),
  });
const updateWorkspaceParams = mddocConstruct
  .constructFieldObject<UpdateWorkspaceEndpointParams>()
  .setName('UpdateWorkspaceEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    workspace: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<UpdateWorkspaceInput>()
        .setName('UpdateWorkspaceInput')
        .setFields({
          name: mddocConstruct.constructFieldObjectField(
            false,
            fReusables.workspaceName
          ),
          workspaceId: mddocConstruct.constructFieldObjectField(
            false,
            fReusables.workspaceId
          ),
          description: mddocConstruct.constructFieldObjectField(
            false,
            workspaceDescription
          ),
        })
    ),
  });
const updateWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<UpdateWorkspaceEndpointResult>()
  .setName('UpdateWorkspaceEndpointResult')
  .setFields({
    workspace: mddocConstruct.constructFieldObjectField(true, workspace),
  });
const deleteWorkspaceParams = mddocConstruct
  .constructFieldObject<EndpointOptionalWorkspaceIdParam>()
  .setName('DeleteWorkspaceEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  });
export const addWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.addWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(addWorkspaceResponseBody)
  .setName('AddWorkspaceEndpoint');

export const getWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.getWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getWorkspaceResponseBody)
  .setName('GetWorkspaceEndpoint');

export const getWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.getWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspacesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getWorkspacesResponseBody)
  .setName('GetWorkspacesEndpoint');

export const updateWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.updateWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(updateWorkspaceResponseBody)
  .setName('UpdateWorkspaceEndpoint');

export const deleteWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.deleteWorkspace)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteWorkspaceEndpoint');

export const countWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(kWorkspaceConstants.routes.countWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspacesEndpoint');

export const workspaceEndpointsMddocParts = {workspace};
