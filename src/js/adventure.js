
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

	function onVideoPreviewLoaded(){
		
	}

	// Get this adventure card & its list of videos
	async function onGetAdventure(adventureID)
	{
		MyDom.showContent("#loadingGif");
		try {
			MyTrello.GetCard(adventureID, async (resp) => {				
				
				var adventure = new Adventure2(resp);
				

				// Set the name & description
				MyDom.setContent("#adventureTitle", {"innerHTML":adventure.Name});
				MyDom.setContent("#adventureDescription", {"innerHTML":adventure.Description});

				var adventureVideos = await CloudflareWrapper.GetVideos(adventure.AdventureID);
				var adventureVideos2 = adventureVideos.map(x => new StreamVideo(x));
				adventureVideos2.forEach( (vid)=> {
					adventure.addContent(vid);
				});
				if(adventureVideos2.length > 0) {
					
				}

				await MyTemplates.getTemplate("src/templates/adventure/videoPreview.html", adventureVideos2, (template) => {
					MyDom.setContent("#videoListTest", {"innerHTML": template});
				});

				// Set the current adventure
				MyAdventurePage.setAdventure(adventure);

				// If param ID is set or there is only, load that video immediately 
				var contentID = MyUrls.getSearchParam("content");
				
				// If there is only one video, also set immediately;
				contentID = (MyAdventurePage.getContentCount() == 1) ? MyAdventurePage.getContentByIndex(0)?.ContentID : contentID;
				if(MyAdventurePage.getContentCount() == 1) {
					console.log("Enough");
				}


				if(contentID != undefined){
					onLoadContent(contentID);
				} else {
					MyDom.showContent(".showOnAdventureLoaded");
				}
				MyDom.hideContent(".hideOnAdventureLoaded");
				console.log(MyAdventurePage);
				
			});
		} catch (error){
			MyLogger.LogError(error);
		}
	}

	function onLoadVideo2(event){
		var target = event.target; 
		var container = target.closest(".videoPreviewBlock");
		var contentID = container.getAttribute("data-content-id");

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

	// Unload content: When going back to list view
	function onUnloadContent(){
		
		onModifyUrl({"content": ""});
	}

	// Modify URL based on view; Adding/removing content ID
	function onModifyUrl(keyValuePairs={}) {
		var newSearch = MyUrls.getModifiedSearchString(keyValuePairs);
		let newPath = location.pathname + newSearch;
		MyUrls.addWindowHistory({"path":newPath}, true); // use replace to avoid confusion with back button
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
	function setContentView(state)
	{
		// Defaults to list view of content
		switch(state)
		{
			case "content":
				MyDom.showContent(".showOnContentView");
				MyDom.hideContent(".hideOnContentView");
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
				onUnloadContent();
				break;
		}
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