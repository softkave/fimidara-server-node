import Joi from 'joi';
import {
  UsageRecordCategory,
  UsageRecordFulfillmentStatus,
} from '../../definitions/usageRecord';

const category = Joi.string().valid(...Object.values(UsageRecordCategory));
const fulfillmentStatus = Joi.string().valid(
  ...Object.values(UsageRecordFulfillmentStatus)
);

const categoryList = Joi.array()
  .items(category)
  .max(Object.values(UsageRecordCategory).length);

const usageRecordValidationSchemas = {
  category,
  fulfillmentStatus,
  categoryList,
};

export default usageRecordValidationSchemas;
