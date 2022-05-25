import Joi = require('joi');
import {UsageRecordCategory} from '../../definitions/usageRecord';

const price = Joi.number().min(0).precision(2);
const totalUsageThreshold = Joi.object().keys({
  price: price.required(),
});

const label = Joi.string().valid(...Object.values(UsageRecordCategory));
const usageThreshold = Joi.object().keys({
  price,
  label: label.required(),
});

const usageThresholdList = Joi.array()
  .items(usageThreshold)
  .unique('label')
  .max(Object.keys(UsageRecordCategory).length);

const workspaceValidationSchemas = {
  usageThreshold,
  totalUsageThreshold,
  usageThresholdList,
};
export default workspaceValidationSchemas;
