
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("videos");
const MyHomePage = new AdventureHomePage();

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	MyDom.ready( async() => {
		// Set login details
		await MyAuth.onGetLoginDetails(MyLoginDetails);
		
		// Load the adventures
		onLoadAdventures().then().catch(err => {
			onCantLoadAdventures(err);
			MyLogger.LogError(err);
		});
	});

/******** GETTING STARTED: Loading the Adventures & Labels; Check if logged in user***************************/

	// Load the set of adventures on the home page
	async function onLoadAdventures() {

		MyTrello.GetCardsByListName("Adventures", async (response)=> {

			var displayElements = response.map(x => new Adventure(x));

			// If nothing, then show error message
			if(displayElements.length == 0){
				onCantLoadAdventures("No adventures returned!");
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
				var numberOfVideos = adventureVideos.length;
				if(numberOfVideos > 0){
					var randIndex = (numberOfVideos > 1) ? Math.floor(Math.random()*adventureVideos.length) : 0;
					var randVideo = new StreamVideo(adventureVideos[randIndex]);
					adventure.CoverThumbnail = randVideo?.Urls.thumbnail;
				}
				// Add adventure as we go
				MyTemplates.getTemplate("src/templates/main/adventureBlock.html", adventure, (template) => {
					MyDom.setContent("#adventuresPanel", {"innerHTML":template}, true);
				});
			}
			// Once loaded, show things that should be visible now
			MyDom.showContent(".showOnAdventuresLoaded");
			MyDom.hideContent(".hideOnLoaded");
		}, (err) => {
			onCantLoadAdventures("Something went wrong!");
			MyLogger.LogError(err);
		});
	}

	// Unable to load adventures
	function onCantLoadAdventures(details=""){
		MyLogger.Notify("#adventuresPanel", `<p class="pageMessage"><i class="fa-regular fa-face-frown"></i> Sorry, could not load adventures.</p>`);
		MyLogger.LogError(details);
		MyDom.hideContent(".hideOnFirstLoaded");
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

	// Select random adventure
	function onSelectRandomAdventure() {
		let adventureBlocks = document.querySelectorAll(".adventureBlockLink");
		let numAdventures = adventureBlocks.length;
		if(numAdventures > 0) {
			var randIndex = Math.floor(Math.random()*numAdventures);
			var randLink = adventureBlocks[randIndex];
			randLink.click();
		}
	}


