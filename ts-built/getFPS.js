/**
 * Allows to obtain the estimated Hz of the primary monitor in the system.
 *
 * @param {Function} callback The function triggered after obtaining the estimated Hz of the monitor.
 */
function getScreenRefreshRate(callback) {
    let requestId = null;
    let callbackTriggered = false;
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame =
            window.requestAnimationFrame || (callback => window.setTimeout(callback, 1000 / 60));
    }
    let DOMHighResTimeStampCollection = [];
    let triggerAnimation = function (DOMHighResTimeStamp) {
        DOMHighResTimeStampCollection.unshift(DOMHighResTimeStamp);
        if (DOMHighResTimeStampCollection.length > 10) {
            let t0 = DOMHighResTimeStampCollection.pop();
            let fps = Math.floor((1000 * 10) / (DOMHighResTimeStamp - t0));
            if (!callbackTriggered) {
                callback(fps, DOMHighResTimeStampCollection);
            }
            callbackTriggered = false;
        }
        requestId = window.requestAnimationFrame(triggerAnimation);
    };
    window.requestAnimationFrame(triggerAnimation);
    // Stop after half second if it shouldn't run indefinitely
    // window.setTimeout(function () {
    // 	if (requestId !== null) {
    // 		window.cancelAnimationFrame(requestId)
    // 		requestId = null
    // 	}
    // }, 500)
}
//# sourceMappingURL=getFPS.js.map