import { Router } from "express";
import { auth } from "./auth";
import { user } from "./user";
import { customer } from "./customer";
import { loan } from "./loan";
import { emiCollection } from "./emiCollection";
import { emiFollowup } from "./emiFollowup";

const router: Router = Router();

router.use('/auth', auth);
router.use('/users', user);
router.use('/customers', customer);
router.use('/loans', loan);
router.use('/emi-collections', emiCollection);
router.use('/emi-followups', emiFollowup);

export default router;