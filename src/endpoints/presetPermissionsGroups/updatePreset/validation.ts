import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../validation';

export const updatePresetPermissionsGroupJoiSchema = Joi.object()
  .keys({
    presetId: validationSchemas.nanoid.required(),
    data: Joi.object().keys({
      name: validationSchemas.name.allow(null),
      description: validationSchemas.description.allow(null),
      presets:
        presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(
          null
        ),
    }),
  })
  .required();
