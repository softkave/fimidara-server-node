import {IBaseContext} from '../../contexts/BaseContext';
import {Endpoint} from '../../types';

export interface IClientLog {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  stack?: string;
}

export interface IIngestLogsEndpointParams {
  logs: IClientLog[];
}

export type IngestLogsEndpoint = Endpoint<
  IBaseContext,
  IIngestLogsEndpointParams
>;
