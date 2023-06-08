import {UsageRecordCategory} from '../../definitions/usageRecord';
import {
  PublicUsageThreshold,
  PublicUsageThresholdLock,
  PublicWorkspace,
  WorkspaceBillStatus,
} from '../../definitions/workspace';
import {
  FieldArray,
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {LongRunningJobResult} from '../jobs/types';
import {
  CountItemsEndpointResult,
  EndpointOptionalWorkspaceIDParam,
  HttpEndpointRequestHeaders_AuthRequired,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {AddWorkspaceEndpointParams, AddWorkspaceEndpointResult} from './addWorkspace/types';
import {workspaceConstants} from './constants';
import {
  GetUserWorkspacesEndpointParams,
  GetUserWorkspacesEndpointResult,
} from './getUserWorkspaces/types';
import {GetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  UpdateWorkspaceEndpointParams,
  UpdateWorkspaceEndpointResult,
  UpdateWorkspaceInput,
} from './updateWorkspace/types';

const workspaceDescription = FieldString.construct()
  .setDescription('Workspace description.')
  .setExample(
    'fimidara, a super awesome company that offers file management with access control for devs.'
  );
const usageRecordCategory = FieldString.construct()
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategory.Storage)
  .setValid(Object.values(UsageRecordCategory))
  .setEnumName('UsageRecordCategory');
const price = FieldNumber.construct().setDescription('Price in USD.').setExample(5);
const usageThreshold = FieldObject.construct<PublicUsageThreshold>()
  .setName('UsageThreshold')
  .setFields({
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    category: FieldObject.requiredField(usageRecordCategory),
    budget: FieldObject.requiredField(price),
  });
const usageThresholdLock = FieldObject.construct<PublicUsageThresholdLock>()
  .setName('UsageThresholdLock')
  .setFields({
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    category: FieldObject.requiredField(usageRecordCategory),
    locked: FieldObject.requiredField(
      FieldBoolean.construct().setDescription(
        'Flag for whether a certain usage category is locked or not.'
      )
    ),
  });
const workspace = FieldObject.construct<PublicWorkspace>()
  .setName('Workspace')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    workspaceId: FieldObject.requiredField(fReusables.id),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    name: FieldObject.requiredField(fReusables.workspaceName),
    rootname: FieldObject.requiredField(fReusables.workspaceRootname),
    description: FieldObject.optionalField(workspaceDescription),
    publicPermissionGroupId: FieldObject.requiredField(fReusables.id),
    billStatusAssignedAt: FieldObject.requiredField(fReusables.date),
    billStatus: FieldObject.requiredField(
      FieldString.construct()
        .setDescription('Workspace bill status')
        .setExample(WorkspaceBillStatus.Ok)
        .setValid(Object.values(WorkspaceBillStatus))
        .setEnumName('WorkspaceBillStatus')
    ),
    usageThresholds: FieldObject.requiredField(
      FieldObject.construct<PublicWorkspace['usageThresholds']>()
        .setName('WorkspaceUsageThresholds')
        .setFields({
          [UsageRecordCategory.Storage]: FieldObject.optionalField(usageThreshold),
          [UsageRecordCategory.BandwidthIn]: FieldObject.optionalField(usageThreshold),
          [UsageRecordCategory.BandwidthOut]: FieldObject.optionalField(usageThreshold),
          [UsageRecordCategory.Total]: FieldObject.optionalField(usageThreshold),
        })
    ),
    usageThresholdLocks: FieldObject.requiredField(
      FieldObject.construct<PublicWorkspace['usageThresholdLocks']>()
        .setName('WorkspaceUsageThresholdLocks')
        .setFields({
          [UsageRecordCategory.Storage]: FieldObject.optionalField(usageThresholdLock),
          [UsageRecordCategory.BandwidthIn]: FieldObject.optionalField(usageThresholdLock),
          [UsageRecordCategory.BandwidthOut]: FieldObject.optionalField(usageThresholdLock),
          [UsageRecordCategory.Total]: FieldObject.optionalField(usageThresholdLock),
        })
    ),
  });

const addWorkspaceParams = FieldObject.construct<AddWorkspaceEndpointParams>()
  .setName('AddWorkspaceEndpointParams')
  .setFields({
    name: FieldObject.requiredField(fReusables.workspaceName),
    rootname: FieldObject.requiredField(fReusables.workspaceRootname),
    description: FieldObject.optionalField(workspaceDescription),
  })
  .setRequired(true)
  .setDescription('Add workspace endpoint params.');
