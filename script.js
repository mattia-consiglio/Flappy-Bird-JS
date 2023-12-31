const game = document.getElementById('game')
const base = document.getElementById('base')
const bird = document.getElementById('bird')
const pipesContainer = document.getElementById('pipes')
const inputEnableDebug = document.getElementById('enableDebugCheckbox')
const inputChangeGravity = document.getElementById('gravityRange')
const inputChangeSpeed = document.getElementById('speedRange')
const birdLeftX = parseFloat(window.getComputedStyle(bird).getPropertyValue('left'))
const birdWidth = parseFloat(window.getComputedStyle(bird).getPropertyValue('width'))
const birdHeight = parseFloat(window.getComputedStyle(bird).getPropertyValue('height'))
let gameWidth = game.offsetWidth

const birdStartY = 80
let birdY = birdStartY
const birdMaxY = 377
const minGravity = -30
const maxGravity = 10
let debugEnable = false
let pipeStartX = gameWidth * 0.7
const topPipeMin = -295
const bottomPipeMin = 80
const topPipeMax = -26
const bottomPipeMax = 374
const pipes = []

const keyboardEvents = ['click', 'keydown', 'keyup']
const clickEvents = ['click', 'keydown', 'keyup', 'touchstart']
let isRunning = false
let endigSequence = false
let bgPosition = 0
let intervalID = null
let gravity = 0
let frames = 0
let keyPressed = false
let birdColor = 'yellow'
let score = 0
let pipeIndex = 0
let pipeMinGapY = 80
let pipeMaxGapY = 100
let pipeMinGapX = 200
let pipeMaxGapX = 300
let bestScore = 0

let lastFrameTime = 0
let baseGravity = 0.2
let speedMultiplier = 1
let settings = {
	birdColor,
	debugEnable,
	baseGravity,
	speedMultiplier,
	bestScore,
}
const pipesArr = []

const updateSettings = () => {
	localStorage.setItem('setting', JSON.stringify(settings))
}

const toggleDebug = enable => {
	if (!enable) {
		document.getElementById('debugInfo').style.display = 'none'
	} else {
		document.getElementById('debugInfo').style.display = 'block'
	}
	settings.debugEnable = enable
	updateSettings()
}

const debug = (id = null, val = null) => {
	if (debugEnable && id !== null && val !== null) {
		document.getElementById(id).innerText = val
	}
}

const changeBaseGravity = gravity => {
	baseGravity = parseFloat(gravity)
	settings.baseGravity = baseGravity
	updateSettings()
}

const changeSpeedMultiplier = speed => {
	speedMultiplier = parseFloat(speed)
	settings.speedMultiplier = speedMultiplier
	updateSettings()
}

const sleep = delay => new Promise(resolve => setTimeout(resolve, delay))

const changeBirdColor = color => {
	if (typeof color === 'string') {
		birdColor = color
	} else {
		birdColor = color.value
	}
	bird.src = `assets/sprites/${birdColor}bird-midflap.png`
	const body = document.getElementsByTagName('body')[0]
	body.setAttribute('class', birdColor)
	// body.className = color
	settings.birdColor = birdColor
	updateSettings()
}

const setGravityRange = () => {
	if (gravity < minGravity) {
		gravity = minGravity
	}
	if (gravity > maxGravity) {
		gravity = maxGravity
	}
	if (getBirdPosition() === 0) {
		gravity = baseGravity
	}
	debug('gravityFactor', gravity)
}

