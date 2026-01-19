import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import addUrlRoute from "./routes/downloads/add-url";
import getAllDownloadsRoute from "./routes/downloads/get-all";
import removeUrlRoute from "./routes/downloads/remove-url";
import { likePostProcedure } from "./routes/social/like-post";
import { unlikePostProcedure } from "./routes/social/unlike-post";
import { addCommentProcedure } from "./routes/social/add-comment";
import { getInteractionsProcedure } from "./routes/social/get-interactions";
import { getNotificationsProcedure } from "./routes/command-center/get-notifications";
import { getAvailabilityProcedure } from "./routes/command-center/get-availability";
import { bookMeetingProcedure } from "./routes/command-center/book-meeting";
import { updateProfileProcedure } from "./routes/command-center/update-profile";
import { resetPasswordProcedure } from "./routes/command-center/reset-password";
import { submitOrderProcedure } from "./routes/command-center/submit-order";
import getAllMediaRoute from "./routes/media/get-all";
import getAllProposalsRoute from "./routes/proposals/get-all";
import getAnalyticsDataRoute from "./routes/analytics/get-data";
import getHomeNewsfeedRoute from "./routes/home/get-newsfeed";
import getToursRoute from "./routes/media/get-tours";
import getPhotosRoute from "./routes/media/get-photos";
import getVideosRoute from "./routes/media/get-videos";
import getDocumentsRoute from "./routes/media/get-documents";
import getPresentationsRoute from "./routes/media/get-presentations";
import getScreenshotsRoute from "./routes/media/get-screenshots";
import getBannersRoute from "./routes/media/get-banners";





export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  downloads: createTRPCRouter({
    addUrl: addUrlRoute,
    getAll: getAllDownloadsRoute,
    removeUrl: removeUrlRoute,
  }),
  social: createTRPCRouter({
    likePost: likePostProcedure,
    unlikePost: unlikePostProcedure,
    addComment: addCommentProcedure,
    getInteractions: getInteractionsProcedure,
  }),
  commandCenter: createTRPCRouter({
    getNotifications: getNotificationsProcedure,
    getAvailability: getAvailabilityProcedure,
    bookMeeting: bookMeetingProcedure,
    updateProfile: updateProfileProcedure,
    resetPassword: resetPasswordProcedure,
    submitOrder: submitOrderProcedure,
  }),
  media: createTRPCRouter({
    getAll: getAllMediaRoute,
    getTours: getToursRoute,
    getPhotos: getPhotosRoute,
    getVideos: getVideosRoute,
    getDocuments: getDocumentsRoute,
    getPresentations: getPresentationsRoute,
    getScreenshots: getScreenshotsRoute,
    getBanners: getBannersRoute,
  }),

  proposals: createTRPCRouter({
    getAll: getAllProposalsRoute,
  }),
  analytics: createTRPCRouter({
    getData: getAnalyticsDataRoute,
  }),
  home: createTRPCRouter({
    getNewsfeed: getHomeNewsfeedRoute,
  }),
});





export type AppRouter = typeof appRouter;
