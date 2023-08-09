import {ExportedHttpEndpointWithMddocDefinition} from '../types';
import {IngestLogsEndpoint} from './ingestLogs/types';

export type IngestLogsHttpEndpoint = ExportedHttpEndpointWithMddocDefinition<IngestLogsEndpoint>;

export type ClientLogsExportedPrivateEndpoints = {
  ingestLogs: IngestLogsHttpEndpoint;
};
