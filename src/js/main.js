
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyHomePage = new AdventureHomePage();
const MyCloudFlare = new CloudflareWrapper();

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	MyDom.ready( async() => {

		// Check for auto-redirect
		await MyUrls.redirectFromCode();

		// Set login details
		var loginDetails = await MyAuth.onGetLoginDetails();
		await loadDropdownMenu(loginDetails);
	
		// Load the adventures
		onLoadAdventures().then().catch(err => {
			onCantLoadAdventures(err);
			MyLogger.LogError(err);
		});

		// Add general listener
	});

/******** GETTING STARTED: Loading the Adventures;  Check if logged in user***************************/

	// Load the set of adventures on the home page
	async function onLoadAdventures() {

		try{
			var adventuresJson = await MyTrello.GetCardsByListName("Adventures");
			var adventures = adventuresJson.map(x => new Adventure(x));

			// If nothing, then show error message
			if(adventures.length == 0){
				onCantLoadAdventures("No adventures returned!");
				return;
			}

			// Sort the adventures
			adventures.sort( (a,b) => {
				return (b.Date - a.Date);
			});

			// Add the adventures to home page instance
			MyHomePage.addAdventures(adventures);

			// Loop through adventures & add to page
			var append = false;
			var advBlock = await MyTemplates.getTemplateAsync("src/templates/main/adventureBlock.html", {});
			for(var adv of adventures){
				MyDom.setContent("#adventuresPanel", {"innerHTML":advBlock}, append);
				append = true;
			}

			for(var adventure of adventures)
			{
				var adventureID = adventure?.AdventureID ?? "No Adventure ID";
				var adventureVideos = await MyCloudFlare.GetVideos(adventureID);
				var numberOfVideos = adventureVideos.length;
				if(numberOfVideos > 0) {
					var randIndex = (numberOfVideos > 1) ? Math.floor(Math.random()*adventureVideos.length) : 0;
					adventure.CoverContent = new StreamVideo(adventureVideos[randIndex]);
				}
				var placeholder = document.querySelector(".adventureBlock.placeholder");
				var placeholderImg = placeholder?.querySelector("img");
				var placeholderLink = placeholder?.querySelector(".adventureBlockLink");
				var placeholderName = placeholder?.querySelector(".adventureName");
				placeholder.setAttribute("data-adventure-id", adventure.AdventureID);
				placeholder.classList.remove("placeholder");
				placeholderImg.src = adventure.CoverContent.Urls.thumbnail;
				placeholderLink.href = `./adventure/?id=${adventure.AdventureID}`;
				placeholderName.innerHTML = adventure.Name;
				// Add adventure as we go
				// var adventureBlockTemplate = await MyTemplates.getTemplateAsync("src/templates/main/adventureBlock.html", adventure);
				// MyDom.setContent("#adventuresPanel", {"innerHTML":adventureBlockTemplate}, append);
				// append = true;
			}
			
		} catch (err){
			onCantLoadAdventures("Something went wrong!");
			MyLogger.LogError(err);
		}
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
		// Show clear button
		var _clearButton = (searchFilter != "") ? MyDom.showContent("#searchClearIcon") : MyDom.hideContent("#searchClearIcon");
		// Get content IDs for ones that match
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


