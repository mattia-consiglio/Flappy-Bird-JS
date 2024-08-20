document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const body = document.getElementsByTagName('body')[0];
    const game = document.getElementById('game');
    const scoreElement = document.getElementById('score');
    const inputEnableDebug = document.getElementById('enableDebugCheckbox');
    const inputChangeGravity = document.getElementById('gravityRange');
    const inputChangeSpeed = document.getElementById('speedRange');
    const birdColorOptions = document.querySelectorAll('[name = "birdColor"]');
    const birdImages = {};
    // Game constants
    const GAME_WIDTH = game.offsetWidth;
    const GAME_HEIGHT = game.offsetHeight;
    const BIRD_WIDTH = 34;
    const BIRD_HEIGHT = 24;
    const PIPE_WIDTH = 52;
    const PIPE_MIN_GAP = 65;
    const PIPE_DEFAULT_MAX_GAP = 150;
    let pipeMaxGap = PIPE_DEFAULT_MAX_GAP;
    const FLAP_STRENGTH = -3.5;
    const PIPE_SPAWN_THRESHOLD = 150;
    const PIPE_SPEED = 2;
    const BIRD_X_POSITION = 50;
    const BIRD_ROTATION_FACTOR = 0.1;
    const BIRD_MAX_ROTATION = Math.PI / 4;
    const BIRD_MIN_ROTATION = BIRD_MAX_ROTATION * -1;
    const BIRD_MIDDLE_ROTATION_UPPER_RANGE = BIRD_MAX_ROTATION / 4;
    const BIRD_MIDDLE_ROTATION_LOWER_RANGE = BIRD_MIN_ROTATION / 4;
    const BACKGROUND_SPEED = 0.2;
    const BACKGROUND_WIDTH = 288;
    const BASE_HEIGHT = 112;
    const BASE_WIDTH = 336;
    const PIPE_MIN_Y = BASE_HEIGHT + 20;
    const TARGET_FPS = 30;
    let FPS_SPEED_FACTOR = null;
    getScreenRefreshRate(FPS => {
        FPS_SPEED_FACTOR = TARGET_FPS / FPS;
        // console.log(FPS_SPEED_FACTOR)
        if (settings.debugEnable) {
            document.getElementById('fps').innerText = `${FPS} FPS`;
            document.getElementById('FPS_SPEED_FACTOR').innerText = `${(FPS_SPEED_FACTOR * 100).toFixed(2)}%`;
        }
    });
    // Game state
    let isRunning = false;
    let birdY = 200;
    let birdVelocity = 0;
    let score = 0;
    let pipes = [];
    let bestScore = parseInt(localStorage.getItem('bestScore') || '') || 0;
    let isFalling = false;
    let birdRotation = 0;
    let gameOverTime = 0;
    const settings = localStorage.getItem('settings')
        ? JSON.parse(localStorage.getItem('settings'))
        : {
            baseGravity: 0.25,
            speedMultiplier: 1,
            birdColor: 'yellow',
            debugEnable: false,
        };
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    game.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    // Load assets
    let birdImage = new Image();
    const pipeImage = new Image();
    pipeImage.src = 'assets/sprites/pipe-green.png';
    const baseImage = new Image();
    baseImage.src = 'assets/sprites/base.png';
    const gameOverImage = new Image();
    gameOverImage.src = 'assets/sprites/gameover.png';
    const backgroundImage = new Image();
    backgroundImage.src = 'assets/sprites/background-day.png';
    // Pipe object pool
    const POOL_SIZE = 10;
    const getCircleLineIntersectionPoints = (circleX, circleY, radius, lineX) => {
        const distanceToLine = Math.abs(lineX - circleX);
        if (distanceToLine > radius) {
            // no intersection
            return null;
        }
        const distanceToIntersection = Math.sqrt(radius * radius - distanceToLine * distanceToLine);
        const higherIntersectionY = circleY - distanceToIntersection;
        const lowerIntersectionY = circleY + distanceToIntersection;
        return [higherIntersectionY, lowerIntersectionY];
    };
    const generateRandomPipeValues = (maxY, minY) => {
        // Calculate the effective flap strength relative to the base gravity
        const effectiveFlapStrength = Math.abs(FLAP_STRENGTH) * (settings.baseGravity / 0.25);
        // Calculate the minimum gap required for the bird to pass through based on effective flap strength and speed
        const minGapRequired = Math.ceil(BIRD_HEIGHT + effectiveFlapStrength * settings.speedMultiplier * FPS_SPEED_FACTOR);
        // Ensure the minimum gap is not smaller than the predefined PIPE_MIN_GAP
        const adjustedMinGap = Math.max(minGapRequired, PIPE_MIN_GAP);
        // Generate a random pipe gap within the adjusted range
        const pipeGap = Math.floor(Math.random() * (pipeMaxGap - adjustedMinGap + 1)) + adjustedMinGap;
        // Calculate the maximum and minimum pipe positions based on the game height and gap
        const pipeMaxY = maxY
            ? Math.min(maxY, GAME_HEIGHT - pipeGap - 120)
            : GAME_HEIGHT - pipeGap - 120;
        const pipeMinY = minY ? Math.max(minY, PIPE_MIN_Y) : PIPE_MIN_Y;
        // Generate a random pipe position within the calculated range
        const pipeY = Math.random() * (pipeMaxY - pipeMinY) + pipeMinY;
        return [pipeGap, pipeY];
    };
    const generatePipe = () => {
        let pipeGapY;
        let pipeY;
        if (pipes.length > 0) {
            const lastPipe = pipes[pipes.length - 1];
            const radius = (lastPipe.gapX + PIPE_WIDTH) * 1.2;
            let [minY, maxY] = getCircleLineIntersectionPoints(lastPipe.x + lastPipe.gapX + PIPE_WIDTH, lastPipe.y + lastPipe.gapY / 2, radius, lastPipe.x + lastPipe.gapX + PIPE_WIDTH);
            const values = generateRandomPipeValues(maxY, minY);
            pipeGapY = values[0];
            pipeY = values[1];
        }
        else {
            const values = generateRandomPipeValues();
            pipeGapY = values[0];
            pipeY = values[1];
        }
        const newPipe = {
            x: GAME_WIDTH,
            y: pipeY,
            gapY: pipeGapY,
            gapX: PIPE_SPAWN_THRESHOLD,
            active: false,
            scored: false,
        };
        newPipe.x = GAME_WIDTH;
        newPipe.active = true;
        return newPipe;
    };
    const initPipes = () => {
        for (let i = 0; i < POOL_SIZE; i++) {
            pipes.push(generatePipe());
        }
    };
    const updatePipes = () => {
        const lastPipe = pipes.length > 0 ? pipes[pipes.length - 1] : null;
        if (lastPipe === null || (lastPipe === null || lastPipe === void 0 ? void 0 : lastPipe.x) < GAME_WIDTH - lastPipe.gapX) {
            pipes.push(generatePipe());
        }
        pipes = pipes.filter(pipe => {
            pipe.x -= PIPE_SPEED * settings.speedMultiplier * FPS_SPEED_FACTOR;
            if (pipe.x + PIPE_WIDTH < 0) {
                pipe.active = false;
                return false;
            }
            return true;
        });
    };
    const isBirdCollided = () => {
        const birdBox = {
            left: BIRD_X_POSITION,
            right: BIRD_X_POSITION + BIRD_WIDTH,
            top: birdY,
            bottom: birdY + BIRD_HEIGHT,
        };
        const firstPipe = pipes[0];
        const topPipeBox = {
            left: firstPipe.x,
            right: firstPipe.x + PIPE_WIDTH,
            top: 0,
            bottom: firstPipe.y,
        };
        const bottomPipeBox = {
            left: firstPipe.x,
            right: firstPipe.x + PIPE_WIDTH,
            top: firstPipe.y + firstPipe.gapY,
            bottom: GAME_HEIGHT,
        };
        return ((birdBox.right >= topPipeBox.left &&
            birdBox.left <= topPipeBox.right &&
            birdBox.top <= topPipeBox.bottom) ||
            (birdBox.right >= bottomPipeBox.left &&
                birdBox.left <= bottomPipeBox.right &&
                birdBox.bottom >= bottomPipeBox.top) ||
            birdY + BIRD_HEIGHT >= GAME_HEIGHT - BASE_HEIGHT);
    };
    const updateScore = () => {
        pipes.forEach(pipe => {
            if (pipe.x + PIPE_WIDTH < BIRD_X_POSITION && !pipe.scored && scoreElement) {
                score++;
                pipe.scored = true;
                scoreElement.textContent = score.toString();
            }
        });
    };
    const setBirdRotation = () => {
        birdRotation = Math.min(BIRD_MAX_ROTATION, Math.max(BIRD_MIN_ROTATION, birdVelocity * BIRD_ROTATION_FACTOR));
        if (birdRotation < BIRD_MIDDLE_ROTATION_UPPER_RANGE) {
            birdImage = birdImages[`assets/sprites/${settings.birdColor}bird-upflap.png`];
        }
        else if (birdRotation > BIRD_MIDDLE_ROTATION_LOWER_RANGE) {
            birdImage = birdImages[`assets/sprites/${settings.birdColor}bird-downflap.png`];
        }
        else {
            birdImage = birdImages[`assets/sprites/${settings.birdColor}bird-midflap.png`];
        }
    };
    const baseY = GAME_HEIGHT - BASE_HEIGHT;
    let baseX = 0;
    let backgroundX = 0;
    const drawGame = () => {
        if (!ctx)
            return;
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        setBirdRotation();
        // Draw background
        if (isRunning) {
            backgroundX -= PIPE_SPEED * settings.speedMultiplier * FPS_SPEED_FACTOR * BACKGROUND_SPEED;
            if (backgroundX <= -BACKGROUND_WIDTH) {
                backgroundX = 0;
            }
        }
        let currentBackgroundX = backgroundX;
        while (currentBackgroundX < GAME_WIDTH) {
            ctx.drawImage(backgroundImage, currentBackgroundX, 0);
            currentBackgroundX += BACKGROUND_WIDTH - 1;
        }
        // Draw bird
        ctx.save();
        ctx.translate(BIRD_X_POSITION + BIRD_WIDTH / 2, birdY + BIRD_HEIGHT / 2);
        ctx.rotate(birdRotation);
        ctx.drawImage(birdImage, -BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
        ctx.restore();
        // Draw pipes
        pipes.forEach(pipe => {
            // Draw top pipe (mirrored vertically)
            ctx.save();
            ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.y);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImage, -PIPE_WIDTH / 2, 0);
            ctx.restore();
            // Draw bottom pipe
            ctx.drawImage(pipeImage, pipe.x, pipe.y + pipe.gapY);
        });
        // Draw base
        // pipe.x -= PIPE_SPEED * settings.speedMultiplier
        if (isRunning) {
            baseX -= PIPE_SPEED * settings.speedMultiplier * FPS_SPEED_FACTOR;
            if (baseX <= -BASE_WIDTH) {
                baseX = 0;
            }
        }
        let currentBaseX = baseX;
        while (currentBaseX < GAME_WIDTH) {
            ctx.drawImage(baseImage, currentBaseX, baseY);
            currentBaseX += BASE_WIDTH - 1;
        }
    };
    const updateBestScore = () => {
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('bestScore', bestScore.toString());
        }
    };
    const animateFallingBird = () => {
        if (!ctx)
            return;
        if (isFalling) {
            birdVelocity += settings.baseGravity;
            birdY += birdVelocity;
            const firstPipe = pipes[0];
            const birdRightX = BIRD_X_POSITION + BIRD_WIDTH / 2;
            // Check if the bird hits the base
            if (birdY + BIRD_HEIGHT > GAME_HEIGHT - BASE_HEIGHT && birdRightX <= firstPipe.x) {
                birdY = GAME_HEIGHT - BASE_HEIGHT - BIRD_HEIGHT;
                birdVelocity = 0;
                isFalling = false;
                updateBestScore();
                drawGameOver();
            }
            else if (
            // Check if the bird hits the top of the bottom tube
            birdY < firstPipe.y + firstPipe.gapY &&
                birdY + BIRD_HEIGHT > firstPipe.y + firstPipe.gapY &&
                BIRD_X_POSITION + BIRD_WIDTH > firstPipe.x &&
                BIRD_X_POSITION < firstPipe.x + PIPE_WIDTH) {
                birdY = firstPipe.y + firstPipe.gapY;
                birdVelocity = 0;
                isFalling = false;
                updateBestScore();
                drawGameOver();
                return;
            }
            // Rotate the bird based on velocity
            const birdRotation = Math.min(BIRD_MAX_ROTATION, Math.max(BIRD_MIN_ROTATION, birdVelocity * BIRD_ROTATION_FACTOR));
            // Draw the game and the falling bird
            drawGame();
            ctx.save();
            ctx.translate(BIRD_X_POSITION + BIRD_WIDTH / 2, birdY + BIRD_HEIGHT / 2);
            ctx.rotate(birdRotation);
            ctx.drawImage(birdImage, -BIRD_WIDTH / 2, -BIRD_HEIGHT / 2, BIRD_WIDTH, BIRD_HEIGHT);
            ctx.restore();
            requestAnimationFrame(animateFallingBird);
        }
        else {
            updateBestScore();
            drawGameOver();
        }
    };
    const drawGameOver = () => {
        if (!ctx)
            return;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        const gameOverWidth = 192;
        const gameOverHeight = 42;
        const gameOverX = (GAME_WIDTH - gameOverWidth) / 2;
        const gameOverY = 150;
        ctx.drawImage(gameOverImage, gameOverX, gameOverY, gameOverWidth, gameOverHeight);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Your Best Score: ${bestScore}`, GAME_WIDTH / 2, gameOverY + gameOverHeight + 30);
    };
    const gameLoop = () => {
        if (!isRunning)
            return;
        birdVelocity += settings.baseGravity;
        birdY += birdVelocity;
        // Limit the bird's y position
        if (birdY < 0) {
            birdY = 0;
            birdVelocity = 0;
        }
        else if (birdY > GAME_HEIGHT - BIRD_HEIGHT) {
            birdY = GAME_HEIGHT - BIRD_HEIGHT;
            birdVelocity = 0;
        }
        updatePipes();
        updateScore();
        if (isBirdCollided()) {
            isRunning = false;
            gameOverTime = Date.now();
            if (birdY + BIRD_HEIGHT > GAME_HEIGHT - BASE_HEIGHT) {
                // Bird hits the ground
                birdY = GAME_HEIGHT - BASE_HEIGHT - BIRD_HEIGHT;
                birdVelocity = 0;
                updateBestScore();
                drawGameOver();
            }
            else {
                // Bird hits the sides of the tubes
                isFalling = true;
                animateFallingBird();
            }
        }
        else {
            drawGame();
            requestAnimationFrame(gameLoop);
        }
    };
    const startGame = () => {
        isRunning = true;
        birdY = 200;
        birdVelocity = 0;
        score = 0;
        pipes = [];
        if (scoreElement) {
            scoreElement.textContent = '0';
        }
        gameLoop();
    };
    const flapBird = () => {
        if (isRunning) {
            birdVelocity = FLAP_STRENGTH;
        }
        else if (Date.now() - gameOverTime >= 2000) {
            startGame();
        }
    };
    const updateSettings = () => {
        localStorage.setItem('settings', JSON.stringify(settings));
    };
    const updateRangeInput = (input) => {
        const max = parseFloat(input.max);
        const min = parseFloat(input.min);
        const value = parseFloat(input.value);
        let perc = 0;
        if (value > min) {
            perc = Math.floor(((value - min) / (max - min)) * 100);
        }
        input.style.setProperty('--value', perc + '%');
    };
    const toggleDebug = (enable) => {
        settings.debugEnable = enable;
        updateSettings();
        const debugInfo = document.getElementById('debugInfo');
        if (!debugInfo)
            return;
        if (!enable) {
            debugInfo.style.display = 'none';
        }
        else {
            debugInfo.style.display = 'block';
        }
        settings.debugEnable = enable;
    };
    const changeBirdColor = (color, init = false) => {
        if (color === settings.birdColor && !init)
            return;
        settings.birdColor = color;
        body.setAttribute('class', settings.birdColor);
        updateSettings();
        if (Array.from(birdColorOptions).filter(option => option.checked === true && option.value === color).length === 0) {
            birdColorOptions.forEach(option => {
                option.checked = false;
            });
            const colorOption = Array.from(birdColorOptions).filter(option => option.value === color)[0];
            if (colorOption) {
                colorOption.checked = true;
            }
        }
        // Preload and cache bird images
        const validColors = ['red', 'blue', 'yellow']; // Add all valid color options
        if (validColors.includes(color)) {
            const birdImageUrls = [
                `assets/sprites/${color}bird-upflap.png`,
                `assets/sprites/${color}bird-midflap.png`,
                `assets/sprites/${color}bird-downflap.png`,
            ];
            birdImageUrls.forEach(url => {
                if (!birdImages[url]) {
                    const img = new Image();
                    img.src = url;
                    birdImages[url] = img;
                }
            });
            if (init) {
                birdImage = birdImages[`assets/sprites/${color}bird-midflap.png`];
            }
        }
    };
    // Event listeners
    document.addEventListener('keydown', e => {
        if (e.code === 'Space') {
            e.preventDefault();
            flapBird();
        }
    });
    game === null || game === void 0 ? void 0 : game.addEventListener('click', flapBird);
    birdColorOptions.forEach(option => {
        option.addEventListener('change', () => {
            console.log(option.value);
            changeBirdColor(option.value);
        });
    });
    inputEnableDebug === null || inputEnableDebug === void 0 ? void 0 : inputEnableDebug.addEventListener('change', (e) => {
        const target = e.target;
        toggleDebug(target.checked);
    });
    inputChangeGravity === null || inputChangeGravity === void 0 ? void 0 : inputChangeGravity.addEventListener('input', e => {
        const target = e.target;
        settings.baseGravity = parseFloat(target.value);
        updateSettings();
        updateRangeInput(target);
    });
    inputChangeSpeed === null || inputChangeSpeed === void 0 ? void 0 : inputChangeSpeed.addEventListener('input', e => {
        const target = e.target;
        settings.speedMultiplier = parseFloat(target.value);
        updateSettings();
        updateRangeInput(target);
    });
    // Initial setup
    birdImage.onload =
        pipeImage.onload =
            baseImage.onload =
                () => {
                    drawGame();
                };
    initPipes();
    // Load settings
    inputChangeGravity.value = settings.baseGravity.toString();
    inputChangeSpeed.value = settings.speedMultiplier.toString();
    updateRangeInput(inputChangeGravity);
    updateRangeInput(inputChangeSpeed);
    changeBirdColor(settings.birdColor, true);
    toggleDebug(settings.debugEnable);
});
//# sourceMappingURL=game.js.map