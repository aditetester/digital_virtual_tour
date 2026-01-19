import { publicProcedure } from "../../create-context";
import { z } from "zod";

export const submitOrderProcedure = publicProcedure
  .input(
    z.object({
      productType: z.enum(["360 Virtual Tour", "Photo Shoot", "Video Shoot"]),
      numberOfImages: z.number().optional(),
      shootDate: z.string().optional(),
      comments: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[submitOrder] Submitting order:", input);
    
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    return {
      success: true,
      message: "Order submitted successfully! We'll contact you shortly.",
      orderId: `ORD-${Date.now()}`,
      data: input,
    };
  });
