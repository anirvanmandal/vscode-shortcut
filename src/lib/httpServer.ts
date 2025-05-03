import express from "express";
import { Server } from "http";
import { Request, Response } from "express";
import { Workspace } from "../models/workspace";
import { applyWebhookChanges } from "./applyWebhookChanges";
import { Config } from "../models/config";
import { AssignedStoryTreeProvider } from "../treeProviders/assignedStoryTreeProvider";
import { StoryTreeProvider } from "../treeProviders/storyTreeProvider";

let server: Server | null = null;

export function startHttpServer(
  port: number = 9393,
  workspaces: Workspace[],
  config: Config,
  assignedStoryTreeProvider: AssignedStoryTreeProvider,
  pendingStoryTreeProvider: StoryTreeProvider
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const app = express();

      // Add a basic health check endpoint
      app.get("/health", (req: Request, res: Response) => {
        res.json({ status: "ok" });
      });

      app.get("/", (req: Request, res: Response) => {
        res.json({ status: "ok" });
      });

      app.post("/shortcut", (req: Request, res: Response) => {
        console.log(req);

        const data: any = [];
        req.on("data", (chunk) => {
          data.push(chunk);
        });

        req.on("end", async () => {
          await applyWebhookChanges(
            workspaces,
            JSON.parse(data),
            config,
            assignedStoryTreeProvider,
            pendingStoryTreeProvider
          );
        });

        res.json({ status: "ok" });
      });

      // Start the server
      const newServer = app.listen(port, () => {
        console.log(`HTTP server is running on port ${port}`);
        server = newServer;
        resolve();
      });

      newServer.on("error", (error: Error) => {
        console.error("HTTP server error:", error);
        reject(error);
      });

      process.stdin.resume();
    } catch (error) {
      console.error("Failed to start HTTP server:", error);
      reject(error);
    }
  });
}

export function stopHttpServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log("HTTP server stopped");
        server = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}
