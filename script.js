const game = document.getElementById('game')
const base = document.getElementById('base')
const bird = document.getElementById('bird')
const birdMinY = 80
const birdMaxY = 377
const minGravity = 1.5
const maxGravity = 2.5
const debugEnable = true

const events = ['click', 'keydown']
let isRunning = false
let bgPosition = 0

const debug = (id, val) => {
	if (!debugEnable) {
		document.getElementById('debugInfo').style.display = 'none'
	} else {
		document.getElementById('debugInfo').style.display = 'block'
	}
	document.getElementById(id).textContent = val
}

const getGravityFactor = () => {
	const gravityFactor = (getBirdPosition() / birdMaxY) * (maxGravity - minGravity) + minGravity
	// if (gravityFactor < gravity) {
	// 	document.getElementById('gravityFactor').textContent = gravityFactor
	// 	return gravity
	// }
	debug('gravityFactor', gravityFactor)
	return gravityFactor
}

const getBirdPosition = () => {
	const top = parseFloat(bird.style.top)
	document.getElementById('birdTop').textContent = top
	return top
}
const setBirdPosition = top => {
	bird.style.top = top + 'px'
}

const birdIsCollided = () => {
	const birdIsCollided = getBirdPosition() === birdMaxY
	debug('birdIsCollided', birdIsCollided)
	return birdIsCollided
}

const flap = () => {
	const newBirdTop = getBirdPosition() - 37 * (getGravityFactor() / 1.5)
	if (newBirdTop > 0) {
		setBirdPosition(newBirdTop)
	} else {
		setBirdPosition(0)
	}
}

const playGame = () => {
	if (!isRunning) {
		isRunning = !isRunning
	}
	if (isRunning) {
		if (!birdIsCollided()) {
			flap()
		} else {
			isRunning = !isRunning
			setBirdPosition(birdMinY)
			game.style.backgroundPositionX = '0px'
			base.style.backgroundPositionX = '0px'
		}
	}
}
const intervalID = setInterval(() => {
	if (isRunning) {
		game.style.backgroundPositionX =
			game.style.backgroundPositionX !== ''
				? parseFloat(game.style.backgroundPositionX) - 4.64 + 'px'
				: '0px'
		base.style.backgroundPositionX =
			base.style.backgroundPositionX !== ''
				? parseFloat(base.style.backgroundPositionX) - 3.57 + 'px'
				: '0px'
		if (bird.style.top !== '') {
			const newBirdTop = getBirdPosition() + (2 * getGravityFactor()) / 3
			if (newBirdTop <= birdMaxY) {
				birdTop = newBirdTop
			} else {
				birdTop = birdMaxY
			}
			setBirdPosition(birdTop)
		} else {
			setBirdPosition(birdMinY)
		}
	}
}, 25)

events.forEach(evnt => {
	window.addEventListener(evnt, e => {
		if ((e.type === 'keydown' && e.code === 'Space') || e.type === 'click') {
			playGame()
		}
	})
})
