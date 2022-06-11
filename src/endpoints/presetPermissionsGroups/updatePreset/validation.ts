import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import tagValidationSchemas from '../../tags/validation';
import presetsValidationSchemas from '../validation';

export const updatePresetPermissionsGroupJoiSchema = Joi.object()
  .keys({
    presetId: validationSchemas.nanoid.required(),
    preset: Joi.object()
      .keys({
        name: validationSchemas.name,
        description: validationSchemas.description.allow(null),
        presets: presetsValidationSchemas.assignedPresetsList.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