const getBirdPosition = () => {
	debug('birdTop', birdY)
	return birdY
}
const setBirdPosition = top => {
	if (top < 0) {
		top = 0
	} else if (top > birdMaxY) {
		top = birdMaxY
	}
	birdY = top
	bird.style.top = top + 'px'
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
	let max = topPipeMin + 34 + 80
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
	let nextTubeX = pipeStartX
	if (pipes.length) {
		const lastPipe = pipes[pipes.length - 1]
		nextTubeX =
			parseFloat(lastPipe.style.left) + (Math.random() * (pipeMaxGapX - pipeMinGapX) + pipeMinGapX)
	}

	// add new pipes
	while (nextTubeX < gameWidth) {
		pipeIndex++
		const top = generateTopY()
		const gapX = Math.random() * (pipeMaxGapX - pipeMinGapX) + pipeMinGapX
		const gapY = genetateGapY(top)
		const topPipe = document.createElement('img')
		topPipe.id = 'pipe' + pipeIndex
		topPipe.src = 'assets/sprites/pipe-green.png'
		topPipe.classList.add('pipe')
		topPipe.classList.add('pipeTop')
		topPipe.style.top = top + 'px'
		topPipe.style.left = nextTubeX + 'px'
		pipesArr.push({ id: 'pipe' + pipeIndex, left: nextTubeX })

		pipeIndex++
		const bottom = top + gapY + 320
		const bottomPipe = document.createElement('img')
		bottomPipe.id = 'pipe' + pipeIndex
		bottomPipe.src = 'assets/sprites/pipe-green.png'
		bottomPipe.classList.add('pipe')
		bottomPipe.classList.add('pipeBottom')
		bottomPipe.style.top = bottom + 'px'
		bottomPipe.style.left = nextTubeX + 'px'
		pipesArr.push({ id: 'pipe' + pipeIndex, left: nextTubeX })

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
		pipe.style.left = leftX - 3.57 * speedMultiplier + 'px'
	}
	generatePipes()
}

const updateScore = () => {
	if (isRunning) {
		const pipes = pipesContainer.getElementsByClassName('pipe')
		if (pipes.length) {
			let firstPipe = pipes[0]

			const firstPipeLeftX = parseFloat(firstPipe.style.left)

			const gapX = firstPipeLeftX - birdLeftX - birdWidth
			debug('birdGapX', gapX)

			// 52px is th width of the pipe
			// Prevent counting score multiple time if bird is out of pipe
			// 60 frames === 1.5 second (40 frames per second)
			if (gapX <= -52 && frames - lastFrameTime >= 60) {
				score++
				lastFrameTime = frames
				debug('lastFrameTime', lastFrameTime)
			}
			document.getElementById('score').textContent = score
		}
	}
}

const birdIsCollided = () => {
	let birdIsCollided = false
	//check colision with the ground
	if (getBirdPosition() >= birdMaxY) {
		birdIsCollided = true
		debug('birdIsCollided', birdIsCollided)

		return birdIsCollided
	}
	//check colision with pipes
	const pipes = pipesContainer.getElementsByClassName('pipe')
	if (pipes.length) {
		const birdTopY = parseFloat(bird.style.top)

		for (const pipe of pipes) {
			const pipeLeftX = parseFloat(pipe.style.left)
			const pipeWidth = 52
			const pipeTopY = parseFloat(pipe.style.top)
			const pipeHeight = 320
			if (
				birdLeftX + birdWidth > pipeLeftX &&
				birdLeftX < pipeLeftX + pipeWidth &&
				birdTopY + birdHeight > pipeTopY &&
				birdTopY < pipeTopY + pipeHeight
			) {
				birdIsCollided = true
				debug('birdIsCollided', birdIsCollided)

				return birdIsCollided
			}
		}
		birdIsCollided = false
		debug('birdIsCollided', birdIsCollided)
		return birdIsCollided
	}

	return birdIsCollided
}

const flap = () => {
	if (isRunning && !birdIsCollided()) {
		gravity -= 3
		setGravityRange()
	}
}

