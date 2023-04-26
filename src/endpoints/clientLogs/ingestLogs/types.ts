import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export type ClientLog = {
  timestamp: number;
  level: string;
  message: string;
  service: string;
  stack?: string;
};

export interface IngestLogsEndpointParams {
  logs: ClientLog[];
}

export type IngestLogsEndpoint = Endpoint<BaseContextType, IngestLogsEndpointParams>;
