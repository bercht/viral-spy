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
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        // Save user message
        await createChatMessage({
          scrapingId: input.scrapingId,
          role: "user",
          content: input.message,
        });

        // Get scraping to get assistant ID and thread ID
        const scraping = await getScrapingById(input.scrapingId);
        if (!scraping?.assistantId) {
          throw new Error("Assistant not ready yet. Please wait for the analysis to complete.");
        }

        let threadId = scraping.threadId;

        // Create thread if it doesn't exist
        if (!threadId) {
          const threadResponse = await fetch("https://api.openai.com/v1/threads", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "OpenAI-Beta": "assistants=v2",
            },
          });

          if (!threadResponse.ok) {
            throw new Error("Failed to create thread");
          }

          const thread = await threadResponse.json();
          threadId = thread.id;

          // Save thread ID
          await updateScraping(input.scrapingId, { threadId });
        }

        // Add message to thread
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            role: "user",
            content: input.message,
          }),
        });

        // Run the assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
          },
          body: JSON.stringify({
            assistant_id: scraping.assistantId,
          }),
        });

        if (!runResponse.ok) {
          throw new Error("Failed to run assistant");
        }

        const run = await runResponse.json();

        // Poll for completion
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max

        while (runStatus !== "completed" && runStatus !== "failed" && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "OpenAI-Beta": "assistants=v2",
            },
          });

          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          attempts++;
        }

        if (runStatus !== "completed") {
          throw new Error("Assistant run did not complete in time");
        }

        // Get the assistant's response
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
        });

        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data.find((msg: any) => msg.role === "assistant" && msg.run_id === run.id);

        if (!assistantMessage) {
          throw new Error("No response from assistant");
        }

        const assistantResponse = assistantMessage.content[0].text.value;

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
