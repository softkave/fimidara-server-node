import {
  ExportedHttpEndpointWithMddocDefinition,
  HttpEndpoint,
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
} from '../types';
import {IngestLogsEndpoint, IngestLogsEndpointParams} from './ingestLogs/types';

export type IngestLogsHttpEndpoint = HttpEndpoint<
  IngestLogsEndpoint,
  IngestLogsEndpointParams,
  {},
  HttpEndpointRequestHeaders_AuthRequired_ContentType,
  {}
>;

export type ClientLogsExportedEndpoints = {
  ingestLogs: ExportedHttpEndpointWithMddocDefinition<IngestLogsHttpEndpoint>;
};
