import { publicProcedure } from "../../create-context";
import { z } from "zod";

export const resetPasswordProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[resetPassword] Sending password reset email to:", input.email);
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: "Password reset instructions have been sent to your email",
    };
  });
