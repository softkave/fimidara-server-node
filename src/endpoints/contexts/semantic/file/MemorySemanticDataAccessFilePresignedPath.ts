import {FilePresignedPath} from '../../../../definitions/file';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {SemanticDataAccessFilePresignedPathProvider} from './types';

export class MemorySemanticDataAccessFilePresignedPathProvider
  extends SemanticDataAccessWorkspaceResourceProvider<FilePresignedPath>
  implements SemanticDataAccessFilePresignedPathProvider {}
