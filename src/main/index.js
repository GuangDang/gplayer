import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { getMetaDataAsync } from './readMetaData.js'

import trayIcon from '../../resources/icon-gplayer-100.png?asset'

app.commandLine.appendSwitch('wm-window-animations-disabled')
let filePath, tray

filePath = process.argv[1]

getMetaDataAsync(filePath).then((meta) => {
  ipcMain.handle('getInfo', () => {
    return { filePath, ...meta }
  })
})

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 500,
    height: 200,
    x: 1540,
    y: 900,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  tray = new Tray(nativeImage.createFromPath(trayIcon))
  const menu = [
    {
      label: '退出',
      role: 'quit'
    }
  ]
  tray.on('double-click', () => {
    win.show()
  })

  tray.setContextMenu(Menu.buildFromTemplate(menu))

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    console.log(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // win.webContents.openDevTools()
  win.hookWindowMessage(278, function (e) {
    win.setEnabled(false)
    setTimeout(() => {
      win.setEnabled(true)
    }, 0)
    return true
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('quitApp', (event) => {
  BrowserWindow.fromWebContents(event.sender).close()
})

ipcMain.on('minimizeApp', (event) => {
  BrowserWindow.fromWebContents(event.sender).hide()
})
