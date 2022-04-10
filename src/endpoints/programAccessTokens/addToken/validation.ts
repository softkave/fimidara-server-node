import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetsValidationSchemas from '../../presetPermissionsGroups/validation';
import tagValidationSchemas from '../../tags/validation';

export const addProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    organizationId: validationSchemas.nanoid.required(),
    token: Joi.object()
      .keys({
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
        presets: presetsValidationSchemas.assignedPresetsList.allow(null),
        tags: tagValidationSchemas.assignedTagsList.allow(null),
      })
      .required(),
  })
  .required();
