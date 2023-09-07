
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyAdventurePage = new AdventurePage();
const MyStream = new StreamManager();
const notifyElement = "#pageMessages";
const frownyFace = `<i class="fa-regular fa-face-frown"></i>`;

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

				if(adventure.AdventureID == ""){
					MyLogger.Notify(notifyElement, `<h3>${frownyFace} Could not load content</h3>`);
					return;
				}
				
				// Set the name & description
				MyDom.setContent("#adventureTitle", {"innerHTML":adventure.Name});
				MyDom.setContent("#adventureDescription", {"innerHTML":adventure.MoreDetails});
				MyDom.showContent("#moreDetailsIcon");

				// Get the adventure Videos for this adventure
				var adventureVideos = await CloudflareWrapper.GetVideos(adventure.AdventureID);
				var streamVideos = adventureVideos.map(x => new StreamVideo(x));
				streamVideos.forEach( (vid)=> {
					adventure.addContent(vid);
				});

				// Set the current adventure
				MyAdventurePage.setAdventure(adventure);

				// If no content, show error message & stop processing
				if(MyAdventurePage.getContentCount() == 0){
					MyLogger.Notify(notifyElement, `<h3>${frownyFace} <span style="color:red;">Could not load the content.</span> </h3>`);
					return;
				}

				// Load the video preview templates
				await MyTemplates.getTemplate("src/templates/adventure/contentPreview.html", streamVideos, (template) => {
					MyDom.setContent("#listOfContent", {"innerHTML": template});
				});

				// If param ID is set or there is only, load that video immediately 
				var contentID = MyUrls.getSearchParam("content");
				
				// If there is only one video, also set immediately;
				if( (MyAdventurePage.getContentCount() == 1) ){
					contentID = MyAdventurePage.getContentByIndex(0)?.ContentID ?? contentID;
				}

				// Use the content ID to load the content
				if(contentID != undefined) {
					// MyDom.removeClass("#listOfContent", "showOnContentLoaded");
					onLoadContent(contentID);
				} else {
					setContentView("default");
				}
				
			});
		} catch (error){
			MyLogger.LogError(error);
		}
	}


/********* CONTENT: Open/Load content *************************************/

	// Link from content list to content view
	function onOpenContent(event){
		var target = event.target;
		var parent = target.closest(".contentPreviewBlock");
		var contentID = parent?.getAttribute("data-content-id");

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

		// Set content title & author
		var contentTitle = content?.Name;
		if(content.Creator != ""){
			contentTitle += `<br/><span class="contentCreatorSection">by: ${content.Creator}</span>`;
		}
		MyDom.setContent("#contentTitle", {"innerHTML": contentTitle });

		
		if(content instanceof StreamVideo){
			MyTemplates.getTemplate("src/templates/adventure/videoIFrame.html", content, (template)=>{
				MyDom.setContent("#videoFramePanel", {"innerHTML":template});
				// Always make sure stream element is configured
				onConfigureStream();
				setContentView("content");
				MyStream.onPlayVideo();
			});	
		}
		// Modify URL when loading content
		onModifyUrl({"content": contentID});
	}

	// Congfigure the stream object
	function onConfigureStream(){
		MyStream.setStreamElement("#videoIFrame");

		// What to do if video errors
		MyStream.onVideoError( ()=> {
			MyLogger.Notify(notifyElement, `<h3 style="color:red;">${frownyFace} ERROR: Could not load the video.</h3>`);
			MyDom.showContent(".showOnError");
		});

		// What to do if video ends
		MyStream.onVideoEnded( ()=> {
			if(MyAdventurePage.hasNextContent()){
				onNext();
			} else {
				onBack();
			}
		});
	}
	
/***** VIEWS: Managing the different views within the page *****************************/

	// Set the current view of things
	function setContentView(state="default")
	{

		

		// Defaults to list view of content
		switch(state)
		{
			case "content":
				// Set the current scroll before showing content
				MyAdventurePage.setScroll(window.scrollX, window.scrollY);
				// Show the content
				MyDom.showContent(".showOnContentView");
				MyDom.hideContent(".hideOnContentView");
				//Showing/hiding the next/prev buttons
				var _next = MyAdventurePage.hasNextContent() ? MyDom.addClass("#nextButton", "clickable") : MyDom.removeClass("#nextButton", "clickable");
				var _prev = MyAdventurePage.hasPrevContent() ? MyDom.addClass("#prevButton", "clickable") : MyDom.removeClass("#prevButton", "clickable");
				// Show/hide the back button
				var _back = MyAdventurePage.getContentCount() == 1 ? MyDom.hideContent("#backIconSection") : MyDom.showContent("#backIconSection");
				break;
			case "description":
				MyDom.showContent(".showOnDescriptionView");
				MyDom.hideContent(".hideOnDescriptionView");
				MyStream.onPauseVideo();
				// We have to show back button for description page (even if just one video)
				MyDom.showContent("#backIconSection");
				break;
			default:
				MyDom.showContent(".showOnListView");
				MyDom.hideContent(".hideOnListView");
				MyStream.onPauseVideo();
				onModifyUrl({"content": ""});
				window.scrollTo(MyAdventurePage.Scroll.X, MyAdventurePage.Scroll.Y);
				MyAdventurePage.setScroll(0, 0);
				break;
		}
		// Make sure to set the current view state to whatever we are setting
		MyAdventurePage.setViewState(state);
	}

/***** NAVIGATION: Changing views within the page *****************************/

	// Navigate back to the last view
	function onBack(){
		var lastViewState = MyAdventurePage.getLastViewState();
		if(lastViewState == "content"){
			MyStream.onPlayVideo();
		}
		setContentView(lastViewState);
	}

	// On navigate back to a content list
	function onPrev(){
		var prevClickable = document.querySelector("#prevButton")?.classList?.contains("clickable") ?? false;
		if(prevClickable){
			onChangeContent("prev");
		}
	}

	// On going to the next video
	function onNext(){
		var nextClickable = document.querySelector("#nextButton")?.classList?.contains("clickable") ?? false;
		if(nextClickable){
			onChangeContent("next");
		}
	}

	// Show the description
	function onShowDescription(){
		setContentView("description");
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

	// Modify URL based on view; Adding/removing content ID
	function onModifyUrl(keyValuePairs={}) {
		var newSearch = MyUrls.getModifiedSearchString(keyValuePairs);
		let newPath = location.pathname + newSearch;
		MyUrls.addWindowHistory({"path":newPath}, true); // use replace to avoid confusion with back button
	}


/***** HELPERS: Supplemental functions *****************************/

	// Unable to load adventures
	function onCantLoadAdventures(details=""){
		MyLogger.Notify("#pageMessages", `<h3><i class="fa-regular fa-face-frown"></i> Sorry, could not load content.</h3>`);
		MyLogger.LogError(details);
	}