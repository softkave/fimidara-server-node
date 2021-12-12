import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import presetPermissionsGroupsValidationSchemas from '../../presetPermissionsGroup/validation';

export const updateClientAssignedTokenPresetsJoiSchema = Joi.object()
  .keys({
    tokenId: validationSchemas.nanoid.allow([null]),
    onReferenced: Joi.boolean().allow([null]),
    presets: presetPermissionsGroupsValidationSchemas.assignedPresetsList.required(),
  })
  .required();
