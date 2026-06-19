// player.js - Custom Native Player using hls.js

const Player = {
    hls: null,
    video: null,
    controlsTimeout: null,
    currentSources: [],
    currentServerIndex: 0,
    currentSubtitles: [],

    play: async (id, type = 'movie', s = 1, e = 1) => {
        Player.buildUI();
        Player.showLoader();

        try {
            // Attempt to fetch from Consumet (or your own backend that returns m3u8)
            // Due to public API instability, we use a robust fallback.
            const sources = await Player.fetchSources(id, type, s, e);
            Player.currentSources = sources.streams;
            Player.currentSubtitles = sources.subtitles || [];
            Player.currentServerIndex = 0;
            
            Player.hideLoader();
            Player.initVideo(Player.currentSources[0].url);
            Player.buildServerMenu();
            Player.buildSubtitlesMenu();
        } catch (error) {
            console.error("Failed to load sources", error);
            document.querySelector('.player-loader').innerHTML = `<div style="color:red;">Failed to load video sources. Please try again.</div>`;
        }
    },

    fetchSources: async (id, type, s, e) => {
        // In a production app, you would hit your own backend here, which would scrape/extract 
        // the raw .m3u8 files from FlixHQ, Gogoanime, or your preferred provider.
        // For demonstration of the native player capabilities, we return sample HLS streams.
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    streams: [
                        { name: "Server 1 (Auto)", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
                        { name: "Server 2 (Backup)", url: "https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8" }
                    ],
                    subtitles: [
                        { lang: "English", url: "#" }, // Dummy URLs
                        { lang: "Spanish", url: "#" }
                    ]
                });
            }, 1000); // simulate network request
        });
    },

    buildUI: () => {
        if (document.getElementById('active-player')) Player.close();

        const container = document.createElement('div');
        container.className = 'player-container';
        container.id = 'active-player';
        
        container.innerHTML = `
            <div class="native-video-player" id="video-wrapper">
                <video id="native-video" playsinline></video>
                
                <div class="player-loader">
                    <div class="player-spinner"></div>
                    <div style="color:var(--accent-primary); margin-top:10px;" id="player-loading-text">Extracting Streams...</div>
                </div>

                <div class="player-top-bar" id="player-top-bar">
                    <button class="player-close-btn" onclick="Player.close()"><i class="fas fa-arrow-left"></i></button>
                    <div class="player-title-display">Nexflix Native Player</div>
                    <div style="width: 40px;"></div>
                </div>

                <div class="player-controls" id="player-controls">
                    <div class="progress-container" id="progress-container">
                        <div class="progress-filled" id="progress-filled">
                            <div class="progress-thumb"></div>
                        </div>
                    </div>
                    
                    <div class="controls-main">
                        <div class="controls-left">
                            <button class="control-btn play-btn" id="play-pause-btn"><i class="fas fa-play"></i></button>
                            <button class="control-btn" id="skip-back-btn" title="Skip Backward 10s"><i class="fas fa-undo"></i><span style="font-size:0.6rem; position:absolute; margin-top:2px;">10</span></button>
                            <button class="control-btn" id="skip-forward-btn" title="Skip Forward 10s"><i class="fas fa-redo"></i><span style="font-size:0.6rem; position:absolute; margin-top:2px;">10</span></button>
                            <div class="time-display" id="time-display">00:00 / 00:00</div>
                        </div>
                        <div class="controls-right">
                            <button class="control-btn" id="subs-btn" title="Subtitles"><i class="fas fa-closed-captioning"></i></button>
                            <button class="control-btn" id="server-btn" title="Servers"><i class="fas fa-server"></i></button>
                            <button class="control-btn" id="fullscreen-btn" title="Fullscreen"><i class="fas fa-expand"></i></button>
                        </div>
                    </div>
                </div>

                <!-- Overlays -->
                <div class="player-overlay-menu" id="servers-menu">
                    <div class="overlay-menu-title">Select Server</div>
                    <div id="servers-list"></div>
                </div>
                
                <div class="player-overlay-menu" id="subs-menu">
                    <div class="overlay-menu-title">Subtitles</div>
                    <div id="subs-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        document.body.style.overflow = 'hidden';

        Player.video = document.getElementById('native-video');
        Player.attachEvents();
    },

    initVideo: (url) => {
        if (Hls.isSupported()) {
            if (Player.hls) Player.hls.destroy();
            Player.hls = new Hls();
            Player.hls.loadSource(url);
            Player.hls.attachMedia(Player.video);
            Player.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                Player.video.play().catch(e => console.log("Autoplay prevented"));
            });
        } else if (Player.video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari fallback
            Player.video.src = url;
            Player.video.addEventListener('loadedmetadata', () => {
                Player.video.play();
            });
        }
    },

    attachEvents: () => {
        const video = Player.video;
        const playBtn = document.getElementById('play-pause-btn');
        const progressContainer = document.getElementById('progress-container');
        const progressFilled = document.getElementById('progress-filled');
        const timeDisplay = document.getElementById('time-display');
        const wrapper = document.getElementById('video-wrapper');
        const controls = document.getElementById('player-controls');
        const topBar = document.getElementById('player-top-bar');

        // Play / Pause
        const togglePlay = () => {
            if (video.paused) video.play();
            else video.pause();
        };

        playBtn.onclick = togglePlay;
        video.onclick = togglePlay;

        video.onplay = () => playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        video.onpause = () => playBtn.innerHTML = '<i class="fas fa-play"></i>';

        // Time Update
        video.ontimeupdate = () => {
            const percent = (video.currentTime / video.duration) * 100;
            progressFilled.style.width = `${percent}%`;
            timeDisplay.innerText = `${Player.formatTime(video.currentTime)} / ${Player.formatTime(video.duration || 0)}`;
        };

        // Skip 10s
        document.getElementById('skip-back-btn').onclick = () => { video.currentTime -= 10; };
        document.getElementById('skip-forward-btn').onclick = () => { video.currentTime += 10; };

        // Progress Seek
        progressContainer.onclick = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * video.duration;
        };

        // Fullscreen
        document.getElementById('fullscreen-btn').onclick = () => {
            if (!document.fullscreenElement) wrapper.requestFullscreen().catch(err => {});
            else document.exitFullscreen();
        };

        // Menus
        document.getElementById('server-btn').onclick = (e) => {
            e.stopPropagation();
            document.getElementById('subs-menu').classList.remove('active');
            document.getElementById('servers-menu').classList.toggle('active');
        };

        document.getElementById('subs-btn').onclick = (e) => {
            e.stopPropagation();
            document.getElementById('servers-menu').classList.remove('active');
            document.getElementById('subs-menu').classList.toggle('active');
        };

        // Hide menus on click outside
        wrapper.addEventListener('click', (e) => {
            if (!e.target.closest('.player-overlay-menu') && !e.target.closest('.control-btn')) {
                document.getElementById('servers-menu').classList.remove('active');
                document.getElementById('subs-menu').classList.remove('active');
            }
        });

        // Hide controls on idle
        const resetIdle = () => {
            controls.classList.remove('hidden');
            topBar.classList.remove('hidden');
            document.body.style.cursor = 'default';
            clearTimeout(Player.controlsTimeout);
            Player.controlsTimeout = setTimeout(() => {
                if (!video.paused) {
                    controls.classList.add('hidden');
                    topBar.classList.add('hidden');
                    document.body.style.cursor = 'none';
                    document.getElementById('servers-menu').classList.remove('active');
                    document.getElementById('subs-menu').classList.remove('active');
                }
            }, 3000);
        };

        wrapper.onmousemove = resetIdle;
        wrapper.onmouseleave = () => { if (!video.paused) { controls.classList.add('hidden'); topBar.classList.add('hidden'); } };
    },

    buildServerMenu: () => {
        const list = document.getElementById('servers-list');
        list.innerHTML = Player.currentSources.map((srv, idx) => `
            <button class="menu-option ${idx === Player.currentServerIndex ? 'active' : ''}" onclick="Player.switchServer(${idx})">
                ${srv.name} ${idx === Player.currentServerIndex ? '<i class="fas fa-check"></i>' : ''}
            </button>
        `).join('');
    },

    buildSubtitlesMenu: () => {
        const list = document.getElementById('subs-list');
        let html = `
            <button class="menu-option active" onclick="Player.switchSub(-1)">
                Off <i class="fas fa-check"></i>
            </button>
        `;
        html += Player.currentSubtitles.map((sub, idx) => `
            <button class="menu-option" onclick="Player.switchSub(${idx})">
                ${sub.lang}
            </button>
        `).join('');
        list.innerHTML = html;
    },

    switchServer: (idx) => {
        Player.currentServerIndex = idx;
        Player.buildServerMenu();
        const currentTime = Player.video.currentTime;
        Player.initVideo(Player.currentSources[idx].url);
        // Attempt to resume from same time
        Player.video.addEventListener('loadedmetadata', function onLoaded() {
            Player.video.currentTime = currentTime;
            Player.video.removeEventListener('loadedmetadata', onLoaded);
        });
        document.getElementById('servers-menu').classList.remove('active');
    },

    switchSub: (idx) => {
        // Logic to switch native <track> elements or hls.js subtitle tracks
        // Visual UI update only for demo:
        const btns = document.getElementById('subs-list').querySelectorAll('.menu-option');
        btns.forEach(b => { b.classList.remove('active'); b.innerHTML = b.innerText; });
        btns[idx + 1].classList.add('active');
        btns[idx + 1].innerHTML += ' <i class="fas fa-check"></i>';
        document.getElementById('subs-menu').classList.remove('active');
    },

    showLoader: () => {
        const loader = document.querySelector('.player-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader: () => {
        const loader = document.querySelector('.player-loader');
        if (loader) loader.style.display = 'none';
    },

    formatTime: (seconds) => {
        if (isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    },

    close: () => {
        if (Player.hls) {
            Player.hls.destroy();
            Player.hls = null;
        }
        clearTimeout(Player.controlsTimeout);
        const player = document.getElementById('active-player');
        if (player) player.remove();
        document.body.style.overflow = '';
    }
};
