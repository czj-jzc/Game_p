import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  saveProgress: (data: unknown) => ipcRenderer.invoke("save:write", { slot: "latest", data }),
  loadProgress: () => ipcRenderer.invoke("save:read", "latest"),
  clearProgress: () => ipcRenderer.invoke("save:clear", "latest")
});
