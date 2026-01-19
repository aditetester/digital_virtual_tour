import { publicProcedure } from "../../create-context";
import { z } from "zod";

export const bookMeetingProcedure = publicProcedure
  .input(
    z.object({
      slotId: z.string(),
      date: z.string(),
      time: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[bookMeeting] Booking meeting:", input);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Meeting booked successfully for ${input.date} at ${input.time}`,
      confirmationId: `CONF-${Date.now()}`,
    };
  });
