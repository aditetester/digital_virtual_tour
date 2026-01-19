import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { DownloadStorage } from "./storage";

export default publicProcedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Removing download URL:', input.id);
    const removed = DownloadStorage.remove(input.id);
    if (!removed) {
      throw new Error('Download not found');
    }
    return { success: true };
  });
