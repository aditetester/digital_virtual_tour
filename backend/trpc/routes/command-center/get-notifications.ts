import { publicProcedure } from "../../create-context";

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Property Available",
    body: "A new luxury listing has been added to your area",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    title: "Tour Completed",
    body: "Your virtual tour for 123 Main St has been processed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    title: "Meeting Reminder",
    body: "You have a meeting scheduled tomorrow at 2:00 PM",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    title: "Order Update",
    body: "Your photo shoot order is ready for review",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const getNotificationsProcedure = publicProcedure.query(() => {
  console.log("[getNotifications] Fetching notifications");
  return mockNotifications;
});
