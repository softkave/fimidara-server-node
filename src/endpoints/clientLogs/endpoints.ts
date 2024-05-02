import {ingestLogsEndpointDefinition} from './endpoints.mddoc.js';
import ingestLogs from './ingestLogs/handler.js';
import {ClientLogsExportedPrivateEndpoints} from './types.js';

export function getClientLogsPrivateHttpEndpoints() {
  const clientLogsExportedEndpoints: ClientLogsExportedPrivateEndpoints = {
    ingestLogs: {
      fn: ingestLogs,
      mddocHttpDefinition: ingestLogsEndpointDefinition,
    },
  };
  return clientLogsExportedEndpoints;
}
