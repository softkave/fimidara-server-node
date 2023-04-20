import {ExportedHttpEndpoint} from '../types';
import {IngestLogsEndpoint} from './ingestLogs/types';

export type ClientLogsExportedEndpoints = {
  ingestLogs: ExportedHttpEndpoint<IngestLogsEndpoint>;
};
