// player.js - Strict NEXSTREAM Player

const NEXSTREAM_API_KEY = 'nx_70be79c8cf332f432790e225124197f9';

const Player = {
    iframe: null,

    play: (id, type = 'movie', s = 1, e = 1) => {
        Player.buildUI();

        const apiUrl = type === 'movie' 
            ? `https://api.codespecters.com/embed/movie/${id}?apikey=${NEXSTREAM_API_KEY}`
            : `https://api.codespecters.com/embed/tv/${id}/${s}/${e}?apikey=${NEXSTREAM_API_KEY}`;

        Player.initIframe(apiUrl);
    },

    buildUI: () => {
        if (document.getElementById('active-player')) Player.close();

        const container = document.createElement('div');
        container.className = 'player-container';
        container.id = 'active-player';
        
        container.innerHTML = `
            <div class="native-video-player" id="video-wrapper">
                <div class="player-iframe-wrapper" style="width:100%; height:100%;" id="iframe-wrapper"></div>

                <div class="player-top-bar" id="player-top-bar">
                    <button class="player-close-btn" onclick="Player.close()"><i class="fas fa-arrow-left"></i></button>
                    <div class="player-title-display">Nexflix Video Player</div>
                    <div style="width: 40px;"></div>
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

        // Hide top bar on idle
        let controlsTimeout;
        const resetIdle = () => {
            topBar.classList.remove('hidden');
            document.body.style.cursor = 'default';
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(() => {
                topBar.classList.add('hidden');
            }, 3000);
        };

        wrapper.onmousemove = resetIdle;
    },

    close: () => {
        const player = document.getElementById('active-player');
        if (player) player.remove();
        document.body.style.overflow = '';
    }
};
