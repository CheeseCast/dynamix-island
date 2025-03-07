import { useState, useEffect } from 'react'

interface DBusValue<T> {
  signature: string;
  value: T;
}

interface MediaInfo {
  title?: DBusValue<string>;
  artist?: DBusValue<string[]>;
  artUrl?: DBusValue<string>;
}

interface ProcessedMediaInfo {
  title: string;
  artist: string;
  artUrl: string;
}

export const useMediaPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<ProcessedMediaInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const electron = (window as any).electron
    if (!electron) {
      setError('Electron not found in window object')
      console.error('Electron not found in window object')
      return
    }

    const { ipcRenderer } = electron

    // Listen for media info updates
    const mediaInfoHandler = (data: MediaInfo) => {
      console.log('Raw media info received:', data)
      if (!data) {
        console.warn('Received empty media info')
        return
      }

      // Process the DBus data structure
      const processedTrack = {
        title: data.title?.value || 'Not Playing',
        artist: data.artist?.value?.[0] || 'Unknown Artist',
        artUrl: data.artUrl?.value || ''
      }

      console.log('Processed track info:', processedTrack)
      setCurrentTrack(processedTrack)
    }

    // Listen for playback status updates
    const playbackStatusHandler = (status: DBusValue<string>) => {
      console.log('Raw playback status received:', status)
      const playingStatus = status?.value;
      if (typeof playingStatus === 'string') {
        console.log('Setting playback status:', playingStatus)
        setIsPlaying(playingStatus === 'Playing')
      } else {
        console.warn('Received invalid playback status format:', playingStatus)
      }
    }

    try {
      ipcRenderer.on('media-info-update', mediaInfoHandler)
      ipcRenderer.on('playback-status-update', playbackStatusHandler)
      
      console.log('Requesting initial media info...')
      ipcRenderer.send('get-media-info')

      const pollInterval = setInterval(() => {
        ipcRenderer.send('get-media-info')
      }, 2000)

      return () => {
        ipcRenderer.removeListener('media-info-update', mediaInfoHandler)
        ipcRenderer.removeListener('playback-status-update', playbackStatusHandler)
        clearInterval(pollInterval)
      }
    } catch (err) {
      setError(`Failed to set up IPC listeners: ${err}`)
      console.error('IPC setup error:', err)
    }
  }, [])

  const controls = {
    playPause: () => {
      const electron = (window as any).electron
      if (electron?.ipcRenderer) {
        electron.ipcRenderer.send('media-control', 'PlayPause')
      }
    },
    next: () => {
      const electron = (window as any).electron
      if (electron?.ipcRenderer) {
        electron.ipcRenderer.send('media-control', 'Next')
      }
    },
    previous: () => {
      const electron = (window as any).electron
      if (electron?.ipcRenderer) {
        electron.ipcRenderer.send('media-control', 'Previous')
      }
    }
  }

  return { currentTrack, isPlaying, controls, error }
}