import {IFolder} from '../../../../definitions/folder';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFolderProvider} from './types';

export class MemorySemanticDataAccessFolder
  extends SemanticDataAccessWorkspaceResourceProvider<IFolder>
  implements ISemanticDataAccessFolderProvider {}
