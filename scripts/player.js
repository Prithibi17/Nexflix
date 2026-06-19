// player.js - NEXSTREAM Hybrid Player

const NEXSTREAM_API_KEY = 'nx_70be79c8cf332f432790e225124197f9';

const Player = {
    currentSources: [],
    currentServerIndex: 0,
    iframe: null,

    play: async (id, type = 'movie', s = 1, e = 1) => {
        Player.buildUI();
        Player.showLoader();

        try {
            const apiUrl = type === 'movie' 
                ? `https://api.codespecters.com/api/movie/${id}?apikey=${NEXSTREAM_API_KEY}`
                : `https://api.codespecters.com/api/tv/${id}/${s}/${e}?apikey=${NEXSTREAM_API_KEY}`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.success || !data.sources || data.sources.length === 0) {
                throw new Error("No sources found on NEXSTREAM.");
            }

            Player.currentSources = data.sources;
            Player.currentServerIndex = 0;
            
            Player.hideLoader();
            Player.initIframe(Player.currentSources[0].url);
            Player.buildServerMenu();
            
            // Set the title
            const titleEl = document.querySelector('.player-title-display');
            if (titleEl && data.meta && data.meta.title) {
                titleEl.innerText = data.meta.title + (type === 'tv' ? ` - S${s} E${e}` : '');
            }

        } catch (error) {
            console.error("Failed to load NEXSTREAM sources", error);
            document.querySelector('.player-loader').innerHTML = `<div style="color:red; text-align:center;">Failed to load video.<br>The requested title may not be available on NEXSTREAM yet.</div>`;
        }
    },

    buildUI: () => {
        if (document.getElementById('active-player')) Player.close();

        const container = document.createElement('div');
        container.className = 'player-container';
        container.id = 'active-player';
        
        container.innerHTML = `
            <div class="native-video-player" id="video-wrapper">
                <div class="player-iframe-wrapper" style="width:100%; height:100%;" id="iframe-wrapper"></div>
                
                <div class="player-loader">
                    <div class="player-spinner"></div>
                    <div style="color:var(--accent-primary); margin-top:10px;" id="player-loading-text">Loading NEXSTREAM...</div>
                </div>

                <div class="player-top-bar" id="player-top-bar">
                    <button class="player-close-btn" onclick="Player.close()"><i class="fas fa-arrow-left"></i></button>
                    <div class="player-title-display">Nexflix Video Player</div>
                    <div style="display:flex; gap:10px;">
                        <button class="control-btn" id="server-btn" title="Servers" style="background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 20px; font-size: 0.9rem;">
                            <i class="fas fa-server"></i> Servers
                        </button>
                    </div>
                </div>

                <!-- Overlays -->
                <div class="player-overlay-menu" id="servers-menu" style="bottom: auto; top: 70px;">
                    <div class="overlay-menu-title">Select Server</div>
                    <div id="servers-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        document.body.style.overflow = 'hidden';
        Player.attachEvents();
    },

    initIframe: (url) => {
        const wrapper = document.getElementById('iframe-wrapper');
        wrapper.innerHTML = `
            <iframe 
                id="nexstream-iframe"
                src="${url}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allowfullscreen>
            </iframe>
        `;
        Player.iframe = document.getElementById('nexstream-iframe');
    },

    attachEvents: () => {
        const wrapper = document.getElementById('video-wrapper');
        const topBar = document.getElementById('player-top-bar');

        // Menus
        document.getElementById('server-btn').onclick = (e) => {
            e.stopPropagation();
            document.getElementById('servers-menu').classList.toggle('active');
        };

        // Hide menus on click outside
        wrapper.addEventListener('click', (e) => {
            if (!e.target.closest('.player-overlay-menu') && !e.target.closest('.control-btn')) {
                document.getElementById('servers-menu').classList.remove('active');
            }
        });

        // Hide top bar on idle
        let controlsTimeout;
        const resetIdle = () => {
            topBar.classList.remove('hidden');
            document.body.style.cursor = 'default';
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => {
                topBar.classList.add('hidden');
                document.getElementById('servers-menu').classList.remove('active');
            }, 3000);
        };

        wrapper.onmousemove = resetIdle;
    },

    buildServerMenu: () => {
        const list = document.getElementById('servers-list');
        list.innerHTML = Player.currentSources.map((srv, idx) => `
            <button class="menu-option ${idx === Player.currentServerIndex ? 'active' : ''}" onclick="Player.switchServer(${idx})">
                ${srv.name || ('Server ' + (idx + 1))} ${idx === Player.currentServerIndex ? '<i class="fas fa-check"></i>' : ''}
            </button>
        `).join('');
    },

    switchServer: (idx) => {
        Player.currentServerIndex = idx;
        Player.buildServerMenu();
        Player.initIframe(Player.currentSources[idx].url);
        document.getElementById('servers-menu').classList.remove('active');
    },

    showLoader: () => {
        const loader = document.querySelector('.player-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader: () => {
        const loader = document.querySelector('.player-loader');
        if (loader) loader.style.display = 'none';
    },

    close: () => {
        const player = document.getElementById('active-player');
        if (player) player.remove();
        document.body.style.overflow = '';
    }
};
