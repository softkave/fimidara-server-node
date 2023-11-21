import {UsageRecordCategoryMap} from '../../definitions/usageRecord';
import {
  PublicUsageThreshold,
  PublicUsageThresholdLock,
  PublicWorkspace,
  WorkspaceBillStatusMap,
} from '../../definitions/workspace';
import {
  HttpEndpointMethod,
  InferFieldObjectOrMultipartType,
  InferFieldObjectType,
  mddocConstruct,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {EndpointOptionalWorkspaceIDParam} from '../types';
import {
  AddWorkspaceEndpointParams,
  AddWorkspaceEndpointResult,
} from './addWorkspace/types';
import {workspaceConstants} from './constants';
import {
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
} from './getUserWorkspaces/types';
import {GetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  AddWorkspaceHttpEndpoint,
  CountUserWorkspacesHttpEndpoint,
  DeleteWorkspaceHttpEndpoint,
  GetUserWorkspacesHttpEndpoint,
  GetWorkspaceHttpEndpoint,
  UpdateWorkspaceHttpEndpoint,
} from './types';
import {
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  UpdateWorkspaceInput,
} from './updateWorkspace/types';

const workspaceDescription = mddocConstruct
  .constructFieldString()
  .setDescription('Workspace description.')
  .setExample(
    'fimidara, a super awesome company that offers file management with access control for devs.'
  );
const usageRecordCategory = mddocConstruct
  .constructFieldString()
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategoryMap.Storage)
  .setValid(Object.values(UsageRecordCategoryMap))
  .setEnumName('UsageRecordCategory');
const price = mddocConstruct
  .constructFieldNumber()
  .setDescription('Price in USD.')
  .setExample(5);
const usageThreshold = mddocConstruct
  .constructFieldObject<PublicUsageThreshold>()
  .setName('UsageThreshold')
  .setFields({
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    category: mddocConstruct.constructFieldObjectField(true, usageRecordCategory),
    budget: mddocConstruct.constructFieldObjectField(true, price),
  });
const usageThresholdLock = mddocConstruct
  .constructFieldObject<PublicUsageThresholdLock>()
  .setName('UsageThresholdLock')
  .setFields({
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    category: mddocConstruct.constructFieldObjectField(true, usageRecordCategory),
    locked: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldBoolean()
        .setDescription('Flag for whether a certain usage category is locked or not.')
    ),
  });
const workspace = mddocConstruct
  .constructFieldObject<PublicWorkspace>()
  .setName('Workspace')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    providedResourceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.providedResourceIdOrNull
    ),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    name: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceName),
    rootname: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceRootname
    ),
    description: mddocConstruct.constructFieldObjectField(false, workspaceDescription),
    publicPermissionGroupId: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.id
    ),
    billStatusAssignedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    billStatus: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldString()
        .setDescription('Workspace bill status')
        .setExample(WorkspaceBillStatusMap.Ok)
        .setValid(Object.values(WorkspaceBillStatusMap))
        .setEnumName('WorkspaceBillStatus')
    ),
    usageThresholds: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<PublicWorkspace['usageThresholds']>()
        .setName('WorkspaceUsageThresholds')
        .setFields({
          [UsageRecordCategoryMap.Storage]: mddocConstruct.constructFieldObjectField(
            false,
            usageThreshold
          ),
          [UsageRecordCategoryMap.BandwidthIn]: mddocConstruct.constructFieldObjectField(
            false,
            usageThreshold
          ),
          [UsageRecordCategoryMap.BandwidthOut]: mddocConstruct.constructFieldObjectField(
            false,
            usageThreshold
          ),
          [UsageRecordCategoryMap.Total]: mddocConstruct.constructFieldObjectField(
            false,
            usageThreshold
          ),
        })
    ),
    usageThresholdLocks: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct
        .constructFieldObject<PublicWorkspace['usageThresholdLocks']>()
        .setName('WorkspaceUsageThresholdLocks')
        .setFields({
          [UsageRecordCategoryMap.Storage]: mddocConstruct.constructFieldObjectField(
            false,
            usageThresholdLock
          ),
          [UsageRecordCategoryMap.BandwidthIn]: mddocConstruct.constructFieldObjectField(
            false,
            usageThresholdLock
          ),
          [UsageRecordCategoryMap.BandwidthOut]: mddocConstruct.constructFieldObjectField(
            false,
            usageThresholdLock
          ),
          [UsageRecordCategoryMap.Total]: mddocConstruct.constructFieldObjectField(
            false,
            usageThresholdLock
          ),
        })
    ),
  });

