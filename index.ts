import express from "express";
import { buildApp } from "./server/_core/index.js";

const app: express.Application = buildApp();

export default app;
