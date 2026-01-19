import { publicProcedure } from "../../create-context";
import { ProposalStorage } from "./storage";

export default publicProcedure.query(async () => {
  console.log('Fetching all proposals');
  return ProposalStorage.getAll();
});
