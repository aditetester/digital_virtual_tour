import { publicProcedure } from "../../create-context";
import { MediaStorage } from "./storage";

export default publicProcedure.query(async () => {
  return MediaStorage.getByType('photo');
});
