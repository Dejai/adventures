// Helper to stringify json, but ignore private properties

function useWindowScroll(direction, delay=1){
    let topDiff = (direction == "bottom") ? document.body.scrollHeight : 0;
    let delayTime = delay*1000
    setTimeout( () => {
        window.scrollTo({ top: topDiff, behavior: 'smooth' })
    }, delayTime)
}