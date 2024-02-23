import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {internalConstants} from '../constants';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

export const upgradeWaitlistedUsersJoiSchema =
  Joi.object<UpgradeWaitlistedUsersEndpointParams>().keys({
    userIds: Joi.array()
      .items(kValidationSchemas.resourceId)
      .max(internalConstants.maxUpgradeWaitlistedUserItems)
      .required(),
  });
