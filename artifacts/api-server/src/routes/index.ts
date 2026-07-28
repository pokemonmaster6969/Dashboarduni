import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import servicesRouter from "./services";
import scientistsRouter from "./scientists";
import territoriesRouter from "./territories";
import projectsRouter from "./projects";
import invoicesRouter from "./invoices";
import paymentsRouter from "./payments";
import analyticsRouter from "./analytics";
import attachmentsRouter from "./attachments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(clientsRouter);
router.use(servicesRouter);
router.use(scientistsRouter);
router.use(territoriesRouter);
router.use(projectsRouter);
router.use(invoicesRouter);
router.use(paymentsRouter);
router.use(analyticsRouter);
router.use(attachmentsRouter);

export default router;
