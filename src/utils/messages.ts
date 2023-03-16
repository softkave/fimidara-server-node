export const appMessages = {
  entity: {
    notFound(id: string) {
      return `Permission entity with ID ${id} not found.`;
    },
  },
  token: {
    invalidCredentials: 'Invalid credentials.',
  },
  user: {
    notFound(id?: string) {
      return id ? `User with ID ${id} not found.` : 'User not found.';
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return id ? `Permission group with ID ${id} not found.` : 'Permission group not found.';
    },
  },
  permissionItem: {
    notFound(id?: string) {
      return id ? `Permission item with ID ${id} not found.` : 'Permission item not found.';
    },
  },
  collaborationRequest: {
    notFound(id?: string) {
      return id
        ? `Collaboration request with ID ${id} not found.`
        : 'Collaboration request not found.';
    },
  },
  folder: {
    notFound(id?: string) {
      return id ? `Folder with ID ${id} not found.` : 'Folder not found.';
    },
  },
  tag: {
    notFound(id?: string) {
      return id ? `Tag with ID ${id} not found.` : 'Tag not found.';
    },
  },
  usageRecord: {
    notFound(id?: string) {
      return id ? `Usage record with ID ${id} not found.` : 'Usage record not found.';
    },
  },
  file: {
    notFound(id?: string) {
      return id ? `File with ID ${id} not found.` : 'File not found.';
    },
  },
  appRuntimeState: {
    notFound() {
      return 'App runtime state not found.';
    },
  },
  agentToken: {
    notFound(id?: string) {
      return id ? `Agent token with ID ${id} not found.` : 'Agent token not found.';
    },
  },
  common: {
    notFound(id?: string) {
      return id ? `Resource with ID ${id} not found.` : 'Resource not found.';
    },
    permissionDenied(id?: string) {
      return id ? `Permission denied for resource with ID ${id}.` : 'Permission denied.';
    },
    notImplementedYet(fnName?: string) {
      return fnName ? `${fnName} not implemented yet.` : 'Not implemented yet.';
    },
  },
};
