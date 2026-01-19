import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { SocialStorage } from "./storage";

export const unlikePostProcedure = publicProcedure
  .input(z.object({ postId: z.string() }))
  .mutation(async ({ input }) => {
    const userId = "anonymous";
    const success = SocialStorage.removeLike(input.postId, userId);
    
    return {
      success,
      likeCount: SocialStorage.getLikeCount(input.postId),
      isLiked: false,
    };
  });
