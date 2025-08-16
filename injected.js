(function() {
    // Configuration
    const MAX_RETRIES = 20;
    const INITIAL_DELAY = 3000;
    const RETRY_DELAY = 1000;
    let retryCount = 0;
    let autoplayDone = false;

    console.log('Netflix AutoPlay started');

    // 1. Remove blocking elements while preserving fullscreen
    function removeBlockingElements() {
        const fullscreenElement = document.fullscreenElement;
        const elements = document.querySelectorAll('body *:not(:fullscreen)');
        let removedAny = false;
        
        for (let i = 0; i < elements.length; i++) {
            const style = getComputedStyle(elements[i]);
            if ((style.position === 'fixed' || style.position === 'sticky') && 
                !elements[i].contains(fullscreenElement)) {
                elements[i].remove();
                console.log('Removed blocking element');
                removedAny = true;
            }
        }
        return removedAny;
    }

   function tryAutoplay() {
        if (autoplayDone || retryCount >= MAX_RETRIES) return;
        
        try {
            // Verify player is fully loaded
            if (!window.netflix?.appContext?.state?.playerApp?.getAPI) {
                throw new Error('Netflix API not ready');
            }

            const api = netflix.appContext.state.playerApp.getAPI();
            const sessionIds = api.videoPlayer.getAllPlayerSessionIds();
            
            if (!sessionIds?.length) {
                throw new Error('No player sessions available');
            }

            const player = api.videoPlayer.getVideoPlayerBySessionId(sessionIds[0]);
            const video = document.querySelector('video');
            
            if (!player || typeof player.isPaused !== 'function' || !video) {
                throw new Error('Player/video not ready');
            }

            if (player.isPaused()) {
                console.log('Starting playback...');
                player.play().then(() => {
                    console.log('Autoplay successful');
                    autoplayDone = true;
                    // Now try removing elements after successful play
                    setTimeout(removeBlockingElements, 1000);
                }).catch(e => {
                    console.log('Playback failed:', e);
                    scheduleRetry();
                });
            } else {
                console.log('Video is already playing');
                //autoplayDone = true;
                // Elements can be removed now
                setTimeout(removeBlockingElements, 1000);
            }
            
        } catch (e) {
            console.log('Autoplay attempt failed:', e.message);
            scheduleRetry();
        }
    }

    function scheduleRetry() {
        if (retryCount++ < MAX_RETRIES) {
            console.log(`Retrying in ${RETRY_DELAY}ms (attempt ${retryCount}/${MAX_RETRIES})`);
            setTimeout(tryAutoplay, RETRY_DELAY);
        } else {
            console.log('Max retries reached');
        }
    }

    // 3. Main initialization
    function init() {
        console.log('Initializing - waiting for video load');
        
        // First try autoplay
        setTimeout(tryAutoplay, INITIAL_DELAY);

        window.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            event.preventDefault();
            const video = document.querySelector('video');
            if (video) {
                if (video.paused) {
                    video.play();
                    console.log('Video played via spacebar');
                } else {
                    video.pause();
                    console.log('Video paused via spacebar');
                }
            }
        }
    }, true); // <-- `true` enables "capture" phase
        
        // Setup observer for video element
        const observer = new MutationObserver((mutations, obs) => {
            const video = document.querySelector('video');
            if (video && video.readyState >= 3) {
                // Video is loaded, try removing elements
                removeBlockingElements();
                // Disconnect after first successful check
                obs.disconnect();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start when page is ready
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }
})();