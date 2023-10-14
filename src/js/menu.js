// Toggle the dropdown menu
function toggleSideNav(){
    var sideNav = document.querySelector(".sideNav");
    var isOpen = (sideNav.classList.contains("open"));
    var _action = !isOpen ? sideNav.classList.add("open") : sideNav.classList.remove("open");

    // Check if mobile; If yes, hide certain sections other sections 
    var isMobile = (window.getComputedStyle(document.querySelector(".userName.mobile")).display) == "inline-block";
    if(isMobile){
        var _others = !isOpen ? MyDom.hideContent("toggleOnSideNavMobile") : MyDom.showContent("toggleOnSideNavMobile");
    }
}