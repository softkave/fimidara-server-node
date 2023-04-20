import {ExportedHttpEndpoint} from '../types';
import {GetUsageCostsEndpoint} from './getUsageCosts/types';
import {GetWorkspaceSummedUsageEndpoint} from './getWorkspaceSummedUsage/types';

export type UsageRecordsExportedEndpoints = {
  getUsageCosts: ExportedHttpEndpoint<GetUsageCostsEndpoint>;
  getWorkspaceSummedUsage: ExportedHttpEndpoint<GetWorkspaceSummedUsageEndpoint>;
};
