/**
 * Allows to obtain the estimated Hz of the primary monitor in the system.
 *
 * @param {Function} callback The function triggered after obtaining the estimated Hz of the monitor.
 */
function getScreenRefreshRate(callback: (fps: number, timestamps: number[]) => void) {
	let requestId: number | null = null
	let callbackTriggered = false

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame =
			window.requestAnimationFrame || (callback => window.setTimeout(callback, 1000 / 60))
	}

	let DOMHighResTimeStampCollection: number[] = []

	let triggerAnimation = function (DOMHighResTimeStamp: number) {
		DOMHighResTimeStampCollection.unshift(DOMHighResTimeStamp)

		if (DOMHighResTimeStampCollection.length > 10) {
			let t0 = DOMHighResTimeStampCollection.pop()!
			let fps = Math.floor((1000 * 10) / (DOMHighResTimeStamp - t0))

			if (!callbackTriggered) {
				callback(fps, DOMHighResTimeStampCollection)
			}

			callbackTriggered = false
		}

		requestId = window.requestAnimationFrame(triggerAnimation)
	}

	window.requestAnimationFrame(triggerAnimation)

	// Stop after half second if it shouldn't run indefinitely

	// window.setTimeout(function () {
	// 	if (requestId !== null) {
	// 		window.cancelAnimationFrame(requestId)
	// 		requestId = null
	// 	}
	// }, 500)
}
