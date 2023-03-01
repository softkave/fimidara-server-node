import {AnyObject} from '../../../utils/types';
import {IBaseContext} from '../../contexts/types';
import {Endpoint} from '../../types';

export type IClientLog = {
  timestamp: number;
  level: string;
  message: string;
  service: string;
  stack?: string;
} & AnyObject;

export interface IIngestLogsEndpointParams {
  logs: IClientLog[];
}

export type IngestLogsEndpoint = Endpoint<IBaseContext, IIngestLogsEndpointParams>;
