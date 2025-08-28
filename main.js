const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

function readReadmeSummary() {
  try {
    const readmePath = path.join(__dirname, "README.md");
    let buf = fs.readFileSync(readmePath);
    // Detect UTF-16 LE BOM (your current README uses this)
    let text;
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
      text = buf.toString("utf16le");
    } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
      text = buf.toString("utf16be");
    } else {
      text = buf.toString("utf8");
    }

    // Take a short summary from top of README
    const lines = text.split(/\r?\n/).filter(Boolean);
    const withoutTitle = lines[0].startsWith("#") ? lines.slice(1) : lines;
    return withoutTitle.slice(0, 8).join("\n").trim();
  } catch (e) {
    return "A tiny Electron app that estimates how far to run from a time + pace.";
  }
}

function showAboutDialog() {
  const detail = readReadmeSummary();
  dialog
    .showMessageBox({
      type: "info",
      title: "About",
      message: `${app.getName()} v${app.getVersion()}`,
      detail,
      buttons: ["OK", "Open README"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    })
    .then(({ response }) => {
      if (response === 1) {
        shell.openPath(path.join(__dirname, "README.md"));
      }
    });
}

function buildMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: process.platform === "darwin" ? "Close" : "Exit",
          accelerator: "Alt+F4",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: showAboutDialog,
        },
      ],
    },
  ];

  // macOS: prepend standard app menu for consistency
  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 500,
    title: "Running Calculator",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
