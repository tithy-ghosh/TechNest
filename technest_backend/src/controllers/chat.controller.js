const { prisma } = require('../config/db');
const { chat } = require('../services/ai.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/ApiResponse');

exports.sendMessage = asyncHandler(async (req, res) => {
  const { sessionId, message, context } = req.validated.body;

  const reply = await chat(sessionId, message, context || {});

  const session = await prisma.chatSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      userId: req.user?.id ?? null,
      context: context ?? {},
    },
    update: {
      ...(context !== undefined && { context }),
      ...(req.user?.id && { userId: req.user.id }),
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      { chatSessionId: session.id, role: 'user', content: message },
      { chatSessionId: session.id, role: 'assistant', content: reply },
    ],
  });

  success(res, 200, { reply, sessionId });
});
