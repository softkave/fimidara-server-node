import {IFolder} from '../../../../definitions/folder';
import {
  ISemanticDataAccessNamedResourceProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFolderProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IFolder>,
    ISemanticDataAccessNamedResourceProvider<IFolder> {}
