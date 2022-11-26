
/************************ GLOBAL VARIABLES ****************************************/
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"
// List of adventures
var ListOfAdventures = [];

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){

		MyTrello.SetBoardName("videos");

		loadLabels();

		getAdventures();

		checkLoggedIn();

		// Set search bar
        onSearchBlur();

	});


/******** GETTING STARTED: Loading the Adventures & Labels; Check if logged in user***************************/
	// Get list of adventures
	function getAdventures()
	{
		MyTrello.get_cards_by_list_name("Adventures",(data)=>{

			let resp = JSON.parse(data.responseText);
			if(resp.length > 0)
			{
				loadAdventures(resp);
			}
		});
	}

	// Load the adventures
	function loadAdventures(adventureList)
	{
		var adventureHTML = "";
			
		adventureList.forEach( (element, idx, arr) => {


			let id = element["id"];
			let name = element["name"];
			let desc = element["desc"];
			let isProtected = element["idLabels"].includes(SECURE_LABEL_ID);
			let date = element["start"];
			let labels = element["idLabels"];
			let monthYear = getMonthYear(new Date(date));

			// Create a new adventure display object
			let adventure = new AdventureDisplay(id, name, desc, monthYear, labels, isProtected);

			// Keep track of this aventure
			ListOfAdventures.push(adventure);


			MyTemplates.getTemplate("templates/adventureItem.html", adventure, (template)=>{

				adventureHTML += template;

				if(idx == arr.length-1)
				{
					mydoc.setContent("#adventuresPanel", {"innerHTML":adventureHTML});
				}

			});
		});

		mydoc.loadContent(adventureHTML,"adventuresPanel");

		// Once loaded, show the filter section
		mydoc.showContent("#findAdventureSection");

	}

	// Load the labels to be used for filtering
	function loadLabels()
	{
		MyTrello.get_labels( data =>{

			var resp = myajax.GetJSON(data.responseText);
			if(resp != undefined)
			{

				var labelSet = "";
				resp = resp.sort(function(a,b){
					return a.name.localeCompare(b.name)
				});
		
				resp.forEach( (label, idx, arr) =>{

					var labelName = label.name ?? "";
					var labelColor = label.color;
					var labelID = label.id; 

					if(labelName != "" && labelID != SECURE_LABEL_ID)
					{
						obj = {"FilterName":labelName, "LabelID":labelID};
						MyTemplates.getTemplate("templates/filterOption.html", obj, (template)=>{
							labelSet += template;

							if(idx == arr.length-1)
							{
								// Add the labels
								mydoc.setContent("#filterSection", {"innerHTML":labelSet});
							}
						});
					}
				});
			}
		})
	}

	// check for already logged in
	function checkLoggedIn()
	{
		let user = mydoc.getCookie("AdventureUser") ?? "";
		if(user != "")
		{
			let names = user.split( " ~ ");
			let name = names[ Math.floor(Math.random()*names.length)];
			let userWelcome = `Hi, ${name}`;
			mydoc.setContent("#loginSection", {"innerHTML":userWelcome});
		}
	}

/********** SEARCH: Filtering & Searching for games **************/

    // Get the search related values
    function onGetSearchValues()
    {
        let placeholder = document.getElementById("searchBar")?.getAttribute("data-adv-placeholder");
        let filterValue = mydoc.getContent("#searchBar")?.innerText ?? "";
        filterValue = (filterValue == "" || filterValue == placeholder) ? " " : filterValue;

        return { "Filter": filterValue, "Placeholder": placeholder }
    }

	    // Filter the list of games
    function onSearchAdventures()
    {
        let search = onGetSearchValues();

		// Show option to clear search;
		if(search.Filter != " "){ mydoc.showContent("#searchClearIcon"); }

        document.querySelectorAll(".adventure_block")?.forEach( (item)=>{
            
			let innerText = item.innerText.toUpperCase().replace("\n", " ");
            let searchText = search.Filter.toUpperCase().trim();

            if(!innerText.includes(searchText))
            {
                item.classList.add("hidden");
            }
            else
            {
                item.classList.remove("hidden");
            }
        }); 

    }

    // Focusing into the search bar
    function onSearchFocus()
    {
        let search = onGetSearchValues();
		
        if(search.Filter == " ")
        {
            mydoc.setContent("#searchBar", {"innerText":""});
        }
        mydoc.addClass("#searchBar", "searchText");
        mydoc.removeClass("#searchBar", "searchPlaceholder");
    }

    // Blurring from the search bar
    function onSearchBlur()
    {
        let search = onGetSearchValues();
        if(search.Filter == " ")
        {
            mydoc.addClass("#searchBar", "searchPlaceholder");
            mydoc.removeClass("#searchBar", "searchText");
            mydoc.setContent("#searchBar", {"innerText":search.Placeholder});
			mydoc.hideContent("#searchClearIcon");
        }        
    }

	// Clear the search
	function onClearSearch()
	{
        mydoc.setContent("#searchBar" ,{"innerText":""});
		onSearchAdventures();
		onSearchBlur();
	}

