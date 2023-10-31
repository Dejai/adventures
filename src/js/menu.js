// Load the drop down menu
const loadDropdownMenu = async (loginDetails) => {
    var userDetails = new UserDetails(loginDetails);
    var menuDropdown = await MyTemplates.getTemplateAsync("src/templates/shared/dropdownNav.html", userDetails);
    MyDom.setContent("#dropdownNav", {"innerHTML": menuDropdown} );
}


// Toggle the dropdown nav
function toggleDropdownNav(state="") {
    var dropdownNav = document.querySelector("#dropdownNav");
    var isOpen = (dropdownNav.classList.contains("open"));
    state = (state != "") ? state : ( (!isOpen) ? "open" : "close" );
    switch(state) {
        case "open":
            // Close the dropdown nave it happens to be open
            toggleSearchBar("close");
            // Show the section
            dropdownNav.classList.add("open");
            MyDom.hideContent("#hamburgerMenuIcon");
            MyDom.showContent("#closeMenuIcon");
            break;
        default:
            dropdownNav.classList.remove("open");
            MyDom.showContent("#hamburgerMenuIcon");
            MyDom.hideContent("#closeMenuIcon");    
            break;

    }
}

// Toggle the search bar
var toggleSearchBar = (state="") => {
    var isActive = document.querySelector("#searchBarSection")?.classList.contains("active");
    state = (state != "") ? state : ( (!isActive) ? "open" : "close" );
    switch(state) {
        case "open":
            // Close the dropdown nave it happens to be open
            toggleDropdownNav("close");
            // Focus on field if found
            document.querySelector("#searchBarInput")?.focus();
            // Adjust visibility of items with classes
            MyDom.addClass("#searchBarSection", "active");
            MyDom.addClass(".fadeOnSearch", "dtk-fade-out");
            MyDom.hideContent(".hideOnSearch");
            break;
        default:
            // Find the button to clear search & click it
            document.querySelector("#searchClearIcon")?.click();
            // Control visibility with classes
            MyDom.removeClass("#searchBarSection", "active");
            MyDom.addClass(".fadeOnSearch", "dtk-fade-in");
            MyDom.removeClass(".fadeOnSearch", "dtk-fade-out");
            MyDom.showContent(".hideOnSearch");
            break;
    }
}