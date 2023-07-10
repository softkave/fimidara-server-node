import {FilePresignedPath} from '../../../../definitions/file';
import {MemorySemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessFilePresignedPathProvider} from './types';

export class MemorySemanticDataAccessFilePresignedPathProvider
  extends MemorySemanticDataAccessWorkspaceResourceProvider<FilePresignedPath>
  implements SemanticDataAccessFilePresignedPathProvider {}
