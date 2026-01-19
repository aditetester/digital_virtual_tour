import { publicProcedure } from "../../create-context";

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export const getAvailabilityProcedure = publicProcedure.query(() => {
  console.log("[getAvailability] Fetching available time slots");
  
  const today = new Date();
  const slots: TimeSlot[] = [];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const times = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"];
    
    times.forEach((time, idx) => {
      slots.push({
        id: `${dateStr}-${time}`,
        date: dateStr,
        time: time,
        available: Math.random() > 0.3,
      });
    });
  }
  
  return slots;
});
