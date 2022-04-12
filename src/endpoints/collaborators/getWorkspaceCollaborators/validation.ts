import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getWorkspaceCollaboratorsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid.required(),
  })
  .required();
