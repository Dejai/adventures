
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyAdventurePage = new AdventurePage();
const MyStream = new StreamManager();

/*********************** GETTING STARTED *****************************/
	// Once doc is ready
	MyDom.ready( async () => {

		await MyAuth.onGetLoginDetails();

		// Get params from URL;
		let adventureID = MyUrls.getSearchParam("id") ?? "";

		

		if(adventureID != undefined){
			onGetAdventure(adventureID);
		}
	});

/********************* LISTENERS *************************************/

	// Returning to home page
	function onReturnHome()	{
		MyUrls.navigateTo("/");
	}

/********* SETUP: Create the key things used throughout the file *************************************/

	// Get this adventure card & its list of videos
	async function onGetAdventure(adventureID)
	{
		MyDom.showContent("#loadingGif");
		try {
			MyTrello.GetCard(adventureID, async (resp) => {				
				
				var adventure = new Adventure(resp);
				
				// Set the name & description
				MyDom.setContent("#adventureTitle", {"innerHTML":adventure.Name});
				MyDom.setContent("#adventureDescription", {"innerHTML":adventure.Description});
				MyDom.showContent("#moreDetailsIcon");

				// Get the adventure Videos for this adventure
				var adventureVideos = await CloudflareWrapper.GetVideos(adventure.AdventureID);
				var streamVideos = adventureVideos.map(x => new StreamVideo(x));
				streamVideos.forEach( (vid)=> {
					adventure.addContent(vid);
				});

				// Set the current adventure
				MyAdventurePage.setAdventure(adventure);

				// List the adventures
				if(MyAdventurePage.getContentCount() > 0)
				{
					// Load the video preview templates
					await MyTemplates.getTemplate("src/templates/adventure/contentPreview.html", streamVideos, (template) => {
						MyDom.setContent("#listOfContent", {"innerHTML": template});
					});

					// If param ID is set or there is only, load that video immediately 
					var contentID = MyUrls.getSearchParam("content");
					
					// If there is only one video, also set immediately;
					if( (MyAdventurePage.getContentCount() == 1) ){
						contentID = MyAdventurePage.getContentByIndex(0)?.ContentID ?? contentID;
						MyDom.removeClass("#backToContentList", "showOnContentLoaded")
					}

					// Use the content ID to load the content
					if(contentID != undefined) {
						MyDom.removeClass("#listOfContent", "showOnContentLoaded");
						onLoadContent(contentID);
					} else {
						setContentView("default");
					}
				}
				
			});
		} catch (error){
			MyLogger.LogError(error);
		}
	}

	// Link from content list to content view
	function onOpenContent(event){
		var target = event.target;
		var contentID = target.getAttribute("data-content-id");

		// First check if the content is already loaded (if so, just show the content screen)
		var existingContent = document.querySelector(`iframe[data-content-id='${contentID}']`);

		if(existingContent != undefined){
			setContentView("content");
			MyStream.onPlayVideo();
		} else if (contentID != undefined){
			onLoadContent(contentID);
		}
	}

	// Load content
	function onLoadContent(contentID)
	{
		var content = MyAdventurePage.getContentByID(contentID);
		MyAdventurePage.setContentIdx(contentID);
		
		if(content instanceof StreamVideo){
			MyTemplates.getTemplate("src/templates/adventure/videoIFrame.html", content, (template)=>{
				MyDom.setContent("#videoFramePanel", {"innerHTML":template});
				onConfigureStream();
				setContentView("content");
				MyStream.onPlayVideo();
			});	
		}
		// Modify URL when loading content
		onModifyUrl({"content": contentID});
	}

	// Show the description
	function onShowDescription(){
		setContentView("description");
	}

	// Go back to content list
	function onBackToContentList(){
		setContentView("list");
	}

	// Set the current view of things
	function setContentView(state="default")
	{
		// Defaults to list view of content
		switch(state)
		{
			case "content":
				MyDom.showContent(".showOnContentView");
				MyDom.hideContent(".hideOnContentView");
				//Showing/hiding the next/prev buttons
				var _next = MyAdventurePage.hasNextContent() ? MyDom.showContent("#nextButton") : MyDom.hideContent("#nextButton");
				var _prev = MyAdventurePage.hasPrevContent() ? MyDom.showContent("#prevButton") : MyDom.hideContent("#prevButton");
				break;
			case "description":
				MyDom.showContent(".showOnDescriptionView");
				MyDom.hideContent(".hideOnDescriptionView");
				MyStream.onPauseVideo();
				break;
			default:
				MyDom.showContent(".showOnListView");
				MyDom.hideContent(".hideOnListView");
				MyStream.onPauseVideo();
				onModifyUrl({"content": ""});
				break;
		}
		// Make sure to set the current view state to whatever we are setting
		MyAdventurePage.setViewState(state);
	}

	// Navigate back to the list
	function onBackToList(){
		setContentView("list");
	}

	// Get and set content based on index plus/minus
	function onChangeContent(direction)
	{
		var currIdx = MyAdventurePage.Adventure?.CurrentContentIdx;
		var nextIdx = (direction == "prev") ? currIdx-1 : currIdx+1;

		var content = MyAdventurePage.getContentByIndex(nextIdx);
		if(content != undefined){ 
			onLoadContent(content?.ContentID);
		} else {
			MyLogger.LogError("Could not load next content");
		}
	}

	// On navigate back to a content list
	function onPrev(){
		onChangeContent("prev");
	}

	// On going to the next video
	function onNext(){
		onChangeContent("next");
	}

	// Modify URL based on view; Adding/removing content ID
	function onModifyUrl(keyValuePairs={}) {
		var newSearch = MyUrls.getModifiedSearchString(keyValuePairs);
		let newPath = location.pathname + newSearch;
		MyUrls.addWindowHistory({"path":newPath}, true); // use replace to avoid confusion with back button
	}


////////////////////////

/***************** ACTIONS / EVENTS ********************** */

	// Select the next video
	function onNextVideo()
	{
		// Don't do anything if we are at the end of the list of videos
		if(MyAdventure.CurrentVideoIndex >= MyAdventure.Videos.length)
			return
	}

	// Select the previous video
	function onPrevVideo()
	{
		// Don't do anything if we are at start
		if(MyAdventure.CurrentVideoIndex == 0)
			return 
	}

/*********************** Stream API Helper *****************************/

	// Add stream listeners
	function onConfigureStream()
	{
		// Set the stream element
		MyStream.setStreamElement("#videoIFrame");
	}