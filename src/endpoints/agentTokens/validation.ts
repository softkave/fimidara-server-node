import Joi from 'joi';

const onReferenced = Joi.boolean();
const refreshToken = Joi.string().max(1_000);
const shouldRefresh = Joi.boolean();
const refreshDuration = Joi.number().min(0);

const kAgentTokenValidationSchemas = {
  onReferenced,
  refreshToken,
  shouldRefresh,
  refreshDuration,
};

export default kAgentTokenValidationSchemas;
