const game = document.getElementById('game')
const base = document.getElementById('base')
const bird = document.getElementById('bird')
const pipesContainer = document.getElementById('pipes')
const birdStartY = 80
const birdMaxY = 377
const minGravity = -30
const maxGravity = 10
const debugEnable = true
const pipeStartX = 405
const topPipeMin = -295
const bottomPipeMin = 80
const topPipeMax = -26
const bottomPipeMax = 374
const pipes = []

const keyboardEvents = ['click', 'keydown', 'keyup', 'touchstart']
const clickEvents = ['click', 'keydown', 'keyup', 'touchstart']
let isRunning = false
let bgPosition = 0
let intervalID = null
let gravity = 0
let frames = 0
let keyPressed = false
let birdColor = 'yellow'
let score = 0
let pipeIndex = 0
let pipeMinGapY = 80
let pipeMaxGapY = 150
let pipeMinGapX = 400
let pipeMaxGapX = 600

const debug = (id, val) => {
	if (!debugEnable) {
		document.getElementById('debugInfo').style.display = 'none'
	} else {
		document.getElementById('debugInfo').style.display = 'block'
	}
	document.getElementById(id).textContent = val
}

const changeBirdColor = color => {
	birdColor = color
	bird.src = `assets/sprites/${birdColor}bird-midflap.png`
}

const setGravityRange = () => {
	if (gravity < minGravity) {
		gravity = minGravity
	}
	if (gravity > maxGravity) {
		gravity = maxGravity
	}
	if (getBirdPosition() === 0) {
		gravity = 0.1
	}
	debug('gravityFactor', gravity)
}

const getBirdPosition = () => {
	const top = parseFloat(bird.style.top)
	document.getElementById('birdTop').textContent = top
	return top
}
const setBirdPosition = top => {
	if (top < 0) {
		top = 0
	} else if (top > birdMaxY) {
		top = birdMaxY
	}
	bird.style.top = top + 'px'
}

const birdIsCollided = () => {
	const birdIsCollided = getBirdPosition() >= birdMaxY
	debug('birdIsCollided', birdIsCollided)
	return birdIsCollided
}

const flap = () => {
	gravity -= 3
	setGravityRange()
}

const genetateGapY = top => {
	let gapY
	let maxGapY = pipeMaxGapY
	do {
		gapY = Math.random() * (maxGapY - pipeMinGapY) + pipeMinGapY
		// reduce number of loop reducing the max every loop
		if (gapY + top + 320 > bottomPipeMax && maxGapY - 15 > pipeMinGapY) {
			maxGapY -= 15
		}
	} while (gapY + top + 320 > bottomPipeMax)

	return gapY
}

const generateTopY = () => {
	const pipes = pipesContainer.getElementsByClassName('pipe')
	let min = topPipeMin
	let max = topPipeMax
	if (pipes.length) {
		//get last pipe top
		const lastTopPipeTop = parseFloat(pipes[pipes.length - 1].style.top)
		const lastBottomPipeTop = parseFloat(pipes[pipes.length - 2].style.top)
		const lastPipeGapY = (lastTopPipeTop - lastBottomPipeTop + 320) / 4
		let gapX = pipeMaxGapX / 20
		if (pipes.length >= 4) {
			//get previous pipe gapX
			gapX =
				(parseFloat(pipes[pipes.length - 3].style.left) -
					parseFloat(pipes[pipes.length - 1].style.left) -
					52) /
				20
		}
		min =
			lastTopPipeTop - 200 - lastPipeGapY - gapX < topPipeMin
				? topPipeMin
				: lastTopPipeTop - 200 - lastPipeGapY - gapX
		max =
			lastTopPipeTop + 200 + lastPipeGapY + gapX > topPipeMax
				? topPipeMax
				: lastTopPipeTop + 200 + lastPipeGapY + gapX
	}

	return Math.random() * (max - min) + min
}

