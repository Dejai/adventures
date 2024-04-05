// Helper to stringify json, but ignore private properties

function useWindowScroll(direction, delay=1){
    let topDiff = (direction == "bottom") ? document.body.scrollHeight : 0;
    let delayTime = delay*1000
    setTimeout( () => {
        window.scrollTo({ top: topDiff, behavior: 'smooth' })
    }, delayTime)
}

function onToggleElement(identifier){
    if(identifier != undefined){
        let id = identifier.replace("#","")
        let element = document.querySelector(`#${id}`);
        if(element != undefined){
            let show = element.classList.contains("hidden") ?? false;
            let _action = (show) ? element.classList.remove("hidden") : element.classList.add("hidden");
        }
    }
}