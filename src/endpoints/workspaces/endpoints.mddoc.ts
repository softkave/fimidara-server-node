import {UsageRecordCategory} from '../../definitions/usageRecord';
import {
  IPublicWorkspace,
  IUsageThreshold,
  IUsageThresholdLock,
  WorkspaceBillStatus,
} from '../../definitions/workspace';
import {
  FieldBoolean,
  FieldNumber,
  FieldObject,
  FieldString,
  HttpEndpointDefinition,
  HttpEndpointMethod,
  HttpEndpointResponse,
  asFieldObjectAny,
  cloneAndMarkNotRequired,
  orUndefined,
} from '../../mddoc/mddoc';
import {
  endpointHttpResponseItems,
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointStatusCodes,
} from '../endpoints.mddoc';
import {IEndpointOptionalWorkspaceIDParam} from '../types';
import {IAddWorkspaceEndpointParams, IAddWorkspaceEndpointResult} from './addWorkspace/types';
import {workspaceConstants} from './constants';
import {IGetWorkspaceEndpointResult} from './getWorkspace/types';
import {
  IUpdateWorkspaceEndpointParams,
  IUpdateWorkspaceEndpointResult,
  IUpdateWorkspaceInput,
} from './updateWorkspace/types';

const workspaceDescription = new FieldString()
  .setRequired(true)
  .setDescription('Workspace description.')
  .setExample(
    'fimidara, a super awesome company that offers file management with access control for devs.'
  );
const usageRecordCategory = new FieldString()
  .setRequired(true)
  .setDescription('Usage record category.')
  .setExample(UsageRecordCategory.Storage)
  .setValid(Object.values(UsageRecordCategory))
  .setEnumName('UsageRecordCategory');
const price = new FieldNumber().setRequired(true).setDescription('Price in USD.').setExample(5);
const usageThreshold = new FieldObject<IUsageThreshold>().setName('UsageThreshold').setFields({
  lastUpdatedBy: fReusables.agent,
  lastUpdatedAt: fReusables.date,
  category: usageRecordCategory,
  budget: price,
});
const usageThresholdLock = new FieldObject<IUsageThresholdLock>()
  .setName('UsageThresholdLock')
  .setFields({
    lastUpdatedBy: fReusables.agent,
    lastUpdatedAt: fReusables.date,
    category: usageRecordCategory,
    locked: new FieldBoolean(
      true,
      'Flag for whether a certain usage category is locked or not.',
      false
    ),
  });
const workspace = new FieldObject<IPublicWorkspace>().setName('Workspace').setFields({
  resourceId: fReusables.id,
  workspaceId: fReusables.id,
  providedResourceId: fReusables.providedResourceIdOrUndefined,
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
      .setEnumName('WorkspaceBillStatus')
  ),
  usageThresholds: orUndefined(
    new FieldObject<IPublicWorkspace['usageThresholds']>()
      .setName('WorkspaceUsageThresholds')
      .setFields({
        [UsageRecordCategory.Storage]: orUndefined(usageThreshold),
        [UsageRecordCategory.BandwidthIn]: orUndefined(usageThreshold),
        [UsageRecordCategory.BandwidthOut]: orUndefined(usageThreshold),
        [UsageRecordCategory.Total]: orUndefined(usageThreshold),
      })
  ),
  usageThresholdLocks: orUndefined(
    new FieldObject<IPublicWorkspace['usageThresholdLocks']>()
      .setName('WorkspaceUsageThresholdLocks')
      .setFields({
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
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IAddWorkspaceEndpointResult>()
        .setName('AddWorkspaceEndpointSuccessResult')
        .setFields({workspace})
        .setRequired(true)
        .setDescription('Add workspace endpoint success result.')
    ),
];

const getWorkspaceParams = new FieldObject<IEndpointOptionalWorkspaceIDParam>()
  .setName('GetWorkspaceEndpointParams')
  .setFields({
    workspaceId: fReusables.workspaceIdInputNotRequired,
  })
  .setRequired(true)
  .setDescription('Get workspace endpoint params.');
const getWorkspaceResult = [
  endpointHttpResponseItems.errorResponse,
  new HttpEndpointResponse()
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
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
    .setStatusCode(mddocEndpointStatusCodes.success)
    .setResponseHeaders(mddocEndpointHttpHeaderItems.jsonResponseHeaders)
    .setResponseBody(
      new FieldObject<IUpdateWorkspaceEndpointResult>()
        .setName('UpdateWorkspaceEndpointSuccessResult')
        .setFields({workspace})
        .setRequired(true)
        .setDescription('Update workspace endpoint success result.')
    ),
];

const deleteWorkspaceParams = new FieldObject<IEndpointOptionalWorkspaceIDParam>()
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
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(addWorkspaceResult)
  .setName('AddWorkspaceEndpoint')
  .setDescription('Add workspace endpoint.');

export const getWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.getWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(getWorkspaceParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(getWorkspaceResult)
  .setName('GetWorkspaceEndpoint')
  .setDescription('Get workspace endpoint.');

export const updateWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.updateWorkspace)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(asFieldObjectAny(updateWorkspaceParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(updateWorkspaceResult)
  .setName('UpdateWorkspaceEndpoint')
  .setDescription('Update workspace endpoint.');

export const deleteWorkspaceEndpointDefinition = new HttpEndpointDefinition()
  .setBasePathname(workspaceConstants.routes.deleteWorkspace)
  .setMethod(HttpEndpointMethod.Delete)
  .setRequestBody(asFieldObjectAny(deleteWorkspaceParams))
  .setRequestHeaders(mddocEndpointHttpHeaderItems.jsonWithAuthRequestHeaders)
  .setResponses(endpointHttpResponseItems.emptyEndpointResponse)
  .setName('DeleteWorkspaceEndpoint')
  .setDescription('Delete workspace endpoint.');
