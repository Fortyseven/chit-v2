const { app, BrowserWindow } = require("electron")
const path = require("path")

const isDev =
    process.env.NODE_ENV === "development" || process.env.ELECTRON_DEV === "1"

/* --------------------------------------------------------------------------*/
function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
        },
    })

    if (isDev) {
        // In dev, load Vite dev server if running, else fallback to index.html
        win.loadURL("http://localhost:5173").catch(() => {
            win.loadFile(path.join(__dirname, "../index.html"))
        })
    } else {
        // In prod, load the built Svelte app (Vite default is dist/index.html)
        win.loadFile(path.join(__dirname, "../dist/index.html"))
    }
    win.webContents.openDevTools()
}

/* --------------------------------------------------------------------------*/
app.whenReady().then(() => {
    createWindow()

    console.log(process.platform)

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

/* --------------------------------------------------------------------------*/
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit()
})
