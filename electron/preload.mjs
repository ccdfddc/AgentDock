import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("agentdock", {
  version: "agentdock-desktop",
});