const startGame = () => {
	debug('endigSequence', endigSequence)
	debug('IsRunning', isRunning)

	document.getElementById('gameOver').style.display = 'none'
	bird.src = `assets/sprites/${birdColor}bird-midflap.png`
	isRunning = true
	game.style.backgroundPositionX = '0px'
	base.style.backgroundPositionX = '0px'
	setBirdPosition(birdStartY)
	gravity = 0
	frames = 0
	score = 0
	lastFrameTime = 0
	pipesContainer.style.display = 'block'
	intervalID = setInterval(main, 25)
	debug('IsRunning', isRunning)
}
const stopGame = async () => {
	gravity = maxGravity
	isRunning = false
	debug('IsRunning', isRunning)
	debug('endigSequence', endigSequence)
	console.log(bestScore)

	bestScore = score > bestScore ? score : bestScore
	settings.bestScore = bestScore
	updateSettings()

	if (!endigSequence) {
		endigSequence = true
		await sleep(900 * (1 - parseFloat(bird.style.top) / birdMaxY))

		clearInterval(intervalID)
		pipesContainer.style.display = 'none'
		pipeIndex = 0
		updatePipes()
		document.getElementById('bestScore').innerText = bestScore
		document.getElementById('gameOver').style.display = 'block'
		endigSequence = false
		debug('endigSequence', endigSequence)
	}
}

const main = () => {
	if (isRunning && !birdIsCollided()) {
		// moving bg
		game.style.backgroundPositionX =
			parseFloat(game.style.backgroundPositionX) - 4.64 * speedMultiplier + 'px'
		// moving base
		base.style.backgroundPositionX =
			parseFloat(base.style.backgroundPositionX) - 3.57 * speedMultiplier + 'px'

		updatePipes()
	} else {
		if (!endigSequence) {
			stopGame()
		}
	}
	// increase 0.1 evry minute, 24000 = 1000ms / 25ms * 60 / 0.1
	const gravityOverTime = frames / 24000
	debug('gravityIncrement', gravityOverTime)

	//incremet gravity
	gravity += baseGravity + gravityOverTime
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
	updateScore()
}

const playGame = () => {
	if (!isRunning && !endigSequence) {
		startGame()
	}
	if (isRunning && !endigSequence) {
		flap()
	}
}

keyboardEvents.forEach(evnt => {
	window.addEventListener(evnt, e => {
		if (e.type === 'keydown' && e.code === 'Space') {
			if (!keyPressed) {
				keyPressed = true
				playGame()
			}
		}
		//prevent keep pressing the space key
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

const updateRangeInput = input => {
	const max = input.max
	const min = input.min
	const value = input.value
	const step = input.step
	let perc = 0
	if (value > min) {
		perc = (value - min) / (max - min)
	}
	input.style.setProperty('--value', perc * 100 + '%')
}

inputEnableDebug.addEventListener('change', e => {
	toggleDebug(e.target.checked)
})

inputChangeGravity.addEventListener('input', e => {
	changeBaseGravity(e.target.value)
	updateRangeInput(e.target)
})

inputChangeSpeed.addEventListener('input', e => {
	changeSpeedMultiplier(e.target.value)
	updateRangeInput(e.target)
})

debug('gravityFactor', gravity)
debug('IsRunning', isRunning)
debug('birdIsCollided', birdIsCollided())
debug('birdTop', birdStartY)
debug('frames', frames)
debug('birdRotation', 0)
debug('seconds', 0)
debug('gravityIncrement', 0)
debug('birdGapX', 'undefined')
debug('endigSequence', endigSequence)

const rangeInputs = document.querySelectorAll('input[type=range]')

if (localStorage.getItem('setting')) {
	settings = JSON.parse(localStorage.getItem('setting'))
	debugEnable = settings.debugEnable
	inputEnableDebug.checked = debugEnable
	toggleDebug(debugEnable)

	baseGravity = settings.baseGravity
	inputChangeGravity.value = baseGravity

	speedMultiplier = settings.speedMultiplier
	inputChangeSpeed.value = speedMultiplier
	changeBirdColor(settings.birdColor)

	bestScore = settings.bestScore ? settings.bestScore : bestScore
} else {
	toggleDebug(debugEnable)
	changeBirdColor(birdColor)
}

const birdColorInput = document.querySelectorAll('#birdColor input')
for (const input of birdColorInput) {
	if (input.value === birdColor) {
		input.checked = true
	}
}

rangeInputs.forEach(rangeInput => {
	updateRangeInput(rangeInput)
})

window.addEventListener('resize', () => {
	gameWidth = game.offsetWidth
	pipeStartX = gameWidth * 0.7
})