//generate pipes
const generatePipes = () => {
	const pipes = pipesContainer.getElementsByClassName('pipe')
	const gameWidth = game.offsetWidth
	let nextTubeX = pipeStartX
	if (pipes.length) {
		const lastPipe = pipes[pipes.length - 1]
		nextTubeX =
			parseFloat(lastPipe.style.left) + (Math.random() * (pipeMinGapX - pipeMaxGapX) + pipeMinGapX)
	}

	// add new pipes
	while (nextTubeX < gameWidth) {
		pipeIndex++
		const top = generateTopY()
		const maxGapY =
			pipeMaxGapY - frames / 2400 >= pipeMinGapY ? pipeMaxGapY - frames / 2400 : pipeMinGapY
		const gapX = Math.random() * (maxGapY - pipeMinGapX) + pipeMinGapX
		const gapY = genetateGapY(top)
		const topPipe = document.createElement('img')
		topPipe.id = 'pipe' + pipeIndex
		topPipe.src = 'assets/sprites/pipe-green.png'
		topPipe.classList.add('pipe')
		topPipe.classList.add('pipeTop')
		topPipe.style.top = top + 'px'
		topPipe.style.left = nextTubeX + 'px'

		pipeIndex++
		const bottom = top + gapY + 320
		const bottomPipe = document.createElement('img')
		bottomPipe.id = 'pipe' + pipeIndex
		bottomPipe.src = 'assets/sprites/pipe-green.png'
		bottomPipe.classList.add('pipe')
		bottomPipe.classList.add('pipeBottom')
		bottomPipe.style.top = bottom + 'px'
		bottomPipe.style.left = nextTubeX + 'px'

		pipesContainer.appendChild(bottomPipe)
		pipesContainer.appendChild(topPipe)

		nextTubeX += gapX
	}
}

//update pipes
const updatePipes = () => {
	const pipes = pipesContainer.querySelectorAll('.pipe')
	if (!isRunning) {
		if (pipes.length) {
			for (const pipe of pipes) {
				pipe.remove()
			}
		}
	}
	for (const pipe of pipes) {
		const leftX = parseFloat(pipe.style.left)
		if (leftX < -52) {
			pipe.remove()
			continue
		}
		pipe.style.left = leftX - 3.57 + 'px'
	}
	generatePipes()
}

const startGame = () => {
	document.getElementById('gameOver').style.display = 'none'
	bird.src = `assets/sprites/${birdColor}bird-midflap.png`
	isRunning = true
	debug('IsRunning', isRunning)
	game.style.backgroundPositionX = '0px'
	base.style.backgroundPositionX = '0px'
	setBirdPosition(birdStartY)
	gravity = 0
	frames = 0
	score = 0
	pipeIndex = 0
	pipesContainer.style.display = 'block'
	intervalID = setInterval(main, 25)
}
const stopGame = () => {
	isRunning = false
	debug('IsRunning', isRunning)
	clearInterval(intervalID)
	document.getElementById('gameOver').style.display = 'block'
	updatePipes()
	pipesContainer.style.display = 'none'
}

const main = () => {
	if (!birdIsCollided()) {
		// moving bg
		game.style.backgroundPositionX = parseFloat(game.style.backgroundPositionX) - 4.64 + 'px'
		// moving base
		base.style.backgroundPositionX = parseFloat(base.style.backgroundPositionX) - 3.57 + 'px'

		updatePipes()

		// increase 0.1 evry minute, 24000 = 1000ms / 25ms * 60 / 0.1
		const gravityOverTime = frames / 24000
		debug('gravityIncrement', gravityOverTime)

		//incremet gravity
		gravity += 0.1 + gravityOverTime
		setGravityRange()
		debug('gravityFactor', gravity)

		// rotating the bird
		const rotation = gravity * 5
		bird.style.transform = 'rotate(' + rotation + 'deg)'
		debug('birdRotation', rotation)

		//changhing image scr based on the bird rotation
		if (rotation <= -3) {
			bird.src = `assets/sprites/${birdColor}bird-upflap.png`
		} else if (rotation > -3 && rotation <= 2) {
			bird.src = `assets/sprites/${birdColor}bird-midflap.png`
		} else {
			bird.src = `assets/sprites/${birdColor}bird-downflap.png`
		}

		setBirdPosition(getBirdPosition() + gravity)
		frames++
		debug('frames', frames)
		debug('seconds', Math.ceil(frames / 40))
	} else {
		stopGame()
	}
}

const playGame = () => {
	if (!isRunning) {
		startGame()
	}
	flap()
}

keyboardEvents.forEach(evnt => {
	window.addEventListener(evnt, e => {
		if (e.type === 'keydown' && e.code === 'Space') {
			if (!keyPressed) {
				keyPressed = true
				playGame()
			}
		}
		if (e.type === 'keyup' && e.code === 'Space') {
			keyPressed = false
		}
	})
})
clickEvents.forEach(evnt => {
	game.addEventListener(evnt, e => {
		playGame()
	})
})

debug('gravityFactor', gravity)
debug('IsRunning', isRunning)
debug('birdIsCollided', birdIsCollided())
debug('birdTop', birdStartY)
debug('frames', frames)
debug('birdRotation', 0)
debug('seconds', 0)
debug('gravityIncrement', 0)
