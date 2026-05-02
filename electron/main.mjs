import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { startLocalApi } from "../server/local-api.mjs";

const isDev = !app.isPackaged;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DEV_URL = process.env.AGENTDOCK_DEV_URL ?? "http://127.0.0.1:5173";

let apiHandle = null;
let mainWindow = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#f3f0ea",
    title: "AgentDock",
    webPreferences: {
      preload: join(__dirname, "preload.mjs"),
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (isDev) {
    await mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return;
  }

  await mainWindow.loadFile(join(app.getAppPath(), "dist", "index.html"));
}

app.whenReady().then(async () => {
  apiHandle = await startLocalApi();
  await createWindow();
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.on("before-quit", async () => {
  if (apiHandle?.close) {
    await apiHandle.close();
  }
});