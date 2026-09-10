import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'

let tray: Tray | null = null

function createTrayIcon() {
  return nativeImage.createFromBuffer(Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASpJREFUOE+lk7FKA0EQhr+7WQQLC0HEQgQLO0EfwEawsvMNfALfQJ9ALCwsrGwtLCysBK0URMQiISFe3nLZbMIWEiLdwbKz38y3+zMzO4j/0wjDMPyUc457cM4hxKCUQtJXRB8RsTIiDqDWeoYQAqUUx3F8BkBVVf24OI7L81wul3sAqKq6Gcfx6uVyKb4HcE0Az/PcXdf9B0DX9bZer99xHAdAPp8vvJbNZksAk8kU3m63FO12O4IgSBJkWRZLS0v3+v0+Ho+HcBwHnU7H+vr6Wq/Xq5PJpKZpGofD4a7rul6v15VOp2m1WqSUQqfTsdlsstvtst/vc7lcCiEEQRA8HA6fRVE0w7BtW0VR9G63C4fD8Xq9YFkWuq6TJMllWRa63S6bzQYhBDabDbvdDk3T2Gw2pJQik8k8k8nkGoZh2O/38/Pz4/V6TdM0gGmaEELIsiyqqjIMw6dpmgZVVU3TNGazGQC4ruu+76PrOqvViu/7eJ7HMAyGYYiiKDzP4xgGQRAE/7wBClpmy2XYE+oAAAAASUVORK5CYII=',
    'base64'
  ))
}

function showWindow(window: BrowserWindow): void {
  if (window.isDestroyed()) {
    return
  }

  window.show()
  window.focus()
}

export function createAppTray(window: BrowserWindow): Tray {
  if (tray) {
    return tray
  }

  tray = new Tray(createTrayIcon())
  tray.setToolTip('CSMS')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open',
        click: () => showWindow(window)
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])
  )
  tray.on('double-click', () => showWindow(window))

  return tray
}

export function destroyAppTray(): void {
  tray?.destroy()
  tray = null
}
