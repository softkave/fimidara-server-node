import {PublicUsageRecord, UsageRecordCategory} from '../../definitions/usageRecord';
import {
  FieldArray,
  FieldNumber,
  FieldObject,
  HttpEndpointDefinition,
  HttpEndpointMethod,
} from '../../mddoc/mddoc';
import {
  fReusables,
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints.mddoc';
import {
  CountItemsEndpointResult,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  HttpEndpointResponseHeaders_ContentType_ContentLength,
} from '../types';
import {usageRecordConstants} from './constants';
import {CountWorkspaceSummedUsageEndpointParams} from './countWorkspaceSummedUsage/types';
import {GetUsageCostsEndpointResult} from './getUsageCosts/types';
import {
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  WorkspaceSummedUsageQuery,
} from './getWorkspaceSummedUsage/types';

const cost = FieldNumber.construct().setDescription('Usage cost in USD.');
const month = FieldNumber.construct().setDescription(
  'Usage recording month from 0-11, January-Decemeber.'
);
const year = FieldNumber.construct().setDescription('Usage recording year.');
const usage = FieldNumber.construct().setDescription(
  `Usage amount. Bytes for ${UsageRecordCategory.Storage}, ${UsageRecordCategory.BandwidthIn}, and ${UsageRecordCategory.BandwidthOut}. Always 0 for ${UsageRecordCategory.Total}, use \`usageCost\` instead.`
);
const usageCosts = FieldObject.construct<GetUsageCostsEndpointResult['costs']>()
  .setName('UsageCosts')
  .setFields({
    [UsageRecordCategory.Storage]: FieldObject.requiredField(cost),
    [UsageRecordCategory.BandwidthIn]: FieldObject.requiredField(cost),
    [UsageRecordCategory.BandwidthOut]: FieldObject.requiredField(cost),
    [UsageRecordCategory.Total]: FieldObject.requiredField(cost),
  });

const summedUsageQuery = FieldObject.construct<WorkspaceSummedUsageQuery>()
  .setName('SummedUsageQuery')
  .setFields({
    category: FieldObject.optionalField(FieldArray.construct().setType(fReusables.usageCategory)),
    fromDate: FieldObject.optionalField(fReusables.date),
    toDate: FieldObject.optionalField(fReusables.date),
    fulfillmentStatus: FieldObject.optionalField(
      FieldArray.construct().setType(fReusables.usageFulfillmentStatus)
    ),
  });

const usageRecord = FieldObject.construct<PublicUsageRecord>()
  .setName('UsageRecord')
  .setFields({
    resourceId: FieldObject.requiredField(fReusables.id),
    createdBy: FieldObject.requiredField(fReusables.agent),
    createdAt: FieldObject.requiredField(fReusables.date),
    category: FieldObject.requiredField(fReusables.usageCategory),
    usage: FieldObject.requiredField(usage),
    usageCost: FieldObject.requiredField(cost),
    fulfillmentStatus: FieldObject.requiredField(fReusables.usageFulfillmentStatus),
    month: FieldObject.requiredField(month),
    year: FieldObject.requiredField(year),
    providedResourceId: FieldObject.optionalField(fReusables.providedResourceId),
    lastUpdatedBy: FieldObject.requiredField(fReusables.agent),
    lastUpdatedAt: FieldObject.requiredField(fReusables.date),
    workspaceId: FieldObject.requiredField(fReusables.workspaceId),
  });

const getWorkspaceSummedUsageParams = FieldObject.construct<GetWorkspaceSummedUsageEndpointParams>()
  .setName('GetWorkspaceSummedUsageEndpointParams')
  .setFields({
    workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
    page: FieldObject.optionalField(fReusables.page),
    pageSize: FieldObject.optionalField(fReusables.pageSize),
    query: FieldObject.optionalField(summedUsageQuery),
  })
  .setRequired(true)
  .setDescription('Get workspace summed usage records endpoint params.');
const getWorkspaceSummedUsageResponseBody =
  FieldObject.construct<GetWorkspaceSummedUsageEndpointResult>()
    .setName('GetWorkspaceSummedUsageEndpointResult')
    .setFields({
      records: FieldObject.requiredField(
        FieldArray.construct<PublicUsageRecord>().setType(usageRecord)
      ),
      page: FieldObject.requiredField(fReusables.page),
    })
    .setRequired(true)
    .setDescription('Get workspace summed usage records endpoint success result.');

const countWorkspaceSummedUsageParams =
  FieldObject.construct<CountWorkspaceSummedUsageEndpointParams>()
    .setName('CountWorkspaceSummedUsageEndpointParams')
    .setFields({
      workspaceId: FieldObject.optionalField(fReusables.workspaceIdInput),
      query: FieldObject.optionalField(summedUsageQuery),
    })
    .setRequired(true)
    .setDescription('Count workspace summed usage records endpoint params.');

const getUsageCostsResponseBody = FieldObject.construct<GetUsageCostsEndpointResult>()
  .setName('GetUsageCostsEndpointResult')
  .setFields({costs: FieldObject.requiredField(usageCosts)})
  .setRequired(true)
  .setDescription('Get usage costs endpoint success result.');

export const getUsageCostsEndpointDefinition = HttpEndpointDefinition.construct<{
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetUsageCostsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(usageRecordConstants.routes.getUsageCosts)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUsageCostsResponseBody)
  .setName('GetUsageCostsEndpoint')
  .setDescription('Get usage costs endpoint.');

export const getWorkspaceSummedUsageEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: GetWorkspaceSummedUsageEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: GetWorkspaceSummedUsageEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(usageRecordConstants.routes.getWorkspaceSummedUsage)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceSummedUsageParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceSummedUsageResponseBody)
  .setName('GetWorkspaceSummedUsageEndpoint')
  .setDescription('Get workspace summed usage records endpoint.');

export const countWorkspaceSummedUsageEndpointDefinition = HttpEndpointDefinition.construct<{
  requestBody: CountWorkspaceSummedUsageEndpointParams;
  requestHeaders: HttpEndpointRequestHeaders_AuthRequired_ContentType;
  responseBody: CountItemsEndpointResult;
  responseHeaders: HttpEndpointResponseHeaders_ContentType_ContentLength;
}>()
  .setBasePathname(usageRecordConstants.routes.countWorkspaceSummedUsage)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceSummedUsageParams)
  .setRequestHeaders(mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType)
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceSummedUsageEndpoint')
  .setDescription('Count workspace summed usage records endpoint.');
