import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getWorkspaceProgramAccessTokenJoiSchema = Joi.object()
  .keys({workspaceId: validationSchemas.nanoid})
  .required();
