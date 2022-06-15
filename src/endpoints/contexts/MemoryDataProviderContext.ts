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
  public folder = new MemoryDataProvider<IFolder>([], throwFolderNotFound);
  public file = new MemoryDataProvider<IFile>([], throwFileNotFound);
  public clientAssignedToken = new MemoryDataProvider<IClientAssignedToken>(
    [],
    throwClientAssignedTokenNotFound
  );

  public programAccessToken = new MemoryDataProvider<IProgramAccessToken>(
    [],
    throwProgramAccessTokenNotFound
  );

  public permissionItem = new MemoryDataProvider<IPermissionItem>(
    [],
    throwPermissionItemNotFound
  );

  public permissiongroup = new MemoryDataProvider<IPermissionGroup>(
    [],
    throwPermissionGroupNotFound
  );

  public workspace = new MemoryDataProvider<IWorkspace>(
    [],
    throwWorkspaceNotFound
  );

  public collaborationRequest = new MemoryDataProvider<ICollaborationRequest>(
    [],
    throwCollaborationRequestNotFound
  );

  public user = new MemoryDataProvider<IUser>([], throwUserNotFound);
  public userToken = new MemoryDataProvider<IUserToken>(
    [],
    throwUserTokenNotFound
  );

  public appRuntimeState = new MemoryDataProvider<IAppRuntimeState>(
    [],
    throwNotFound
  );

  public tag = new MemoryDataProvider<ITag>([], throwTagNotFound);
  public assignedItem = new MemoryDataProvider<IAssignedItem>(
    [],
    throwAssignedItemNotFound
  );
}
