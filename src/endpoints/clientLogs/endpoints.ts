import {ingestLogsEndpointDefinition} from './endpoints.mddoc';
import ingestLogs from './ingestLogs/handler';
import {ClientLogsExportedPrivateEndpoints} from './types';

export function getClientLogsPrivateHttpEndpoints() {
  const clientLogsExportedEndpoints: ClientLogsExportedPrivateEndpoints = {
    ingestLogs: {
      fn: ingestLogs,
      mddocHttpDefinition: ingestLogsEndpointDefinition,
    },
  };
  return clientLogsExportedEndpoints;
}
