import {Folder} from '../../../definitions/folder';
import {
  AppResourceTypeMap,
  PERMISSION_AGENT_TYPES,
  SessionAgent,
} from '../../../definitions/system';
import {Workspace} from '../../../definitions/workspace';
import {validate} from '../../../utils/validate';
import {kSemanticModels} from '../../contexts/injectables';
import {fileListExtractor} from '../../files/utils';
import {
  getInternalPaginationQuery,
  paginationToContinuationToken,
} from '../../pagination';
import {
  FileProviderContinuationTokensByMount,
  folderListExtractor,
  ingestFolderFilesByFolderpath,
  ingestFolderFoldersByFolderpath,
} from '../utils';
import {
  ListFolderContentEndpoint,
  ListFolderContentEndpointContinuationToken,
} from './types';
import {getWorkspaceAndParentFolder, listFolderContentQuery} from './utils';
import {listFolderContentJoiSchema} from './validation';

const listFolderContent: ListFolderContentEndpoint = async (context, instData) => {
  const data = validate(instData.data, listFolderContentJoiSchema);
  const agent = await context.session.getAgent(context, instData, PERMISSION_AGENT_TYPES);
  const {workspace, parentFolder} = await getWorkspaceAndParentFolder(
    context,
    agent,
    data
  );

  const pagination =
    getInternalPaginationQuery<ListFolderContentEndpointContinuationToken>(data);
  const contentType = data.contentType ?? [
    AppResourceTypeMap.File,
    AppResourceTypeMap.Folder,
  ];

  const [
    {folders, continuationToken: foldersContinuationToken},
    {files, continuationToken: filesContinuationToken},
  ] = await Promise.all([
    contentType.includes(AppResourceTypeMap.Folder)
      ? fetchFolders(
          agent,
          workspace,
          parentFolder,
          pagination.token?.folders || {},
          pagination.pageSize
        )
      : ({} as Partial<Awaited<ReturnType<typeof fetchFolders>>>),
    contentType.includes(AppResourceTypeMap.File)
      ? fetchFiles(
          agent,
          workspace,
          parentFolder,
          pagination.token?.files || {},
          pagination.pageSize
        )
      : ({} as Partial<Awaited<ReturnType<typeof fetchFiles>>>),
  ]);

  const continuation: ListFolderContentEndpointContinuationToken = {
    files: filesContinuationToken,
    folders: foldersContinuationToken,
  };

  return {
    folders: folderListExtractor(folders ?? []),
    files: fileListExtractor(files ?? []),
    page: pagination.page++,
    continuationToken: paginationToContinuationToken({
      token: continuation,
    }),
  };
};

async function fetchFolders(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  continuation: FileProviderContinuationTokensByMount,
  max: number
) {
  const query = await listFolderContentQuery(
    agent,
    workspace,
    AppResourceTypeMap.Folder,
    parentFolder
  );

  return await kSemanticModels
    .utils()
    .withTxn(opts =>
      ingestFolderFoldersByFolderpath(
        agent,
        parentFolder,
        opts,
        workspace.resourceId,
        continuation,
        max
      )
    );
}

async function fetchFiles(
  agent: SessionAgent,
  workspace: Workspace,
  parentFolder: Folder | null,
  continuation: FileProviderContinuationTokensByMount,
  max: number
) {
  const query = await listFolderContentQuery(
    agent,
    workspace,
    AppResourceTypeMap.File,
    parentFolder
  );

  return await kSemanticModels
    .utils()
    .withTxn(opts =>
      ingestFolderFilesByFolderpath(
        agent,
        parentFolder,
        opts,
        workspace.resourceId,
        continuation,
        max
      )
    );
}

export default listFolderContent;
