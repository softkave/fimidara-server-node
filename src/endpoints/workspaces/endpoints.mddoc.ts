import {kUsageRecordCategory} from '../../definitions/usageRecord.js';
import {
  PublicUsageThreshold,
  PublicWorkspace,
  kWorkspaceBillStatusMap,
} from '../../definitions/workspace.js';
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
import {EndpointOptionalWorkspaceIDParam} from '../types.js';
import {
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
} from './addWorkspace/types.js';
import {workspaceConstants} from './constants.js';
import {
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
} from './getUserWorkspaces/types.js';
import {GetWorkspaceEndpointResult} from './getWorkspace/types.js';
import {
  AddWorkspaceHttpEndpoint,
  CountUserWorkspacesHttpEndpoint,
  DeleteWorkspaceHttpEndpoint,
  GetUserWorkspacesHttpEndpoint,
  GetWorkspaceHttpEndpoint,
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
const usageRecordCategory = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record category')
  .setExample(kUsageRecordCategory.storage)
  .setValid(Object.values(kUsageRecordCategory))
  .setEnumName('UsageRecordCategory');
const price = mddocConstruct
  .constructFieldNumber()
  .setDescription('Price in USD')
  .setExample(5);
const usageThreshold = mddocConstruct
  .constructFieldObject<PublicUsageThreshold>()
  .setName('UsageThreshold')
  .setFields({
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.agent
    ),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date
    ),
    category: mddocConstruct.constructFieldObjectField(
      true,
      usageRecordCategory
    ),
    budget: mddocConstruct.constructFieldObjectField(true, price),
    usage: mddocConstruct.constructFieldObjectField(true, fReusables.usage),
  });
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
    description: mddocConstruct.constructFieldObjectField(
      false,
      workspaceDescription
    ),
    publicPermissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.id
    ),
    billStatusAssignedAt: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.date
    ),
    billStatus: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Workspace bill status')
        .setExample(kWorkspaceBillStatusMap.ok)
        .setValid(Object.values(kWorkspaceBillStatusMap))
        .setEnumName('WorkspaceBillStatus')
    ),
    usageThresholds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<PublicWorkspace['usageThresholds']>()
        .setName('WorkspaceUsageThresholds')
        .setFields({
          [kUsageRecordCategory.storage]:
            mddocConstruct.constructFieldObjectField(false, usageThreshold),
          [kUsageRecordCategory.storageEverConsumed]:
            mddocConstruct.constructFieldObjectField(false, usageThreshold),
          [kUsageRecordCategory.bandwidthIn]:
            mddocConstruct.constructFieldObjectField(false, usageThreshold),
          [kUsageRecordCategory.bandwidthOut]:
            mddocConstruct.constructFieldObjectField(false, usageThreshold),
          [kUsageRecordCategory.total]:
            mddocConstruct.constructFieldObjectField(false, usageThreshold),
        })
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
  .constructFieldObject<EndpointOptionalWorkspaceIDParam>()
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
const getUserWorkspacesParams = mddocConstruct
  .constructFieldObject<GetUserWorkspacesEndpointParams>()
  .setName('GetUserWorkspacesEndpointParams')
  .setFields({
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.pageSize
    ),
  });
const getUserWorkspacesResponseBody = mddocConstruct
  .constructFieldObject<GetUserWorkspacesEndpointResult>()
  .setName('GetUserWorkspacesEndpointResult')
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
  .constructFieldObject<EndpointOptionalWorkspaceIDParam>()
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
  .setBasePathname(workspaceConstants.routes.addWorkspace)
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
  .setBasePathname(workspaceConstants.routes.getWorkspace)
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

export const getUserWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(workspaceConstants.routes.getUserWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUserWorkspacesParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(getUserWorkspacesResponseBody)
  .setName('GetUserWorkspacesEndpoint');

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
  .setBasePathname(workspaceConstants.routes.updateWorkspace)
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
  .setBasePathname(workspaceConstants.routes.deleteWorkspace)
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

export const countUserWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(workspaceConstants.routes.countUserWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(
    mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
  )
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountUserWorkspacesEndpoint');

export const workspaceEndpointsMddocParts = {workspace};
