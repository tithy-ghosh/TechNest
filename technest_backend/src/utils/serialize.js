/**
 * Adds `_id` alongside every `id` in API responses.
 * The frontend was built against Mongoose, which exposed `_id`, while auth
 * responses use `id`. Keeping both avoids breaking either contract.
 */
function addMongoId(value) {
  if (Array.isArray(value)) return value.map(addMongoId);
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    if (key === 'id') {
      out.id = val;
      out._id = val;
    } else {
      out[key] = addMongoId(val);
    }
  }
  return out;
}

module.exports = addMongoId;
