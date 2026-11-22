const NodeCache = require('node-cache');
const { prisma } = require('../config/db');

const cache = new NodeCache({ stdTTL: 3600 });

const SYSTEM_PROMPT = `You are TechBot, the helpful shopping assistant for TechVault, an online gadget store. You help customers find products, answer spec questions, compare gadgets, and assist with checkout. Store policies: free shipping over $50, 30-day returns, 2-year warranty on electronics. Keep replies concise (2-4 sentences). Never make up product details not provided to you. If asked something outside your scope, politely redirect to the store topic.`;

exports.chat = async (sessionId, userMessage, context = {}) => {
  let history = cache.get(sessionId) || [];

  let contextPrefix = '';
  if (context.currentProductSlug) {
    const product = await prisma.product.findFirst({
      where: { slug: context.currentProductSlug },
      select: {
        name: true,
        brand: true,
        basePrice: true,
        avgRating: true,
        specs: { select: { key: true, value: true } },
        variants: {
          select: { sku: true, color: true, storage: true, price: true, stock: true },
        },
      },
    });

    if (product) {
      const specsText = product.specs
        .map((spec) => `${spec.key}: ${spec.value}`)
        .join(', ');
      contextPrefix = `[User is viewing: ${product.name} by ${product.brand}, Price: $${product.basePrice}, Rating: ${product.avgRating}/5, Specs: ${specsText}] `;
    }
  }

  history.push({ role: 'user', content: contextPrefix + userMessage });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error('AI provider returned an empty response');

  history.push({ role: 'assistant', content: reply });
  if (history.length > 20) history = history.slice(-20);
  cache.set(sessionId, history);

  return reply;
};
