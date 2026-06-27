const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
    icon: path.join(__dirname, "public", "favicon.svg"),
    title: "FRYD - Focus, Reflect, Build",
  });

  // Load the production build
  win.loadFile(path.join(__dirname, "dist", "index.html"));

  // Open developer tools for debugging
  win.webContents.openDevTools();

  // Remove menu bar for native application feeling
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
