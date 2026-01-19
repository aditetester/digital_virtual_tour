import { publicProcedure } from "../../create-context";
import { z } from "zod";

export const updateProfileProcedure = publicProcedure
  .input(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[updateProfile] Updating profile:", input);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: "Profile updated successfully",
      data: input,
    };
  });
