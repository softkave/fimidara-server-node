import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroups/validation';

export const updateProgramAccessTokenJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow(null),
    onReferenced: Joi.boolean().allow(null),
    token: Joi.object()
      .keys({
        name: validationSchemas.name.allow(null),
        description: validationSchemas.description.allow(null),
        presets:
          presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(
            null
          ),
      })
      .required(),
  })
  .required();
