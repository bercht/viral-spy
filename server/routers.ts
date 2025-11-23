import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { createScraping, updateScraping, getUserScrapings, getScrapingById, createChatMessage, getChatMessages } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scraping: router({
    start: protectedProcedure
      .input(z.object({
        urls: z.array(z.string()),
        resultsLimit: z.number().default(200),
      }))
      .mutation(async ({ ctx, input }) => {
        const scrapingId = await createScraping({
          userId: ctx.user.id,
          urls: JSON.stringify(input.urls),
          resultsLimit: input.resultsLimit,
          status: "pending",
        });

        // Call n8n webhook
        try {
          await fetch("https://n8n.srv1027542.hstgr.cloud/webhook/viralspy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scrapingId,
              userId: ctx.user.id,
              urls: input.urls,
              resultsLimit: input.resultsLimit,
            }),
          });
        } catch (error) {
          await updateScraping(scrapingId, {
            status: "error",
            errorMessage: "Failed to start scraping workflow",
          });
          throw new Error("Failed to start scraping");
        }

        return { scrapingId };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        scrapingId: z.number(),
        status: z.enum(["pending", "processing", "completed", "error"]).optional(),
        currentStep: z.string().optional(),
        progress: z.number().optional(),
        spreadsheetUrl: z.string().optional(),
        analysisUrl: z.string().optional(),
        assistantId: z.string().optional(),
        assistantUrl: z.string().optional(),
        errorMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { scrapingId, ...data } = input;
        await updateScraping(scrapingId, data);
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserScrapings(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getScrapingById(input.id);
      }),
  }),

  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({
        scrapingId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await createChatMessage({
          scrapingId: input.scrapingId,
          role: "user",
          content: input.message,
        });

        // Get scraping to get assistant ID
        const scraping = await getScrapingById(input.scrapingId);
        if (!scraping?.assistantId) {
          throw new Error("Assistant not ready yet");
        }

        // Call OpenAI Assistant API (simplified - you'll need to implement full assistant logic)
        // For now, just return a placeholder response
        const assistantResponse = "Funcionalidade de chat será implementada em breve";

        // Save assistant message
        await createChatMessage({
          scrapingId: input.scrapingId,
          role: "assistant",
          content: assistantResponse,
        });

        return { response: assistantResponse };
      }),

    getMessages: protectedProcedure
      .input(z.object({ scrapingId: z.number() }))
      .query(async ({ input }) => {
        return await getChatMessages(input.scrapingId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
