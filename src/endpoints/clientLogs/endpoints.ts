import {kEndpointTag} from '../types.js';
import {ingestLogsEndpointDefinition} from './endpoints.mddoc.js';
import ingestLogs from './ingestLogs/handler.js';
import {ClientLogsExportedEndpoints} from './types.js';

export function getClientLogsHttpEndpoints() {
  const clientLogsExportedEndpoints: ClientLogsExportedEndpoints = {
    ingestLogs: {
      tag: [kEndpointTag.private],
      fn: ingestLogs,
      mddocHttpDefinition: ingestLogsEndpointDefinition,
    },
  };
  return clientLogsExportedEndpoints;
}
