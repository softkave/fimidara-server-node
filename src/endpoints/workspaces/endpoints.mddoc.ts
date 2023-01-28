import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IPublicWorkspace, IUsageThreshold, IUsageThresholdLock, WorkspaceBillStatus} from '../../definitions/workspace';
import {
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  orUndefined,
} from '../../mddoc/mddoc';
import {endpointHttpHeaderItems, endpointHttpResponseItems, endpointStatusCodes, fReusables} from '../endpoints.mddoc';
import {IAddWorkspaceEndpointParams, IAddWorkspaceEndpointResult} from './addWorkspace/types';
import {workspaceConstants} from './constants';
import {IDeleteWorkspaceEndpointParams} from './deleteWorkspace/types';
import {IGetWorkspaceEndpointParams, IGetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  IUpdateWorkspaceEndpointParams,
  IUpdateWorkspaceEndpointResult,
  IUpdateWorkspaceInput,
} from './updateWorkspace/types';

const workspaceDescription = new FieldString()
  .setRequired(true)
  .setDescription('Workspace description.')
  .setExample('fimidara, a super awesome company that offers file management with access control for devs.');
const usageRecordCategory = new FieldString()
  .setRequired(true)
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategory.Storage)
  .setValid(Object.values(UsageRecordCategory));
const price = new FieldNumber().setRequired(true).setDescription('Price in USD.').setExample(5);
const usageThreshold = new FieldObject<IUsageThreshold>().setName('UsageThreshold').setFields({
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  category: usageRecordCategory,
  budget: price,
});
const usageThresholdLock = new FieldObject<IUsageThresholdLock>().setName('UsageThresholdLock').setFields({
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  category: usageRecordCategory,
  locked: new FieldBoolean(true, 'Flag for whether a certain usage category is locked or not.', false),
});
const workspace = new FieldObject<IPublicWorkspace>().setName('Workspace').setFields({
  resourceId: new FieldString(),
  createdBy: fReusables.agent,
  createdAt: fReusables.date,
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  name: fReusables.workspaceName,
  rootname: fReusables.workspaceRootname,
  description: workspaceDescription,
  publicPermissionGroupId: fReusables.idOrUndefined,
  billStatusAssignedAt: fReusables.dateOrUndefined,
  billStatus: orUndefined(
    new FieldString()
      .setDescription('Workspace bill status')
      .setExample(WorkspaceBillStatus.Ok)
      .setValid(Object.values(WorkspaceBillStatus))
  ),
  usageThresholds: orUndefined(
    new FieldObject<IPublicWorkspace['usageThresholds']>().setName('WorkspaceUsageThresholds').setFields({
      [UsageRecordCategory.Storage]: orUndefined(usageThreshold),
      [UsageRecordCategory.BandwidthIn]: orUndefined(usageThreshold),
      [UsageRecordCategory.BandwidthOut]: orUndefined(usageThreshold),
      [UsageRecordCategory.Total]: orUndefined(usageThreshold),
    })
  ),
  usageThresholdLocks: orUndefined(
    new FieldObject<IPublicWorkspace['usageThresholdLocks']>().setName('WorkspaceUsageThresholdLocks').setFields({
      [UsageRecordCategory.Storage]: orUndefined(usageThresholdLock),
      [UsageRecordCategory.BandwidthIn]: orUndefined(usageThresholdLock),
      [UsageRecordCategory.BandwidthOut]: orUndefined(usageThresholdLock),
      [UsageRecordCategory.Total]: orUndefined(usageThresholdLock),
    })
  ),
});

const addWorkspaceParams = new FieldObject<IAddWorkspaceEndpointParams>()
  .setName('AddWorkspaceEndpointParams')
  .setFields({
    name: fReusables.workspaceName,
    rootname: fReusables.workspaceRootname,
    description: cloneAndMarkNotRequired(workspaceDescription),
  })
  .setRequired(true)
  .setDescription('Add workspace endpoint params.');
const addWorkspaceResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddWorkspaceEndpointResult>()
        .setName('AddWorkspaceEndpointSuccessResult')
        .setFields({workspace})
        .setRequired(true)
        .setDescription('Add workspace endpoint success result.')
    ),
];

const getWorkspaceParams = new FieldObject<IGetWorkspaceEndpointParams>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Get workspace endpoint params.');
const getWorkspaceResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IGetWorkspaceEndpointResult>()
        .setName('GetWorkspaceEndpointSuccessResult')
        .setFields({workspace})
        .setRequired(true)
        .setDescription('Get workspace endpoint success result.')
    ),
];

const updateWorkspaceParams = new FieldObject<IUpdateWorkspaceEndpointParams>()
  .setName('UpdateWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
    workspace: new FieldObject<IUpdateWorkspaceInput>().setName('UpdateWorkspaceInput').setFields({
      name: fReusables.workspaceNameNotRequired,
      description: cloneAndMarkNotRequired(workspaceDescription),
    }),
  })
  .setRequired(true)
  .setDescription('Update workspace endpoint params.');
const updateWorkspaceResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(endpointStatusCodes.success)
    .setResponseHeaders(endpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateWorkspaceEndpointResult>()
        .setName('UpdateWorkspaceEndpointSuccessResult')
        .setFields({workspace})
        .setRequired(true)
        .setDescription('Update workspace endpoint success result.')
    ),
];

const deleteWorkspaceParams = new FieldObject<IDeleteWorkspaceEndpointParams>()
  .setName('DeleteWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Delete workspace endpoint params.');

export const addWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.addWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addWorkspaceParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addWorkspaceResult)
  .setName('Add Workspace Endpoint')
  .setDescription('Add workspace endpoint.');

export const getWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.getWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceResult)
  .setName('Get Workspace Endpoint')
  .setDescription('Get workspace endpoint.');

export const updateWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.updateWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateWorkspaceParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateWorkspaceResult)
  .setName('Update Workspace Endpoint')
  .setDescription('Update workspace endpoint.');

export const deleteWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.deleteWorkspace)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteWorkspaceParams))
  .setRequestHeaders(endpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('Delete Workspace Endpoint')
  .setDescription('Delete workspace endpoint.');
