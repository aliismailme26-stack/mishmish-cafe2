const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Mishmish Cafe - POS System",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.setMenuBarVisibility(false);
    win.loadFile('admin.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});