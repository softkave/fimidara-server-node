import Joi = require('joi');
import {UsageRecordLabel} from '../../definitions/usageRecord';

const price = Joi.number().min(0).precision(2);
const totalUsageThreshold = Joi.object().keys({
  price: price.required(),
});

const label = Joi.string().valid(...Object.values(UsageRecordLabel));
const usage = Joi.number().min(0).integer();
const usageThreshold = Joi.object().keys({
  usage,
  price,
  label: label.required(),
});

const usageThresholdList = Joi.array()
  .items(usageThreshold)
  .unique('label')
  .max(Object.keys(UsageRecordLabel).length);

const workspaceValidationSchemas = {
  usageThreshold,
  totalUsageThreshold,
  usageThresholdList,
};
export default workspaceValidationSchemas;
