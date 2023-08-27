
/************************ GLOBAL VARIABLES ****************************************/
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"
// List of adventures
var ListOfAdventures = [];

const MyTrello = new TrelloWrapper("videos");

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	MyDom.ready( async() => {

		// Get login details
		await MyAuth.onGetLoginDetails();
		
		// Load the adventures
		onLoadAdventures();
	});


/******** GETTING STARTED: Loading the Adventures & Labels; Check if logged in user***************************/

	// On picture loaded
	function onPictureLoaded(){
		console.log("Picture loaded");
	}

	// onNavigateToAdventure
	function onNavigateToAdventure(event){
		var target = event.target;
		console.log(event);
		console.log(target);
		var parent = target.closest(".adventureBlockParent");
		var adventureID = parent.getAttribute("data-adventure-id");
		if(adventureID != undefined){
			MyUrls.navigateTo(`/adventure/?id=${adventureID}`);
		}
	}

	// Load the set of adventures on the home page
	async function onLoadAdventures(){

		try {
			MyTrello.GetCardsByListName("Adventures", async (response)=> {

				var displayElements = response.map(x => new Adventure2(x));
				console.log(displayElements);
				displayElements.sort( (a,b) => {
					return (b.Date - a.Date);
				});
				console.log(displayElements);

				// Load the videos
				for(var idx = 0; idx < displayElements.length; idx++)
				{
					var adventure = displayElements[idx];
					var adventureID = adventure?.AdventureID ?? "No Adventure ID";
					var adventureVideos = await CloudflareWrapper.GetVideos(adventureID);
					if(adventureVideos.length > 0){
						var firstVideo = new StreamVideo(adventureVideos[0]);
						adventure.CoverThumbnail = firstVideo.Thumbnail;
					}
					// Add adventure as we go
					MyTemplates.getTemplate("src/templates/adventureItem2.html", adventure, (template) => {
						MyDom.setContent("#adventuresPanel", {"innerHTML":template}, true);
					});
				}
				// Once loaded, show things that should be visible now
				MyDom.showContent(".showOnAdventuresLoaded");
				MyDom.hideContent(".hideOnLoaded");
				// Blur the search (to set the default text);
				onSearchBlur();
			});
		} catch (err) {
			MyDom.setContent("#adventuresPanel", {"innerHTML":"<h3>Could not load adventures</h3>"} );
			MyLogger.LogError(err);
		}
	}

/********** SEARCH: Filtering & Searching for games **************/

    // Get the search related values
    function onGetSearchValues()
    {
        let placeholder = document.getElementById("searchBar")?.getAttribute("data-adv-placeholder");
        let filterValue = MyDom.getContent("#searchBar")?.innerText ?? "";
        filterValue = (filterValue == "" || filterValue == placeholder) ? " " : filterValue;

        return { "Filter": filterValue, "Placeholder": placeholder }
    }

	    // Filter the list of games
    function onSearchAdventures()
    {
        let search = onGetSearchValues();

		// Show option to clear search;
		if(search.Filter != " "){ MyDom.showContent("#searchClearIcon"); }

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
            MyDom.setContent("#searchBar", {"innerText":""});
        }
        MyDom.addClass("#searchBar", "searchText");
        MyDom.removeClass("#searchBar", "searchPlaceholder");
    }

    // Blurring from the search bar
    function onSearchBlur()
    {
        let search = onGetSearchValues();
        if(search.Filter == " ")
        {
            MyDom.addClass("#searchBar", "searchPlaceholder");
            MyDom.removeClass("#searchBar", "searchText");
            MyDom.setContent("#searchBar", {"innerText":search.Placeholder});
			MyDom.hideContent("#searchClearIcon");
        }        
    }

	// Clear the search
	function onClearSearch()
	{
        MyDom.setContent("#searchBar" ,{"innerText":""});
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
					if(!GAME_STARTED && !CHECKING_FOR_BINGO) {
						onStartGame();
					} else if (GAME_STARTED && !CHECKING_FOR_BINGO) {
						onPickNumber();
					} else if (CHECKING_FOR_BINGO) {
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

		console.log(adventureLink);
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
				MyDom.showContent(`[data-adventure-id='${adventure.AdventureID}']`);
			}
			// If it does not have the label, hide it;
			else if( !adventure.hasLabel(labelID) )
			{
				MyDom.hideContent(`[data-adventure-id='${adventure.AdventureID}']`);
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
				MyDom.hideContent(`#firstParagraph_${id}`);
				MyDom.hideContent(`#moreDetailsLink_${id}`);

				// Show full content;
				MyDom.showContent(`#moreDetails_${id}`);
				MyDom.showContent(`#lessDetailsLink_${id}`);
			}
			else
			{
				// Show first paragraph
				MyDom.showContent(`#firstParagraph_${id}`);
				MyDom.showContent(`#moreDetailsLink_${id}`);

				// Hide full content;
				MyDom.hideContent(`#moreDetails_${id}`);
				MyDom.hideContent(`#lessDetailsLink_${id}`);
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

