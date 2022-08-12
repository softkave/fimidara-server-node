import {IUsageRecord} from '../../../definitions/usageRecord';
import {IBaseContext} from '../../contexts/BaseContext';
import {IWorkspaceSummedUsageQueryParams} from '../../contexts/data-providers/UsageRecordDataProvider';
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
