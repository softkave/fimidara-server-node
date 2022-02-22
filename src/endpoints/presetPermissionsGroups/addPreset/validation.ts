import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../validation';

export const addPresetPermissionsGroupJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    preset: Joi.object()
      .keys({
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
        presets:
          presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(
            null
          ),
      })
      .required(),
  })
  .required();
