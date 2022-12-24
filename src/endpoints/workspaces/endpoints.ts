import {UsageRecordCategory} from '../../definitions/usageRecord';
import {IPublicWorkspace, IUsageThreshold, IUsageThresholdLock, WorkspaceBillStatus} from '../../definitions/workspace';
import {
  asFieldObjectAny,
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  orUndefined,
} from '../../mddoc/mddoc';
import {fReusables, httpHeaderItems, httpResponseItems} from '../endpoints';
import {IBaseEndpointResult} from '../types';
import {IAddWorkspaceEndpointParams, IAddWorkspaceEndpointResult} from './addWorkspace/types';
import {IDeleteWorkspaceEndpointParams} from './deleteWorkspace/types';
import {IGetWorkspaceEndpointParams, IGetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  IUpdateWorkspaceEndpointParams,
  IUpdateWorkspaceEndpointResult,
  IUpdateWorkspaceInput,
} from './updateWorkspace/types';

const workspaceDescription = new FieldString()
  .setRequired(true)
  .setDescription('Workspace description')
  .setExample('fimidara, a super awesome company that offers file management with access control for devs');
const usageRecordCategory = new FieldString()
  .setRequired(true)
  .setDescription('Usage record category')
  .setExample(UsageRecordCategory.Storage)
  .setValid(Object.values(UsageRecordCategory));
const price = new FieldNumber().setRequired(true).setDescription('Price in USD').setExample(5);
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
  locked: new FieldBoolean(true, 'Flag for whether a certain usage category is locked or not', false),
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
    description: orUndefined(workspaceDescription),
  })
  .setRequired(true);
const addWorkspaceResult = new FieldObject<IAddWorkspaceEndpointResult & IBaseEndpointResult>()
  .setName('AddWorkspaceEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    workspace: orUndefined(workspace),
  })
  .setRequired(true)
  .setDescription('Add workspace endpoint result');
const getWorkspaceParams = new FieldObject<IGetWorkspaceEndpointParams>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.id,
  })
  .setRequired(true);
const getWorkspaceResult = new FieldObject<IGetWorkspaceEndpointResult & IBaseEndpointResult>()
  .setName('GetWorkspaceEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    workspace: orUndefined(workspace),
  })
  .setRequired(true)
  .setDescription('Get workspace endpoint result');
const updateWorkspaceParams = new FieldObject<IUpdateWorkspaceEndpointParams>()
  .setName('UpdateWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.id,
    workspace: new FieldObject<IUpdateWorkspaceInput>().setName('UpdateWorkspaceInput').setFields({
      name: fReusables.workspaceNameOrUndefined,
      description: orUndefined(workspaceDescription),
    }),
  })
  .setRequired(true);
const updateWorkspaceResult = new FieldObject<IUpdateWorkspaceEndpointResult & IBaseEndpointResult>()
  .setName('UpdateWorkspaceEndpointResult')
  .setFields({
    ...httpResponseItems.responseWithErrorRaw,
    workspace: orUndefined(workspace),
  })
  .setRequired(true)
  .setDescription('Update workspace endpoint result');
const deleteWorkspaceParams = new FieldObject<IDeleteWorkspaceEndpointParams>()
  .setName('DeleteWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.id,
  })
  .setRequired(true);

export const addWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/workspaces/addWorkspace')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(addWorkspaceParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(addWorkspaceResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const getWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/workspaces/getWorkspace')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(getWorkspaceResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const updateWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/workspaces/updateWorkspace')
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateWorkspaceParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(asFieldObjectAny(updateWorkspaceResult))
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);

export const deleteWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname('/workspaces/deleteWorkspace')
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteWorkspaceParams))
  .setRequestHeaders(httpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponseBody(httpResponseItems.defaultResponse)
  .setResponseHeaders(httpHeaderItems.jsonResponseHeaders);
