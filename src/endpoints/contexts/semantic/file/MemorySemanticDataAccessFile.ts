import {IFile} from '../../../../definitions/file';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessFileProvider} from './types';

export class MemorySemanticDataAccessFile
  extends SemanticDataAccessWorkspaceResourceProvider<IFile>
  implements ISemanticDataAccessFileProvider {}
