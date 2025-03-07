const { contextBridge, ipcRenderer } = require('electron')

// Log when preload script is executed
console.log('Preload script is running...')

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      console.log(`Sending IPC message on channel ${channel}:`, data)
      ipcRenderer.send(channel, data)
    },
    on: (channel, func) => {
      console.log(`Setting up IPC listener for channel: ${channel}`)
      const subscription = (_event, ...args) => {
        console.log(`Received IPC message on channel ${channel}:`, ...args)
        func(...args)
      }
      ipcRenderer.on(channel, subscription)
      return () => {
        console.log(`Removing IPC listener for channel: ${channel}`)
        ipcRenderer.removeListener(channel, subscription)
      }
    },
    removeListener: (channel, func) => {
      console.log(`Removing IPC listener for channel: ${channel}`)
      ipcRenderer.removeListener(channel, func)
    }
  }
})

// Log when preload script is finished
console.log('Preload script finished loading')