/********************* LISTENERS *************************************/

	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

	// Adds a listener for keystrokes (on keyup);
	function listenerOnKeyUp(){
		document.addEventListener("keyup", function(event){
			switch(event.code)
			{
				case "Enter":
					if(!GAME_STARTED && !CHECKING_FOR_BINGO)
					{
						onStartGame();
					}
					else if (GAME_STARTED && !CHECKING_FOR_BINGO)
					{
						onPickNumber();
					}
					else if (CHECKING_FOR_BINGO)
					{
						onCheckCardForBingo();
					}
					break;
				default:
					return;
			}
		});
	}

	// Select random adventure
	function onSelectRandomAdventure()
	{
		let randIndex = Math.floor(Math.random()*4);
		let adventureID = ListOfAdventures[randIndex]?.AdventureID ?? "";
		let adventureLink = document.querySelector(`.adventure_block[data-adventure-id='${adventureID}'] a`);

		if(adventureLink != undefined)
		{
			adventureLink.click();
		}
	}

	// Filter the functions based on label
	function onFilterByLabel(event)
	{
		let target = event.target;
		let labelID = target.getAttribute("data-label-id") ?? ""

		if(labelID != "")
		{
			let addFilter = !target.classList.contains("filterOptionSelected");
			if(addFilter)
			{
				// Remove from all other instances
				document.querySelectorAll(".filterOptionSelected")?.forEach( ele =>{
					ele.classList.remove("filterOptionSelected");
				});
				target.classList.add("filterOptionSelected");

				// Filter adventures
				onFilterAdventures(labelID);
			}
			else
			{
				target.classList.remove("filterOptionSelected");
				onFilterAdventures();
			}
		}
	}

	// Filter the adventures
	function onFilterAdventures(labelID)
	{
		// Loop through the adventures to figure out which one to show;
		ListOfAdventures.forEach( (adventure) =>{

			// let id = adv.getAttribute("data-adventure-id") ?? "";
			if(labelID == undefined || adventure.hasLabel(labelID))
			{
				mydoc.showContent(`[data-adventure-id='${adventure.AdventureID}']`);
			}
			// If it does not have the label, hide it;
			else if( !adventure.hasLabel(labelID) )
			{
				mydoc.hideContent(`[data-adventure-id='${adventure.AdventureID}']`);
			}
		});
	}



/********************** HELPERS *******************************/

	function toggleDetails(id)
	{
		let moreDetails = document.querySelector(`[data-details-id='${id}']`);

		if(moreDetails != undefined)
		{
			let isHidden = moreDetails.classList.contains("hidden");
			if(isHidden)
			{
				// Hide first paragraph
				mydoc.hideContent(`#firstParagraph_${id}`);
				mydoc.hideContent(`#moreDetailsLink_${id}`);

				// Show full content;
				mydoc.showContent(`#moreDetails_${id}`);
				mydoc.showContent(`#lessDetailsLink_${id}`);
			}
			else
			{
				// Show first paragraph
				mydoc.showContent(`#firstParagraph_${id}`);
				mydoc.showContent(`#moreDetailsLink_${id}`);

				// Hide full content;
				mydoc.hideContent(`#moreDetails_${id}`);
				mydoc.hideContent(`#lessDetailsLink_${id}`);
			}
		}
	}

	// Helper: Gets the month/year of an adventure
	function getMonthYear(date)
	{
		let months = [	"January", "February", "March", "April", "May", "June", 
						"July", "August", "September", "October", "November", "December"];

		let month = months[date.getMonth()];
		let year = date.getFullYear()
		return `${month}, ${year}`;

	}

