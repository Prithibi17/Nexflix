// player.js - Logic for NexStream iframe integration

const NEXSTREAM_API_KEY = 'nx_70be79c8cf332f432790e225124197f9';

const Player = {
    servers: [
        { id: 'nexstream', name: 'Server 1 (NexStream)' },
        { id: 'vidlink', name: 'Server 2 (VidLink)' },
        { id: 'vidsrcme', name: 'Server 3 (VidSrc.me)' },
        { id: 'vidsrcto', name: 'Server 4 (VidSrc.to)' },
        { id: 'superembed', name: 'Server 5 (SuperEmbed)' }
    ],

    getServerUrl: (serverId, id, type, s, e) => {
        const lang = window.currentAudioLanguage || 'sub';
        const langParam = lang === 'dub' ? '&audio=dub&lang=en&dub=1' : '&audio=sub&lang=ja&dub=0';

        switch (serverId) {
            case 'nexstream':
                return type === 'movie' 
                    ? `https://api.codespecters.com/embed/movie/${id}?apikey=${NEXSTREAM_API_KEY}${langParam}`
                    : `https://api.codespecters.com/embed/tv/${id}/${s}/${e}?apikey=${NEXSTREAM_API_KEY}${langParam}`;
            case 'vidlink':
                return type === 'movie'
                    ? `https://vidlink.pro/movie/${id}?primaryColor=8b7cff`
                    : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=8b7cff`;
            case 'vidsrcme':
                return type === 'movie'
                    ? `https://vidsrc.me/embed/movie?tmdb=${id}`
                    : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`;
            case 'vidsrcto':
                return type === 'movie'
                    ? `https://vidsrc.to/embed/movie/${id}`
                    : `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
            case 'superembed':
                return type === 'movie'
                    ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
                    : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`;
            default:
                return '';
        }
    },

    play: (id, type = 'movie', s = 1, e = 1) => {
        // Create full screen overlay
        const playerContainer = document.createElement('div');
        playerContainer.className = 'player-container';
        playerContainer.id = 'active-player';
        
        // Get preferred server
        let currentServer = 'nexstream';
        try { currentServer = localStorage.getItem('nexflix_preferred_server') || 'nexstream'; } catch(err) {}

        const url = Player.getServerUrl(currentServer, id, type, s, e);

        let serverOptions = Player.servers.map(srv => 
            `<option value="${srv.id}" ${srv.id === currentServer ? 'selected' : ''}>${srv.name}</option>`
        ).join('');

        playerContainer.innerHTML = `
            <div class="player-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px;">
                <button class="icon-btn back-btn" onclick="Player.close()" aria-label="Close Player">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="player-title" style="flex: 1; text-align: center;">Nexflix Player</div>
                <select id="player-server-select" style="background: rgba(0,0,0,0.6); color: #fff; border: 1px solid #8b7cff; border-radius: 4px; padding: 5px 10px; cursor: pointer; outline: none; margin-right: 20px;">
                    ${serverOptions}
                </select>
            </div>
            <div class="player-iframe-wrapper">
                <iframe 
                    id="player-iframe"
                    src="${url}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen>
                </iframe>
            </div>
        `;

        document.body.appendChild(playerContainer);
        document.body.style.overflow = 'hidden'; // Prevent scrolling under player

        // Add event listener for server switch
        document.getElementById('player-server-select').addEventListener('change', (event) => {
            const newServer = event.target.value;
            try { localStorage.setItem('nexflix_preferred_server', newServer); } catch(err) {}
            document.getElementById('player-iframe').src = Player.getServerUrl(newServer, id, type, s, e);
        });
    },

    close: () => {
        const player = document.getElementById('active-player');
        if (player) {
            player.remove();
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
};
