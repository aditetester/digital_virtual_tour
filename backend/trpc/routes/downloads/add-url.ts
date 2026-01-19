import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { DownloadStorage } from "./storage";

export default publicProcedure
  .input(
    z.object({
      imageUrl: z.string().url(),
      downloadUrl: z.string().url(),
      title: z.string().optional(),
      description: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log('Adding download URL:', input);
    const newItem = DownloadStorage.add(input);
    return newItem;
  });
