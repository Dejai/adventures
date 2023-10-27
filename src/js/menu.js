// Toggle the dropdown menu
function toggleSideNav(){
    var sideNav = document.querySelector(".sideNav");
    var isOpen = (sideNav.classList.contains("open"));
    if(!isOpen)
    {
        sideNav.classList.add("open");
        MyDom.hideContent("#hamburgerMenuIcon");
        MyDom.showContent("#closeMenuIcon");
        MyDom.addClass(".toggleOnSideNavMobile", "navOpen");
    } else {
        sideNav.classList.remove("open");
        MyDom.showContent("#hamburgerMenuIcon");
        MyDom.hideContent("#closeMenuIcon");
        MyDom.removeClass(".toggleOnSideNavMobile", "navOpen");
    }
}

// Toggle the search bar
var toggleSearchBar = (icon) => {

    var isActive = document.querySelector("#searchBarSection")?.classList.contains("active");

    //  If not active, open it (make it active);
    if(!isActive){
        // Focus on field if found
         document.querySelector("#searchBarInput")?.focus();
        // Adjust visibility of items with classes
        MyDom.addClass("#searchBarSection", "active");
        MyDom.addClass(".fadeOnSearch", "dtk-fade-out");
        MyDom.hideContent(".hideOnSearch");
    } else { 
        // Find the button to clear search & click it
        document.querySelector("#searchClearIcon")?.click();
        // Control visibility with classes
        MyDom.removeClass("#searchBarSection", "active");
        MyDom.addClass(".fadeOnSearch", "dtk-fade-in");
        MyDom.removeClass(".fadeOnSearch", "dtk-fade-out");
        MyDom.showContent(".hideOnSearch");
    }
}