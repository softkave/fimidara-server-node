import {IBaseContext} from '../../contexts/types';
import {Endpoint, ICountItemsEndpointResult} from '../../types';
import {IGetWorkspaceSummedUsageEndpointParamsBase} from '../getWorkspaceSummedUsage/types';

export type ICountWorkspaceSummedUsageEndpointParams = IGetWorkspaceSummedUsageEndpointParamsBase;

export type CountWorkspaceSummedUsageEndpoint = Endpoint<
  IBaseContext,
  ICountWorkspaceSummedUsageEndpointParams,
  ICountItemsEndpointResult
>;
