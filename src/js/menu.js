// Load the drop down menu
const loadDropdownMenu = async (loginDetails) => {
    var userDetails = new UserDetails(loginDetails);
    var menuDropdown = await MyTemplates.getTemplateAsync("src/templates/shared/dropdownNav.html", userDetails);
    MyDom.setContent("#dropdownNav", {"innerHTML": menuDropdown} );
}


// Toggle the dropdown nav
function toggleDropdownNav() {
    var dropdownNav = document.querySelector("#dropdownNav");
    var isOpen = (dropdownNav.classList.contains("open"));
    if(!isOpen)
    {
        dropdownNav.classList.add("open");
        MyDom.hideContent("#hamburgerMenuIcon");
        MyDom.showContent("#closeMenuIcon");
        // MyDom.addClass(".toggleOnSideNavMobile", "navOpen");
    } else {
        dropdownNav.classList.remove("open");
        MyDom.showContent("#hamburgerMenuIcon");
        MyDom.hideContent("#closeMenuIcon");
        // MyDom.removeClass(".toggleOnSideNavMobile", "navOpen");
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