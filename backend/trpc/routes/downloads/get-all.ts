import { publicProcedure } from "../../create-context";
import { DownloadStorage } from "./storage";

export default publicProcedure.query(async () => {
  console.log('Fetching all downloads');
  return DownloadStorage.getAll();
});
