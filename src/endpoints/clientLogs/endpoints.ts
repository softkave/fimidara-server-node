import {ingestLogsEndpointDefinition} from './endpoints.mddoc';
import ingestLogs from './ingestLogs/handler';
import {ClientLogsExportedEndpoints} from './types';

export function getClientLogsPublicHttpEndpoints() {
  const clientLogsExportedEndpoints: ClientLogsExportedEndpoints = {
    ingestLogs: {
      fn: ingestLogs,
      mddocHttpDefinition: ingestLogsEndpointDefinition,
    },
  };
  return clientLogsExportedEndpoints;
}
