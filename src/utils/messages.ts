import {multilineTextToParagraph} from './fns.js';

export const kAppMessages = {
  workspace: {
    notFound(id?: string) {
      return id ? `Workspace with ID ${id} not found` : 'Workspace not found';
    },
    noRootname() {
      return 'Workspace rootname not provided';
    },
    withRootnameNotFound(rootname?: string) {
      return rootname
        ? `Workspace with rootname ${rootname} not found`
        : 'Workspace not found';
    },
    rootnameDoesNotMatchFolderRootname: (
      rootname: string,
      rootname02: string
    ) =>
      `Workspace rootname ${rootname} does not match folder rootname ${rootname02}`,
    workspaceExists() {
      return 'Workspace exists';
    },
  },
  entity: {
    notFound(id: string) {
      return `Permission entity with ID ${id} not found`;
    },
  },
  token: {
    invalidCredentials: 'Invalid credentials',
  },
  user: {
    notFound(id?: string) {
      return id ? `User with ID ${id} not found` : 'User not found';
    },
    changePassword() {
      return 'Please change your password to continue';
    },
    userIsOnWaitlist() {
      return multilineTextToParagraph(`
      Sorry you cannot perform this action because you are on the waitlist.
      Once you're removed from the waitlist, we'll send you an email confirming you 
      have full access to fimidara`);
    },
  },
  permissionGroup: {
    notFound(id?: string) {
      return id
        ? `Permission group with ID ${id} not found`
        : 'Permission group not found';
    },
  },
  permissionItem: {
    notFound(id?: string) {
      return id
        ? `Permission item with ID ${id} not found`
        : 'Permission item not found';
    },
  },
  collaborationRequest: {
    notFound(id?: string) {
      return id
        ? `Collaboration request with ID ${id} not found`
        : 'Collaboration request not found';
    },
  },
  folder: {
    notFound(id?: string) {
      return id ? `Folder with ID ${id} not found` : 'Folder not found';
    },
    exists: 'Folder exists',
  },
  tag: {
    notFound(id?: string) {
      return id ? `Tag with ID ${id} not found` : 'Tag not found';
    },
  },
  usageRecord: {
    notFound(id?: string) {
      return id
        ? `Usage record with ID ${id} not found`
        : 'Usage record not found';
    },
  },
  file: {
    notFound(id?: string) {
      return id ? `File with ID ${id} not found` : 'File not found';
    },
    invalidMatcher: 'Invalid matcher',
    provideNamepath: 'Please provide a namepath',
    multipleVolumeSeparators:
      "Supplied path has multiple volume separators ':'",
    unknownBackend(backend: string) {
      return backend ? `Backend ${backend} unknown` : 'Backend unknown';
    },
  },
  appRuntimeState: {
    notFound() {
      return 'App runtime state not found';
    },
  },
  agentToken: {
    notFound(id?: string) {
      return id
        ? `Agent token with ID ${id} not found`
        : 'Agent token not found';
    },
    withIdExists(id?: string) {
      return id ? `Agent token with ID ${id} exists` : 'Agent token exists';
    },
    withProvidedIdExists(id?: string) {
      return id
        ? `Agent token with provided ID ${id} exists`
        : 'Agent token exists';
    },
  },
  common: {
    notFound(id?: string) {
      return id ? `Resource with ID ${id} not found` : 'Resource not found';
    },
    permissionDenied(id?: string) {
      return id
        ? `Permission denied for resource with ID ${id}`
        : 'Permission denied';
    },
    notImplementedYet(fnName?: string) {
      return fnName ? `${fnName} not implemented yet` : 'Not implemented yet';
    },
    invalidState(state?: string) {
      return state
        ? `Program is in an invalid state:\n ${state}`
        : 'Program is in an invalid state';
    },
  },
  job: {
    notFound(id?: string) {
      return id ? `Job with ID ${id} not found` : 'Job not found';
    },
  },
  config: {
    notFound(id?: string) {
      return id ? `Config with ID ${id} not found` : 'Config not found';
    },
    configInUse(mountsCount: number) {
      return `Config already in use by ${mountsCount} ${
        mountsCount === 1 ? 'mount' : 'mounts'
      }`;
    },
    configExists: 'Config exists',
    configNameExists(name: string) {
      return name ? `Config with name ${name} exists` : 'Config name exists';
    },
    fimidaraDoesNotSupportConfig: 'fimidara does not support this config',
  },
  mount: {
    mountExists: 'Mount exists',
    s3MountSourceMissingBucket: 'S3 mount source missing bucket',
    cannotMountFimidaraExplicitly: 'Cannot mount fimidara explicitly',
    cannotDeleteFimidaraMount: 'Cannot delete fimidara mount',
    cannotUpdateFimidaraMount: 'Cannot update fimidara mount',
    notFound(id?: string) {
      return id ? `Mount with ID ${id} not found` : 'Mount not found';
    },
    mountNameExists(name?: string) {
      return name ? `Mount with name ${name} exists` : 'Mount name exists';
    },
    configMountBackendMismatch: (configBackend: string, mountBackend: string) =>
      `Config for backend ${configBackend} cannot be used for mount with backend ${mountBackend}`,
    exactMountConfigExists: (
      mountedFrom: string,
      folderpath: string,
      backend: string
    ) =>
      `Mount exists from ${mountedFrom} to ${folderpath} with backend ${backend}`,
    mountsNotSetup: 'File backend mounts not setup',
    mountSourceMissingBucket: 'Mount source missing bucket',
  },
  email: {
    // TODO: add support email address they can reach out to
    emailIsInBlocklist: 'Email address in blocklist',
  },
};
