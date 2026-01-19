import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { SocialStorage } from "./storage";

export const likePostProcedure = publicProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ input }) => {
    const userId = "anonymous";
    SocialStorage.addLike(input.postId, userId);
    
    return {
      success: true,
      likeCount: SocialStorage.getLikeCount(input.postId),
      isLiked: true,
    };
  });
