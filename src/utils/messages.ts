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
      return id ? `User with ID ${id} does not exist.` : 'User does not exist.';
    },
  },
  clientToken: {
    notFound(id?: string) {
      return id
        ? `Client assigned token with ID ${id} does not exist.`
        : 'Client assigned token does not exist.';
    },
  },
  programToken: {
    notFound(id?: string) {
      return id
        ? `Program access token with ID ${id} does not exist.`
        : 'Program access token does not exist.';
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return id
        ? `Permission group with ID ${id} does not exist.`
        : 'Permission group does not exist.';
    },
  },
  collaborationRequest: {
    notFound(id?: string) {
      return id
        ? `Collaboration request with ID ${id} does not exist.`
        : 'Collaboration request does not exist.';
    },
  },
  folder: {
    notFound(id?: string) {
      return id ? `Folder with ID ${id} does not exist.` : 'Folder does not exist.';
    },
  },
  tag: {
    notFound(id?: string) {
      return id ? `Tag with ID ${id} does not exist.` : 'Tag does not exist.';
    },
  },
  usageRecord: {
    notFound(id?: string) {
      return id ? `Usage record with ID ${id} does not exist.` : 'Usage record does not exist.';
    },
  },
  file: {
    notFound(id?: string) {
      return id ? `File with ID ${id} does not exist.` : 'File does not exist.';
    },
  },
  appRuntimeState: {
    notFound() {
      return 'App runtime state not found.';
    },
  },
};
