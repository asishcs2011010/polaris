import { inngest } from "./client";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

export const demoGenerate = inngest.createFunction(
  { id: "demo-generate" },
  { event: "demo/generate" },
  async ({ step }) => {
    await step.run("generate-text", async () => {
      const result = await generateText({
        model: anthropic("claude-3-haiku-20240307"),
        prompt: "Write a vegetarian lasagna recipe for 4 people.",
      });
      console.log("Claude output:", result.text);
    });
  }
);

