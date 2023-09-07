
/************************ GLOBAL VARIABLES ****************************************/
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"
// List of adventures
var ListOfAdventures = [];

const MyTrello = new TrelloWrapper("videos");
const MyHomePage = new AdventureHomePage();

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	MyDom.ready( async() => {
		// Get login details
		await MyAuth.onGetLoginDetails();
		
		// Load the adventures
		onLoadAdventures();
	});


/******** GETTING STARTED: Loading the Adventures & Labels; Check if logged in user***************************/

	// Load the set of adventures on the home page
	async function onLoadAdventures(){

		try {
			MyTrello.GetCardsByListName("Adventures", async (response)=> {

				var displayElements = response.map(x => new Adventure(x));

				// If nothing, then show error message
				if(displayElements.length == 0){
					onCantLoadAdventures("No adventures returned!");
					MyDom.hideContent(".hideOnFirstLoaded");
					return;
				}

				// Sort the adventures
				displayElements.sort( (a,b) => {
					return (b.Date - a.Date);
				});

				// Add the adventures to home page instance
				MyHomePage.addAdventures(displayElements);

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
					MyTemplates.getTemplate("src/templates/main/adventureBlock.html", adventure, (template) => {
						MyDom.setContent("#adventuresPanel", {"innerHTML":template}, true);
					});
				}
				// Once loaded, show things that should be visible now
				MyDom.showContent(".showOnAdventuresLoaded");
				MyDom.hideContent(".hideOnLoaded");
			});
		} catch (err) {
			onCantLoadAdventures(err);
			MyLogger.LogError(err);
		} finally { 
		}
	}

	// Unable to load adventures
	function onCantLoadAdventures(details=""){
		MyLogger.Notify("#adventuresPanel", `<h3><i class="fa-regular fa-face-frown"></i> Sorry, could not load adventures.</h3>`);
		MyLogger.LogError(details);
	}

/********** SEARCH: Filtering & Searching for games **************/

	// Filter the list of games
    function onSearchAdventures()
    {
		// Show option to clear search;
		var searchFilter = MyDom.getContent("#searchBarInput")?.value ?? "";
		if(searchFilter != ""){ MyDom.showContent("#searchClearIcon"); }
		var contentIds = MyHomePage.searchContent(searchFilter);
		// Loop through content and show those that match
		document.querySelectorAll(".adventureBlock")?.forEach( (block) => {
			var contentId = block.getAttribute("data-adventure-id");
			var _content = !(contentIds.includes(contentId)) ? block.classList.add("hidden") : block.classList.remove("hidden");
		});
    }

	// Clear the search
	function onClearSearch()
	{
        MyDom.setContent("#searchBarInput" ,{"value":""});
		onSearchAdventures();
		MyDom.hideContent("#searchClearIcon");
		document.querySelector("#searchBarInput")?.blur();
	}

/********************* LISTENERS *************************************/

	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

	// On picture loaded
	function onPictureLoaded(img){
		var parent = img.closest(".adventureBlock");
		setTimeout( () => { 
			parent.classList.add("visible");
			MyDom.hideContent(".hideOnFirstLoaded");
		}, 500);
	}

	// onNavigateToAdventure
	function onNavigateToAdventure(event){
		var target = event.target;
		var parent = target.closest(".adventureBlock");
		var adventureID = parent.getAttribute("data-adventure-id");
		if(adventureID != undefined){
			MyUrls.navigateTo(`/adventure/?id=${adventureID}`);
		}
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
		let adventureBlocks = document.querySelectorAll(".adventureBlockLink");
		let numAdventures = adventureBlocks.length;
		if(numAdventures > 0) {
			var randIndex = Math.floor(Math.random()*numAdventures);
			var randLink = adventureBlocks[randIndex];
			randLink.click();
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

