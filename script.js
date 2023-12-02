const game = document.getElementById('game')
const base = document.getElementById('base')
const bird = document.getElementById('bird')
const birdStartY = 80
const birdMaxY = 377
const minGravity = -30
const maxGravity = 10
const debugEnable = true

const events = ['click', 'keydown', 'keyup', 'touchstart']
let isRunning = false
let bgPosition = 0
let intervalID = null
let gravity = 0
let frames = 0
let keyPressed = false
let birdColor = 'yellow'

const debug = (id, val) => {
	if (!debugEnable) {
		document.getElementById('debugInfo').style.display = 'none'
	} else {
		document.getElementById('debugInfo').style.display = 'block'
	}
	document.getElementById(id).textContent = val
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
	intervalID = setInterval(main, 25)
}
const stopGame = () => {
	isRunning = false
	debug('IsRunning', isRunning)
	clearInterval(intervalID)
	document.getElementById('gameOver').style.display = 'block'
}

const main = () => {
	if (!birdIsCollided()) {
		// moving bg
		game.style.backgroundPositionX = parseFloat(game.style.backgroundPositionX) - 4.64 + 'px'
		// moving base
		base.style.backgroundPositionX = parseFloat(base.style.backgroundPositionX) - 3.57 + 'px'

		//incremet gravity
		gravity += 0.11 + frames / 10000
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

events.forEach(evnt => {
	window.addEventListener(evnt, e => {
		if (e.type === 'click' || e.type === 'touchstart') {
			playGame()
		}
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

debug('gravityFactor', gravity)
debug('IsRunning', isRunning)
debug('birdIsCollided', birdIsCollided())
debug('birdTop', birdStartY)
debug('frames', frames)
debug('birdRotation', 0)
