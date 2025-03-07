const dbus = require('dbus-next');

// Get DOM elements
const island = document.getElementById('island');
const minimalTitle = document.querySelector('.minimal-title');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const controls = document.getElementById('controls');

// State management
let currentSong = '';
let currentArtist = '';
let isExpanded = false;
let expandTimeout;
let collapseTimeout;

// Expand/collapse functions
function expandIsland() {
    clearTimeout(collapseTimeout);
    if (!isExpanded) {
        island.classList.add('expanded');
        isExpanded = true;
    }
}

function collapseIsland() {
    clearTimeout(expandTimeout);
    if (isExpanded) {
        collapseTimeout = setTimeout(() => {
            island.classList.remove('expanded');
            isExpanded = false;
        }, 300);
    }
}

island.addEventListener('mouseenter', () => {
    expandIsland();
});

island.addEventListener('mouseleave', (event) => {
    if (!controls.contains(event.relatedTarget)) {
        collapseIsland();
    }
});

    controls.addEventListener('mouseenter', () => {
    expandIsland();
});

controls.addEventListener('mouseleave', () => {
    collapseIsland();
});



// Test DBus connection
async function testDBusConnection() {
    try {
        const bus = await dbus.sessionBus();
        const obj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
        const iface = obj.getInterface('org.freedesktop.DBus');
        const names = await iface.ListNames();
        console.log('Available DBus services:', names);
        
        // Look for MPRIS services
        const mprisServices = names.filter(name => name.startsWith('org.mpris.MediaPlayer2'));
        console.log('Available MPRIS services:', mprisServices);
    } catch (error) {
        console.error('DBus connection test failed:', error);
    }
}

testDBusConnection();

async function getActivePlayer() {
    try {
        const bus = await dbus.sessionBus();
        const obj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
        const iface = obj.getInterface('org.freedesktop.DBus');
        const names = await iface.ListNames();
        
        // Specifically look for Spotify
        const spotifyService = 'org.mpris.MediaPlayer2.spotify';
        if (names.includes(spotifyService)) {
            return spotifyService;
        }
        
        // Fallback to other players if Spotify isn't found
        const mprisServices = names.filter(name => name.startsWith('org.mpris.MediaPlayer2'));
        return mprisServices[0] || null;
    } catch (error) {
        console.error('Error getting active player:', error);
        return null;
    }
}

async function updateMediaInfo() {
    try {
        const player = await getActivePlayer();
        if (!player) {
            document.querySelector('.minimal-title').textContent = 'No Media';
            document.getElementById('title').textContent = 'No media playing';
            document.getElementById('artist').textContent = '';
            document.getElementById('album-art').style.backgroundImage = '';
            document.querySelector('.minimal-art').style.backgroundImage = '';
            return;
        }

        const bus = await dbus.sessionBus();
        const obj = await bus.getProxyObject(player, '/org/mpris/MediaPlayer2');
        const properties = obj.getInterface('org.freedesktop.DBus.Properties');
        
        const metadataVariant = await properties.Get('org.mpris.MediaPlayer2.Player', 'Metadata');
        const metadata = metadataVariant.value;

        let title = metadata['xesam:title']?.value || metadata['xesam:title'] || 'Unknown';
        let artist = metadata['xesam:artist']?.value?.[0] || metadata['xesam:artist']?.[0] || 'Unknown';
        let artUrl = metadata['mpris:artUrl']?.value || metadata['mpris:artUrl'] || '';

        // Update minimal view
        document.querySelector('.minimal-title').textContent = title;
        if (artUrl) {
            document.querySelector('.minimal-art').style.backgroundImage = `url("${artUrl}")`;
            document.querySelector('.minimal-art').style.backgroundSize = 'cover';
        }

        // Update expanded view
        document.getElementById('title').textContent = title;
        document.getElementById('artist').textContent = artist;
        if (artUrl) {
            document.getElementById('album-art').style.backgroundImage = `url("${artUrl}")`;
            document.getElementById('album-art').style.backgroundSize = 'cover';
        }

        const playbackStatusVariant = await properties.Get('org.mpris.MediaPlayer2.Player', 'PlaybackStatus');
        const playbackStatus = playbackStatusVariant.value;
        const playButton = document.getElementById('play');
        playButton.textContent = playbackStatus === 'Playing' ? '⏸' : '⏯';

    } catch (error) {
        console.error('Error updating media info:', error);
        document.querySelector('.minimal-title').textContent = 'No Media';
        document.getElementById('title').textContent = 'No media playing';
        document.getElementById('artist').textContent = '';
        document.getElementById('album-art').style.backgroundImage = '';
        document.querySelector('.minimal-art').style.backgroundImage = '';
    }
}

// Media controls
async function handleMediaControl(action) {
    try {
        const bus = await dbus.sessionBus();
        const player = await bus.getProxyObject('org.mpris.MediaPlayer2.spotify', '/org/mpris/MediaPlayer2');
        const iface = player.getInterface('org.mpris.MediaPlayer2.Player');
        await iface[action]();
    } catch (error) {
        console.error(`Error executing ${action}:`, error);
    }
}

// Add click handlers for controls
document.getElementById('prev').addEventListener('click', (e) => {
    e.stopPropagation();
    handleMediaControl('prev');
});

document.getElementById('play').addEventListener('click', (e) => {
    e.stopPropagation();
    handleMediaControl('play');
});

document.getElementById('next').addEventListener('click', (e) => {
    e.stopPropagation();
    handleMediaControl('next');
});

// Media control handler
async function handleMediaControl(action) {
    try {
        const bus = await dbus.sessionBus();
        const player = await getActivePlayer();
        if (!player) return;

        const playerObj = await bus.getProxyObject(player, '/org/mpris/MediaPlayer2');
        const iface = playerObj.getInterface('org.mpris.MediaPlayer2.Player');

        switch(action) {
            case 'prev':
                await iface.Previous();
                break;
            case 'play':
                await iface.PlayPause();
                break;
            case 'next':
                await iface.Next();
                break;
        }
    } catch (error) {
        console.error(`Error executing ${action}:`, error);
    }
}

// Update the media info every second
setInterval(updateMediaInfo, 1000);
