// Load the drop down menu
const loadDropdownMenu = async (loginDetails) => {
    var userDetails = new UserDetails(loginDetails);
    var menuDropdown = await MyTemplates.getTemplateAsync("src/templates/shared/dropdownNav.html", userDetails);
    MyDom.setContent("#dropdownNav", {"innerHTML": menuDropdown} );
}

// Listen for clicks outside of dropdown nav
function onClickOutsideDropdownNav(e) {
    var dropdownNav = document.querySelector("#dropdownNav");
    var targetElement = e.target;
    var isMenuIcon = targetElement.classList.contains("menuIcons");
    var targetInDropdown = dropdownNav.contains(targetElement);
    if(targetElement != undefined && !isMenuIcon && !targetInDropdown) {
        toggleDropdownNav("close");
    }
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
            window.addEventListener("click", onClickOutsideDropdownNav);
            break;
        default:
            dropdownNav.classList.remove("open");
            MyDom.showContent("#hamburgerMenuIcon");
            MyDom.hideContent("#closeMenuIcon");   
            window.removeEventListener("click", onClickOutsideDropdownNav);
            break;
    }
}

// Toggle the search bar
var toggleSearchBar = (state="") => {
    var isActive = document.querySelector("#searchBarSection")?.classList.contains("active");
    state = (state != "") ? state : ( (!isActive) ? "open" : "close" );
    var inputField = document.querySelector("#searchBarInput");

    switch(state) {
        case "open":
            // Close the dropdown nave it happens to be open
            toggleDropdownNav("close");
            // Adjust visibility of items with classes
            MyDom.addClass("#searchBarSection", "active");
            MyDom.addClass(".fadeOnSearch", "dtk-fade-out");
            MyDom.hideContent(".hideOnSearch");
            if(inputField != undefined){
                inputField.disabled = false; 
                inputField.focus();
            }
            break;
        default:
            // Find the button to clear search & click it
            document.querySelector("#searchClearIcon")?.click();
            if(inputField != undefined){
                inputField.disabled = true;
            }
            // Control visibility with classes
            MyDom.removeClass("#searchBarSection", "active");
            MyDom.addClass(".fadeOnSearch", "dtk-fade-in");
            MyDom.removeClass(".fadeOnSearch", "dtk-fade-out");
            MyDom.showContent(".hideOnSearch");
            break;
    }
}