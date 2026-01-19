import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { SocialStorage } from "./storage";

export const getInteractionsProcedure = publicProcedure
  .input(z.object({ postId: z.string() }))
  .query(async ({ input }) => {
    const userId = "anonymous";
    return SocialStorage.getAllInteractions(input.postId, userId);
  });
