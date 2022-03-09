import {defaultTo, merge, omit} from 'lodash';
import {IFolder} from '../../../definitions/folder';
import {IOrganization} from '../../../definitions/organization';
import {
  AppResourceType,
  BasicCRUDActions,
  IAgent,
  IPublicAccessOp,
  ISessionAgent,
} from '../../../definitions/system';
import {compactPublicAccessOps} from '../../../definitions/utils';
import {getDate, getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
  checkAuthorization,
  getFilePermissionOwners,
  makeOrgPermissionOwnerList,
} from '../../contexts/authorization-checks/checkAuthorizaton';
import {IBaseContext} from '../../contexts/BaseContext';
import {getOrganizationId} from '../../contexts/SessionContext';
import {fileConstants} from '../../files/constants';
import {updatePublicPresetAccessOps} from '../../permissionItems/utils';
import EndpointReusableQueries from '../../queries';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {
  assertSplitPathWithDetails,
  FolderUtils,
  splitPathWithDetails,
} from '../utils';
import {AddFolderEndpoint, INewFolderInput} from './types';
import {addFolderJoiSchema} from './validation';

export async function createSingleFolder(
  context: IBaseContext,
  agent: IAgent,
  organization: IOrganization,
  parent: IFolder | null,
  input: INewFolderInput
) {
  const {splitPath, name} = splitPathWithDetails(input.path);
  const existingFolder = await context.data.folder.getItem(
    FolderQueries.folderExistsByNamePath(organization.resourceId, splitPath)
  );

  if (existingFolder) {
    return existingFolder;
  }

  const folderId = getNewId();
  let publicAccessOps: IPublicAccessOp[] = input.publicAccessOps
    ? input.publicAccessOps.map(op => ({
        ...op,
        markedAt: getDate(),
        markedBy: agent,
      }))
    : [];

  // if (input.inheritParentPublicAccessOps && parent) {
  //   publicAccessOps = publicAccessOps.concat(parent.publicAccessOps);
  // }

  publicAccessOps = compactPublicAccessOps(publicAccessOps);
  const savedFolder = await context.data.folder.saveItem({
    name,
    publicAccessOps,
    organizationId: organization.resourceId,
    resourceId: folderId,
    parentId: parent?.resourceId,
    idPath: parent ? parent.idPath.concat(folderId) : [folderId],
    namePath: parent ? parent.namePath.concat(name) : [name],
    createdAt: getDateString(),
    createdBy: agent,
    description: input.description,
    maxFileSizeInBytes:
      input.maxFileSizeInBytes || fileConstants.maxFileSizeInBytes,
  });

  await updatePublicPresetAccessOps(
    context,
    agent,
    organization,
    savedFolder.resourceId,
    AppResourceType.Folder,
    publicAccessOps,
    []
  );

  return savedFolder;
}

export async function getClosestExistingFolder(
  context: IBaseContext,
  organizationId: string,
  splitParentPath: string[]
) {
  const existingFolders = await Promise.all(
    splitParentPath.map((p, i) => {
      return context.data.folder.getItem(
        FolderQueries.getByNamePath(
          organizationId,
          splitParentPath.slice(0, i + 1)
        )
      );
    })
  );

  const firstNullItemIndex = existingFolders.findIndex(folder => !folder);
  const closestExistingFolderIndex =
    firstNullItemIndex === -1
      ? existingFolders.length - 1
      : firstNullItemIndex - 1;

  const closestExistingFolder = existingFolders[closestExistingFolderIndex];
  return {closestExistingFolder, closestExistingFolderIndex, existingFolders};
}

export async function createFolderList(
  context: IBaseContext,
  agent: ISessionAgent,
  organization: IOrganization,
  input: INewFolderInput
) {
  const pathWithDetails = assertSplitPathWithDetails(input.path);
  const {closestExistingFolderIndex, closestExistingFolder, existingFolders} =
    await getClosestExistingFolder(
      context,
      organization.resourceId,
      pathWithDetails.splitPath
    );

  let previousFolder = closestExistingFolder;
  let hasCheckAuth = false;

  // TODO: create folders in a transaction and revert if there's an error
  for (
    let i = closestExistingFolderIndex + 1;
    i < pathWithDetails.splitPath.length;
    i++
  ) {
    if (existingFolders[i]) {
      previousFolder = existingFolders[i];
      continue;
    }

    if (!hasCheckAuth) {
      // Check if the agent can perform operation
      await checkAuthorization({
        context,
        agent,
        organization,
        type: AppResourceType.Folder,
        permissionOwners: previousFolder
          ? getFilePermissionOwners(organization.resourceId, previousFolder)
          : makeOrgPermissionOwnerList(organization.resourceId),
        action: BasicCRUDActions.Create,
      });

      hasCheckAuth = true;
    }

    // The main folder we want to create
    const isMainFolder = i === pathWithDetails.splitPath.length - 1;
    const nextInputPath = pathWithDetails.splitPath.slice(0, i + 1);
    let nextInput: INewFolderInput = {
      path: nextInputPath.join(folderConstants.nameSeparator),
    };

    if (isMainFolder) {
      merge(nextInput, omit(input, 'path'));
    }

    previousFolder = await createSingleFolder(
      context,
      agent,
      organization,
      previousFolder,
      nextInput
    );
  }

  if (!previousFolder) {
    // TODO: better error message
    throw new ServerError('Error creating folder');
  }

  return previousFolder;
}

// TODO: Currently doesn't throw error if the folder already exists, do we want to change that behavior?
const addFolder: AddFolderEndpoint = async (context, instData) => {
  const data = validate(instData.data, addFolderJoiSchema);
  const agent = await context.session.getAgent(context, instData);
  const organizationId = getOrganizationId(agent, data.organizationId);
  const organization = await context.data.organization.assertGetItem(
    EndpointReusableQueries.getById(organizationId)
  );

  const folder = await createFolderList(
    context,
    agent,
    organization,
    data.folder
  );

  return {
    folder: FolderUtils.getPublicFolder(folder),
  };
};

export default addFolder;
