// main.js (CommonJS, Electron)
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// ---------- Helpers ----------
function readReadme() {
  try {
    const readmePath = path.join(__dirname, "README.md");
    const buf = fs.readFileSync(readmePath);
    // Handle UTF-16/UTF-8 so your README always renders correctly
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe)
      return buf.toString("utf16le");
    if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff)
      return buf.toString("utf16be");
    return buf.toString("utf8");
  } catch {
    return "# Running Calculator\nA tiny Electron app that estimates how far to run from time + pace.";
  }
}

async function renderMarkdownToHtml(mdText) {
  // ESM-only module; use dynamic import from CommonJS
  const { marked } = await import("marked");
  return marked.parse(mdText);
}

async function openAboutWindow() {
  const md = readReadme();
  const html = await renderMarkdownToHtml(md);

  const about = new BrowserWindow({
    width: 560,
    height: 640,
    minWidth: 440,
    minHeight: 420,
    resizable: true,
    title: `About ${app.getName()}`,
    autoHideMenuBar: true,
    webPreferences: {
      // Keeping this simple for an internal window
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const page = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>About</title>
        <style>
          :root { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
          body { margin: 0; background: #fff; }
          header {
            padding: 14px 18px; border-bottom: 1px solid #eee;
            display: flex; align-items: baseline; gap: 8px;
          }
          header h1 { font-size: 16px; margin: 0; font-weight: 600; }
          header .ver { color: #666; }
          main {
            padding: 18px; height: calc(100vh - 58px);
            overflow: auto; line-height: 1.5;
          }
          main h1 { font-size: 22px; margin-top: 0; }
          main h2 { font-size: 18px; margin-top: 1.2em; }
          code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          pre { background: #f6f8fa; padding: 12px; border-radius: 8px; overflow: auto; }
          a.button {
            margin-left: auto; text-decoration: none; background: #f3f4f6; border: 1px solid #e5e7eb;
            padding: 6px 10px; border-radius: 8px; color: #111; font-size: 12px;
          }
          ul { padding-left: 1.25rem; }
        </style>
      </head>
      <body>
        <header>
          <h1>${app.getName()}</h1>
          <span class="ver">v${app.getVersion()}</span>
        </header>
        <main>${html}</main>
        <script>
          const { shell } = require('electron');
        </script>
      </body>
    </html>
`;

  about.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(page));
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
        { label: "About", click: () => openAboutWindow() }, // supports async
      ],
    },
  ];

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

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 500,
    title: "Running Calculator",
    webPreferences: {
      // If you don't use a preload, remove this line.
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
}

// ---------- App lifecycle ----------
app.whenReady().then(() => {
  buildMenu();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
