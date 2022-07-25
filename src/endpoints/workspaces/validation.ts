import Joi from 'joi';
import {UsageRecordCategory} from '../../definitions/usageRecord';

const price = Joi.number().min(0).precision(5);
const category = Joi.string().valid(
  ...['total'].concat(Object.values(UsageRecordCategory))
);

const usageThreshold = Joi.object().keys({
  price: price.required(),
  category: category.required(),
});

const usageThresholdMap = Joi.object().keys({
  [UsageRecordCategory.Storage]: usageThreshold,
  [UsageRecordCategory.BandwidthIn]: usageThreshold,
  [UsageRecordCategory.BandwidthOut]: usageThreshold,
  [UsageRecordCategory.Request]: usageThreshold,
  [UsageRecordCategory.DatabaseObject]: usageThreshold,
  ['total']: usageThreshold,
});

const workspaceValidationSchemas = {
  usageThreshold,
  usageThresholdMap,
};

export default workspaceValidationSchemas;
