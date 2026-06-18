// player.js - Logic for NexStream iframe integration

const NEXSTREAM_API_KEY = 'nx_70be79c8cf332f432790e225124197f9';

const Player = {
    play: (id, type = 'movie', s = 1, e = 1) => {
        // Create full screen overlay
        const playerContainer = document.createElement('div');
        playerContainer.className = 'player-container';
        playerContainer.id = 'active-player';
        
        let url = '';
        if (type === 'movie') {
            url = `https://api.codespecters.com/embed/movie/${id}?apikey=${NEXSTREAM_API_KEY}`;
        } else {
            url = `https://api.codespecters.com/embed/tv/${id}/${s}/${e}?apikey=${NEXSTREAM_API_KEY}`;
        }

        playerContainer.innerHTML = `
            <div class="player-header">
                <button class="icon-btn back-btn" onclick="Player.close()" aria-label="Close Player">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="player-title">Nexflix Player</div>
                <div style="width: 40px;"></div> <!-- Spacer -->
            </div>
            <div class="player-iframe-wrapper">
                <iframe 
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
    },

    close: () => {
        const player = document.getElementById('active-player');
        if (player) {
            player.remove();
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
};
