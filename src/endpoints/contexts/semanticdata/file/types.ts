import {IFile} from '../../../../definitions/file';
import {
  ISemanticDataAccessNamedResourceProvider,
  ISemanticDataAccessWorkspaceResourceProvider,
} from '../types';

export interface ISemanticDataAccessFileProvider
  extends ISemanticDataAccessWorkspaceResourceProvider<IFile>,
    ISemanticDataAccessNamedResourceProvider<IFile> {}
