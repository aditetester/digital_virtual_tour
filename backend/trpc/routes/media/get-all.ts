import { publicProcedure } from "../../create-context";
import { MediaStorage } from "./storage";

export default publicProcedure.query(async () => {
  console.log('Fetching all media items');
  return MediaStorage.getAll();
});
