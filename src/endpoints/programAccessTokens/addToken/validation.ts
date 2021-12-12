import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroup/validation';

export const addProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    description: validationSchemas.description.allow([null]),
    presets: presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(
      [null]
    ),
  })
  .required();