const addWorkspaceParams = mddocConstruct
  .constructFieldObject<AddWorkspaceEndpointParams>()
  .setName('AddWorkspaceEndpointParams')
  .setFields({
    name: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceName),
    rootname: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.workspaceRootname
    ),
    description: mddocConstruct.constructFieldObjectField(false, workspaceDescription),
  })
  .setDescription('Add workspace endpoint params.');
const addWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<AddWorkspaceEndpointResult>()
  .setName('AddWorkspaceEndpointResult')
  .setFields({workspace: mddocConstruct.constructFieldObjectField(true, workspace)})
  .setDescription('Add workspace endpoint success result.');

const getWorkspaceParams = mddocConstruct
  .constructFieldObject<EndpointOptionalWorkspaceIDParam>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Get workspace endpoint params.');
const getWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceEndpointResult>()
  .setName('GetWorkspaceEndpointResult')
  .setFields({workspace: mddocConstruct.constructFieldObjectField(true, workspace)})
  .setDescription('Get workspace endpoint success result.');

const getUserWorkspacesParams = mddocConstruct
  .constructFieldObject<GetUserWorkspacesEndpointParams>()
  .setName('GetUserWorkspacesEndpointParams')
  .setFields({
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
  })
  .setDescription('Get user workspaces endpoint params.');
const getUserWorkspacesResponseBody = mddocConstruct
  .constructFieldObject<GetUserWorkspacesEndpointResult>()
  .setName('GetUserWorkspacesEndpointResult')
  .setFields({
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
    workspaces: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicWorkspace>().setType(workspace)
    ),
  })
  .setDescription('Get user workspaces endpoint success result.');

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
          name: mddocConstruct.constructFieldObjectField(false, fReusables.workspaceName),
          description: mddocConstruct.constructFieldObjectField(
            false,
            workspaceDescription
          ),
        })
    ),
  })
  .setDescription('Update workspace endpoint params.');
const updateWorkspaceResponseBody = mddocConstruct
  .constructFieldObject<UpdateWorkspaceEndpointResult>()
  .setName('UpdateWorkspaceEndpointResult')
  .setFields({workspace: mddocConstruct.constructFieldObjectField(true, workspace)})
  .setDescription('Update workspace endpoint success result.');

const deleteWorkspaceParams = mddocConstruct
  .constructFieldObject<EndpointOptionalWorkspaceIDParam>()
  .setName('DeleteWorkspaceEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
  })
  .setDescription('Delete workspace endpoint params.');

export const addWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<AddWorkspaceHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      AddWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<AddWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(workspaceConstants.routes.addWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addWorkspaceResponseBody)
  .setName('AddWorkspaceEndpoint')
  .setDescription('Add workspace endpoint.');

export const getWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetWorkspaceHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetWorkspaceHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(workspaceConstants.routes.getWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceResponseBody)
  .setName('GetWorkspaceEndpoint')
  .setDescription('Get workspace endpoint.');

export const getUserWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetUserWorkspacesHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUserWorkspacesResponseBody)
  .setName('GetUserWorkspacesEndpoint')
  .setDescription('Get user workspaces endpoint.');

export const updateWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<UpdateWorkspaceHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateWorkspaceResponseBody)
  .setName('UpdateWorkspaceEndpoint')
  .setDescription('Update workspace endpoint.');

export const deleteWorkspaceEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<DeleteWorkspaceHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteWorkspaceEndpoint')
  .setDescription('Delete workspace endpoint.');

export const countUserWorkspacesEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<CountUserWorkspacesHttpEndpoint['mddocHttpDefinition']['query']>,
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
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountUserWorkspacesEndpoint')
  .setDescription('Count workspace user workspaces endpoint.');

export const workspaceEndpointsMddocParts = {workspace};
