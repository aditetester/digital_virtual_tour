import { publicProcedure } from "../../create-context";
import { HomeStorage } from "./storage";

export default publicProcedure.query(async () => {
  console.log('Fetching home newsfeed');
  return HomeStorage.getNewsfeed();
});
