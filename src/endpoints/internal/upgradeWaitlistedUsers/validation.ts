import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import {internalConstants} from '../constants.js';
import {UpgradeWaitlistedUsersEndpointParams} from './types.js';

export const upgradeWaitlistedUsersJoiSchema =
  Joi.object<UpgradeWaitlistedUsersEndpointParams>().keys({
    userIds: Joi.array()
      .items(kValidationSchemas.resourceId)
      .max(internalConstants.maxUpgradeWaitlistedUserItems)
      .required(),
  });