const addWorkspaceResponseBody = FieldObject.construct<AddWorkspaceEndpointResult>()
  .setName('AddWorkspaceEndpointResult')
  .setFields({workspace: FieldObject.requiredField(workspace)})
  .setRequired(true)
  .setDescription('Add workspace endpoint success result.');

const getWorkspaceParams = FieldObject.construct<EndpointOptionalWorkspaceIDParam>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Get workspace endpoint params.');
const getWorkspaceResponseBody = FieldObject.construct<GetWorkspaceEndpointResult>()
  .setName('GetWorkspaceEndpointResult')
  .setFields({workspace: FieldObject.requiredField(workspace)})
  .setRequired(true)
  .setDescription('Get workspace endpoint success result.');

const getUserWorkspacesParams = FieldObject.construct<GetUserWorkspacesEndpointParams>()
  .setName('GetUserWorkspacesEndpointParams')
  .setFields({
    page: FieldObject.optionalField(fReusables.page),
    pageSize: FieldObject.optionalField(fReusables.pageSize),
  })
  .setRequired(true)
  .setDescription('Get user workspaces endpoint params.');
const getUserWorkspacesResponseBody = FieldObject.construct<GetUserWorkspacesEndpointResult>()
  .setName('GetUserWorkspacesEndpointResult')
  .setFields({
    page: FieldObject.requiredField(fReusables.page),
    workspaces: FieldObject.requiredField(
      FieldArray.construct<PublicWorkspace>().setType(workspace)
    ),
  })
  .setRequired(true)
  .setDescription('Get user workspaces endpoint success result.');

const updateWorkspaceParams = FieldObject.construct<UpdateWorkspaceEndpointParams>()
  .setName('UpdateWorkspaceEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    workspace: FieldObject.requiredField(
      FieldObject.construct<UpdateWorkspaceInput>()
        .setName('UpdateWorkspaceInput')
        .setFields({
          name: FieldObject.optionalField(fReusables.workspaceName),
          description: FieldObject.optionalField(workspaceDescription),
        })
    ),
  })
  .setRequired(true)
  .setDescription('Update workspace endpoint params.');
const updateWorkspaceResponseBody = FieldObject.construct<UpdateWorkspaceEndpointResult>()
  .setName('UpdateWorkspaceEndpointResult')
  .setFields({workspace: FieldObject.requiredField(workspace)})
  .setRequired(true)
  .setDescription('Update workspace endpoint success result.');

const deleteWorkspaceParams = FieldObject.construct<EndpointOptionalWorkspaceIDParam>()
  .setName('DeleteWorkspaceEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
  })
  .setRequired(true)
  .setDescription('Delete workspace endpoint params.');

export const addWorkspaceEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: AddWorkspaceEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: AddWorkspaceEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.addWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(addWorkspaceParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(addWorkspaceResponseBody)
  .setName('AddWorkspaceEndpoint')
  .setDescription('Add workspace endpoint.');

export const getWorkspaceEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: EndpointOptionalWorkspaceIDParam;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.getWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceResponseBody)
  .setName('GetWorkspaceEndpoint')
  .setDescription('Get workspace endpoint.');

export const getUserWorkspacesEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetUserWorkspacesEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetUserWorkspacesEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.getUserWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getUserWorkspacesParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUserWorkspacesResponseBody)
  .setName('GetUserWorkspacesEndpoint')
  .setDescription('Get user workspaces endpoint.');

export const updateWorkspaceEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: UpdateWorkspaceEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: UpdateWorkspaceEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.updateWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(updateWorkspaceParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(updateWorkspaceResponseBody)
  .setName('UpdateWorkspaceEndpoint')
  .setDescription('Update workspace endpoint.');

export const deleteWorkspaceEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: EndpointOptionalWorkspaceIDParam;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: LongRunningJobResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.deleteWorkspace)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(deleteWorkspaceParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.longRunningJobResponseBody)
  .setName('DeleteWorkspaceEndpoint')
  .setDescription('Delete workspace endpoint.');

export const countUserWorkspacesEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(workspaceConstants.routes.countUserWorkspaces)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountUserWorkspacesEndpoint')
  .setDescription('Count workspace user workspaces endpoint.');
