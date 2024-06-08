import {ExportedHttpEndpointWithMddocDefinition} from '../types.js';
import {IngestLogsEndpoint} from './ingestLogs/types.js';

export type IngestLogsHttpEndpoint =
  ExportedHttpEndpointWithMddocDefinition<IngestLogsEndpoint>;

export type ClientLogsExportedPrivateEndpoints = {
  ingestLogs: IngestLogsHttpEndpoint;
};
