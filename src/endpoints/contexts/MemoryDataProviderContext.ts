import {IAssignedItem} from '../../definitions/assignedItem';
import {IClientAssignedToken} from '../../definitions/clientAssignedToken';
import {ICollaborationRequest} from '../../definitions/collaborationRequest';
import {IFile} from '../../definitions/file';
import {IFolder} from '../../definitions/folder';
import {IPermissionGroup} from '../../definitions/permissionGroups';
import {IPermissionItem} from '../../definitions/permissionItem';
import {IProgramAccessToken} from '../../definitions/programAccessToken';
import {IAppRuntimeState} from '../../definitions/system';
import {ITag} from '../../definitions/tag';
import {IUser} from '../../definitions/user';
import {IUserToken} from '../../definitions/userToken';
import {IWorkspace} from '../../definitions/workspace';
import {noopAsync} from '../../utilities/fns';
import {throwAssignedItemNotFound} from '../assignedItems/utils';
import {throwClientAssignedTokenNotFound} from '../clientAssignedTokens/utils';
import {throwCollaborationRequestNotFound} from '../collaborationRequests/utils';
import {throwFileNotFound} from '../files/utils';
import {throwFolderNotFound} from '../folders/utils';
import {throwPermissionGroupNotFound} from '../permissionGroups/utils';
import {throwPermissionItemNotFound} from '../permissionItems/utils';
import {throwProgramAccessTokenNotFound} from '../programAccessTokens/utils';
import {throwTagNotFound} from '../tags/utils';
import {throwUserNotFound, throwUserTokenNotFound} from '../user/utils';
import {throwNotFound} from '../utils';
import {throwWorkspaceNotFound} from '../workspaces/utils';
import {IBaseContextDataProviders} from './BaseContext';
import MemoryDataProvider from './data-providers/MemoryDataProvider';

export default class MemoryDataProviderContext
  implements IBaseContextDataProviders
{
  folder = new MemoryDataProvider<IFolder>([], throwFolderNotFound);
  file = new MemoryDataProvider<IFile>([], throwFileNotFound);
  clientAssignedToken = new MemoryDataProvider<IClientAssignedToken>(
    [],
    throwClientAssignedTokenNotFound
  );

  programAccessToken = new MemoryDataProvider<IProgramAccessToken>(
    [],
    throwProgramAccessTokenNotFound
  );

  permissionItem = new MemoryDataProvider<IPermissionItem>(
    [],
    throwPermissionItemNotFound
  );

  permissiongroup = new MemoryDataProvider<IPermissionGroup>(
    [],
    throwPermissionGroupNotFound
  );

  workspace = new MemoryDataProvider<IWorkspace>([], throwWorkspaceNotFound);

  collaborationRequest = new MemoryDataProvider<ICollaborationRequest>(
    [],
    throwCollaborationRequestNotFound
  );

  user = new MemoryDataProvider<IUser>([], throwUserNotFound);
  userToken = new MemoryDataProvider<IUserToken>([], throwUserTokenNotFound);

  appRuntimeState = new MemoryDataProvider<IAppRuntimeState>([], throwNotFound);

  tag = new MemoryDataProvider<ITag>([], throwTagNotFound);
  assignedItem = new MemoryDataProvider<IAssignedItem>(
    [],
    throwAssignedItemNotFound
  );

  close = noopAsync;
}
