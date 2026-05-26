import { app, BrowserWindow, ipcMain } from "electron";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type SavePayload = {
  slot: "latest";
  data: unknown;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rendererDist = path.join(__dirname, "../dist");

const getSaveDirectory = () => path.join(app.getPath("userData"), "saves");
const getSavePath = (slot: string) => path.join(getSaveDirectory(), `${slot}.json`);

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1100,
    minHeight: 680,
    backgroundColor: "#07151a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    await win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    await win.loadFile(path.join(rendererDist, "index.html"));
  }
};

ipcMain.handle("save:write", async (_event, payload: SavePayload) => {
  await mkdir(getSaveDirectory(), { recursive: true });
  await writeFile(getSavePath(payload.slot), JSON.stringify(payload.data, null, 2), "utf8");
});

ipcMain.handle("save:read", async (_event, slot: string) => {
  try {
    const content = await readFile(getSavePath(slot), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
});

ipcMain.handle("save:clear", async (_event, slot: string) => {
  try {
    await rm(getSavePath(slot), { force: true });
  } catch {
    return null;
  }
  return null;
});

app.whenReady().then(async () => {
  await createWindow();
  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
