import {Endpoint} from '../../types.js';

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

export type IngestLogsEndpoint = Endpoint<IngestLogsEndpointParams>;
