import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getWorkspaceClientAssignedTokenJoiSchema = Joi.object()
  .keys({workspaceId: validationSchemas.resourceId})
  .required();
