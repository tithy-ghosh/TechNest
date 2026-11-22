const addMongoId = require('./serialize');

const success = (res, statusCode, data, message = 'Success') =>
  res.status(statusCode).json({ success: true, data: addMongoId(data), message });

const error = (res, statusCode, message) =>
  res.status(statusCode).json({ success: false, data: null, message });

module.exports = { success, error };
