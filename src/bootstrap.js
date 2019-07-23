/**
 * Init app
 */

global.Promise = require('bluebird')
const Joi = require('@hapi/joi')

Joi.optionalNumberId = () => Joi.number().integer().positive()
Joi.numberId = () => Joi.optionalNumberId().required()
