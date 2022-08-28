import {IUsageRecord} from '../../../definitions/usageRecord';
import {IWorkspaceSummedUsageQueryParams} from '../../contexts/data-providers/UsageRecordDataProvider';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IGetWorkspaceSummedUsageEndpointParams =
  IWorkspaceSummedUsageQueryParams;

export interface IGetWorkspaceSummedUsageEndpointResult {
  records: IUsageRecord[];
}

export type GetWorkspaceSummedUsageEndpoint = Endpoint<
  IBaseContext,
  IGetWorkspaceSummedUsageEndpointParams,
  IGetWorkspaceSummedUsageEndpointResult
>;
