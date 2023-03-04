import {ICollaborationRequest} from '../../../../definitions/collaborationRequest';
import {SemanticDataAccessWorkspaceResourceProvider} from '../utils';
import {ISemanticDataAccessCollaborationRequestProvider} from './types';

export class MemorySemanticDataAccessCollaborationRequest
  extends SemanticDataAccessWorkspaceResourceProvider<ICollaborationRequest>
  implements ISemanticDataAccessCollaborationRequestProvider {}
