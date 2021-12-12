import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroup/validation';

export const updateProgramAccessTokenPresetsJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow([null]),
    onReferenced: Joi.boolean().allow([null]),
    presets: presetPermissionsGroupsValidationSchemas.assignedPresetsList.allow(
      [null]
    ),
  })
  .required();
