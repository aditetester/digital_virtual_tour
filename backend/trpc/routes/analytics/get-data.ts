import { publicProcedure } from "../../create-context";
import { AnalyticsStorage } from "./storage";

export default publicProcedure.query(async () => {
  console.log('Fetching analytics data');
  return AnalyticsStorage.getData();
});
