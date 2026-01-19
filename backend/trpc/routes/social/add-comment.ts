import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { SocialStorage } from "./storage";

export const addCommentProcedure = publicProcedure
  .input(
    z.object({
      postId: z.string(),
      text: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    const userId = "anonymous";
    const username = "Anonymous User";
    
    const comment = SocialStorage.addComment(
      input.postId,
      userId,
      username,
      input.text
    );
    
    return {
      success: true,
      comment,
      commentCount: SocialStorage.getCommentCount(input.postId),
    };
  });
