import {PublicUsageRecord, UsageRecordCategoryMap} from '../../definitions/usageRecord';
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
import {usageRecordConstants} from './constants';
import {CountWorkspaceSummedUsageEndpointParams} from './countWorkspaceSummedUsage/types';
import {GetUsageCostsEndpointResult} from './getUsageCosts/types';
import {
  GetWorkspaceSummedUsageEndpointParams,
  GetWorkspaceSummedUsageEndpointResult,
  WorkspaceSummedUsageQuery,
} from './getWorkspaceSummedUsage/types';
import {
  CountWorkspaceSummedUsageHttpEndpoint,
  GetUsageCostsHttpEndpoint,
  GetWorkspaceSummedUsageHttpEndpoint,
} from './types';

const cost = mddocConstruct.constructFieldNumber().setDescription('Usage cost in USD');
const month = mddocConstruct
  .constructFieldNumber()
  .setDescription('Usage recording month from 0-11, January-Decemeber');
const year = mddocConstruct.constructFieldNumber().setDescription('Usage recording year');
const usage = mddocConstruct
  .constructFieldNumber()
  .setDescription(
    `Usage amount. Bytes for ${UsageRecordCategoryMap.Storage}, ${UsageRecordCategoryMap.BandwidthIn}, and ${UsageRecordCategoryMap.BandwidthOut}. Always 0 for ${UsageRecordCategoryMap.Total}, use \`usageCost\` instead.`
  );
const usageCosts = mddocConstruct
  .constructFieldObject<GetUsageCostsEndpointResult['costs']>()
  .setName('UsageCosts')
  .setFields({
    [UsageRecordCategoryMap.Storage]: mddocConstruct.constructFieldObjectField(
      true,
      cost
    ),
    [UsageRecordCategoryMap.BandwidthIn]: mddocConstruct.constructFieldObjectField(
      true,
      cost
    ),
    [UsageRecordCategoryMap.BandwidthOut]: mddocConstruct.constructFieldObjectField(
      true,
      cost
    ),
    [UsageRecordCategoryMap.Total]: mddocConstruct.constructFieldObjectField(true, cost),
  });

const summedUsageQuery = mddocConstruct
  .constructFieldObject<WorkspaceSummedUsageQuery>()
  .setName('SummedUsageQuery')
  .setFields({
    category: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.usageCategoryOrList
    ),
    fromDate: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    toDate: mddocConstruct.constructFieldObjectField(false, fReusables.date),
    fulfillmentStatus: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.usageFulfillmentStatusOrList
    ),
  });

const usageRecord = mddocConstruct
  .constructFieldObject<PublicUsageRecord>()
  .setName('UsageRecord')
  .setFields({
    resourceId: mddocConstruct.constructFieldObjectField(true, fReusables.id),
    createdBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    createdAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    category: mddocConstruct.constructFieldObjectField(true, fReusables.usageCategory),
    usage: mddocConstruct.constructFieldObjectField(true, usage),
    usageCost: mddocConstruct.constructFieldObjectField(true, cost),
    fulfillmentStatus: mddocConstruct.constructFieldObjectField(
      true,
      fReusables.usageFulfillmentStatus
    ),
    month: mddocConstruct.constructFieldObjectField(true, month),
    year: mddocConstruct.constructFieldObjectField(true, year),
    lastUpdatedBy: mddocConstruct.constructFieldObjectField(true, fReusables.agent),
    lastUpdatedAt: mddocConstruct.constructFieldObjectField(true, fReusables.date),
    workspaceId: mddocConstruct.constructFieldObjectField(true, fReusables.workspaceId),
  });

const getWorkspaceSummedUsageParams = mddocConstruct
  .constructFieldObject<GetWorkspaceSummedUsageEndpointParams>()
  .setName('GetWorkspaceSummedUsageEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    page: mddocConstruct.constructFieldObjectField(false, fReusables.page),
    pageSize: mddocConstruct.constructFieldObjectField(false, fReusables.pageSize),
    query: mddocConstruct.constructFieldObjectField(false, summedUsageQuery),
  });
const getWorkspaceSummedUsageResponseBody = mddocConstruct
  .constructFieldObject<GetWorkspaceSummedUsageEndpointResult>()
  .setName('GetWorkspaceSummedUsageEndpointResult')
  .setFields({
    records: mddocConstruct.constructFieldObjectField(
      true,
      mddocConstruct.constructFieldArray<PublicUsageRecord>().setType(usageRecord)
    ),
    page: mddocConstruct.constructFieldObjectField(true, fReusables.page),
  });
const countWorkspaceSummedUsageParams = mddocConstruct
  .constructFieldObject<CountWorkspaceSummedUsageEndpointParams>()
  .setName('CountWorkspaceSummedUsageEndpointParams')
  .setFields({
    workspaceId: mddocConstruct.constructFieldObjectField(
      false,
      fReusables.workspaceIdInput
    ),
    query: mddocConstruct.constructFieldObjectField(false, summedUsageQuery),
  });
const getUsageCostsResponseBody = mddocConstruct
  .constructFieldObject<GetUsageCostsEndpointResult>()
  .setName('GetUsageCostsEndpointResult')
  .setFields({costs: mddocConstruct.constructFieldObjectField(true, usageCosts)});
export const getUsageCostsEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetUsageCostsHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetUsageCostsHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<GetUsageCostsHttpEndpoint['mddocHttpDefinition']['query']>,
    InferFieldObjectOrMultipartType<
      GetUsageCostsHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetUsageCostsHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<GetUsageCostsHttpEndpoint['mddocHttpDefinition']['responseBody']>
  >()
  .setBasePathname(usageRecordConstants.routes.getUsageCosts)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getUsageCostsResponseBody)
  .setName('GetUsageCostsEndpoint');

export const getWorkspaceSummedUsageEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      GetWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(usageRecordConstants.routes.getWorkspaceSummedUsage)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(getWorkspaceSummedUsageParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(getWorkspaceSummedUsageResponseBody)
  .setName('GetWorkspaceSummedUsageEndpoint');

export const countWorkspaceSummedUsageEndpointDefinition = mddocConstruct
  .constructHttpEndpointDefinition<
    InferFieldObjectType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['requestHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['pathParamaters']
    >,
    InferFieldObjectType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['query']
    >,
    InferFieldObjectOrMultipartType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['requestBody']
    >,
    InferFieldObjectType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['responseHeaders']
    >,
    InferFieldObjectType<
      CountWorkspaceSummedUsageHttpEndpoint['mddocHttpDefinition']['responseBody']
    >
  >()
  .setBasePathname(usageRecordConstants.routes.countWorkspaceSummedUsage)
  .setMethod(HttpEndpointMethod.Post)
  .setRequestBody(countWorkspaceSummedUsageParams)
  .setRequestHeaders(
    mddocEndpointHttpHeaderItems.requestHeaders_AuthRequired_JsonContentType
  )
  .setResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
  .setResponseBody(mddocEndpointHttpResponseItems.countResponseBody)
  .setName('CountWorkspaceSummedUsageEndpoint');
