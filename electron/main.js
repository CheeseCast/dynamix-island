const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const dbus = require('dbus-next')

let mainWindow
let dbusConnection

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 100,
    frame: false,
    transparent: true,
    pointerOverlays: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,  // Changed to true for security
      preload: path.join(__dirname, 'preload.js')
    },
    alwaysOnTop: true
  })

  // In development, connect to Next.js dev server
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    // Open DevTools in development
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join('index.html'))
  }

  // Center window at the top of the primary monitor only
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { x, y, width } = primaryDisplay.workArea
  const windowX = Math.floor(x + (width - 600) / 2)
  mainWindow.setPosition(windowX, y + 5)
}

async function initializeDBus() {
  try {
    console.log('Initializing DBus connection...');
    const bus = await dbus.sessionBus();
    
    const obj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
    const iface = obj.getInterface('org.freedesktop.DBus');
    const names = await iface.ListNames();
    
    console.log('Available DBus services:', names);
    
    if (!names.includes('org.mpris.MediaPlayer2.spotify')) {
      console.log('Spotify is not running');
      mainWindow?.webContents.send('media-info-update', {
        title: 'Spotify not running',
        artist: 'Please start Spotify',
        artUrl: ''
      });
      return;
    }

    console.log('Connecting to Spotify...');
    const proxy = await bus.getProxyObject(
      'org.mpris.MediaPlayer2.spotify',
      '/org/mpris/MediaPlayer2'
    );
    
    const player = proxy.getInterface('org.mpris.MediaPlayer2.Player');
    const properties = proxy.getInterface('org.freedesktop.DBus.Properties');

    properties.on('PropertiesChanged', async (iface, changed) => {
      console.log('Properties changed:', iface, changed);
      if (iface === 'org.mpris.MediaPlayer2.Player') {
        await updateMediaInfo();
      }
    });

    dbusConnection = { bus, proxy, player, properties };
    console.log('DBus connection established');
    await updateMediaInfo();
  } catch (error) {
    console.error('Failed to initialize DBus:', error);
    mainWindow?.webContents.send('media-info-update', {
      title: 'Connection Error',
      artist: 'Check DBus connection',
      artUrl: ''
    });
  }
}

async function updateMediaInfo() {
  try {
    if (!dbusConnection?.properties) {
      console.error('No DBus connection available');
      return;
    }

    const [metadataVariant, playbackStatusVariant] = await Promise.all([
      dbusConnection.properties.Get(
        'org.mpris.MediaPlayer2.Player',
        'Metadata'
      ),
      dbusConnection.properties.Get(
        'org.mpris.MediaPlayer2.Player',
        'PlaybackStatus'
      )
    ]);

    const metadata = metadataVariant.value;
    const playbackStatus = playbackStatusVariant.value;

    console.log('Raw metadata:', metadata);
    console.log('Raw playback status:', playbackStatus);

    // Extract metadata carefully
    const mediaInfo = {
      title: metadata?.['xesam:title'] || 'Unknown',
      artist: Array.isArray(metadata?.['xesam:artist']) 
        ? metadata['xesam:artist'][0] 
        : (metadata?.['xesam:artist'] || 'Unknown Artist'),
      artUrl: metadata?.['mpris:artUrl'] || ''
    };

    console.log('Processed media info:', mediaInfo);

    // Send updates only if we have valid data
    if (mediaInfo.title !== 'Unknown' || mediaInfo.artist !== 'Unknown Artist') {
      mainWindow?.webContents.send('media-info-update', mediaInfo);
    }
    
    if (playbackStatus) {
      mainWindow?.webContents.send('playback-status-update', playbackStatus);
    }
  } catch (error) {
    console.error('Failed to update media info:', error, error.stack);
    // Send error state to renderer
    mainWindow?.webContents.send('media-info-update', {
      title: 'Error Getting Media Info',
      artist: error.message,
      artUrl: ''
    });
  }
}

// IPC handlers
ipcMain.on('media-control', async (event, action) => {
  console.log('Received media-control request:', action);
  try {
    if (dbusConnection?.player) {
      await dbusConnection.player[action]();
      // Update info after control action
      setTimeout(updateMediaInfo, 500);
    }
  } catch (error) {
    console.error(`Failed to execute ${action}:`, error);
  }
});

ipcMain.on('get-media-info', async (event) => {
  console.log('Received get-media-info request');
  await updateMediaInfo();
});

app.whenReady().then(() => {
  createWindow()
  initializeDBus()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})