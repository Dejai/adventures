
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("adventures");
const MyAdventurePage = new AdventurePage();
const MyStream = new StreamManager();

const touchEvent = "ontouchstart" in window ? "touchstart" : "click";
const frownyFace = `<i class="fa-regular fa-face-frown"></i>`;

/*********************** GETTING STARTED *****************************/
	// Once doc is ready
	MyDom.ready( async () => {

		var userDetails = await MyAuth.onGetLoginDetails();
		console.log(userDetails);
		MyDom.setContent(".authLink", {"innerText": userDetails.actionText, "data-href": `auth/?action=${userDetails.action}`});
		MyDom.setContent(".userName", {"innerText": userDetails.userName, "data-user-key": userDetails.userKey} );

		// Get params from URL;
		let adventureID = MyUrls.getSearchParam("id") ?? "";
		if(adventureID != undefined){
			onGetAdventure(adventureID);
		}
	});

/********* SETUP: Create the key things used throughout the file *************************************/

	// Get this adventure card & its list of videos
	async function onGetAdventure(adventureID)
	{
		MyDom.showContent("#loadingGif");

		try {
			MyTrello.GetCard(adventureID, async (resp) => {				
				
				var adventure = new Adventure(resp);

				if(adventure.AdventureID == ""){
					onCantLoadContent();
					return;
				}
				
				// Set the name & description
				MyDom.setContent("#adventureTitle", {"innerHTML":adventure.Name});
				MyDom.setContent("#adventureDescription", {"innerHTML":adventure.MoreDetails});

				// Get the adventure Videos for this adventure
				var adventureVideos = await CloudflareWrapper.GetVideos(adventure.AdventureID);
				var streamVideos = adventureVideos.map(x => new StreamVideo(x));
				// Sort the stream videos by date (oldest first);
				streamVideos.sort( (a,b) => {
					return (a.Date - b.Date);
				});
				// Add the videos to the adventure instance
				adventure.addContent(streamVideos);

				// Set the current adventure
				MyAdventurePage.setAdventure(adventure);

				// If no content, show error message & stop processing
				if(MyAdventurePage.getContentCount() == 0){
					onCantLoadContent(`<h3>${frownyFace} <span style="color:red;">No content found to load.</span> </h3>`);
					return;
				}

				// Load the video preview templates
				var contentPreviewTemplate = await MyTemplates.getTemplateAsync("src/templates/adventure/contentPreview.html", streamVideos);
				MyDom.setContent("#contentListSection", {"innerHTML": contentPreviewTemplate});

				// If param ID is set or there is only, load that video immediately 
				var contentID = MyUrls.getSearchParam("content");
				
				// If there is only one video, also set immediately;
				if( (MyAdventurePage.getContentCount() == 1) ){
					contentID = MyAdventurePage.getContentByIndex(0)?.ContentID ?? contentID;
				}

				// Use the content ID to load the content
				if(contentID != undefined) {
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

	// Adventure notify message
	function onCantLoadContent(message="")
	{
		var isLoggedIn = (document.querySelector(".userName")?.getAttribute("data-user-key") ?? "") != "";
		var loginRequired = `<h3><i class="fa-solid fa-circle-user"></i> <a class="loginAction" href="auth/?action=1" target="_top">Login</a> required to view this content.</h3>`;
		var couldNotLoadContent = `<h3>${frownyFace} Could not load content</h3>`;
		var message = (message != "") ? message :  (!isLoggedIn) ? loginRequired : couldNotLoadContent;
		MyLogger.Notify("#messageSection", message);
	}

	// Link from content list to content view
	function onOpenContent(event){
		var target = event.target;
		var parent = target.closest(".contentPreviewBlock");
		var contentID = parent?.getAttribute("data-content-id");

		// First check if the content is already loaded (if so, just show the content screen)
		var existingContent = document.querySelector(`iframe[data-content-id='${contentID}']`);

		if(existingContent != undefined){
			setContentView("content");
			MyStream.playVideo();
		} else if (contentID != undefined){
			onLoadContent(contentID);
		}
	}

	// Load content
	async function onLoadContent(contentID)
	{
		var content = MyAdventurePage.getContentByID(contentID);

		// Set content title & author
		var contentTitle = content?.Name ?? "";
		var contentCreator = content?.Creator ?? "";
		// Check to see if I should exclude this creator
		var excludeCreators = ["Derrick Fyfield", "Dancing Lion", "Dejai"];
		var toBeExcluded = (excludeCreators.filter(x => contentCreator.includes(x)).length > 0);
		// Only show creators if available & not excluded
		if(contentCreator != "" && !toBeExcluded) {
			contentTitle += `<br/><span class="contentCreatorSection">by: ${content.Creator}</span>`;
		}
		MyDom.setContent("#contentTitle", {"innerHTML": contentTitle });
		
		if(content instanceof StreamVideo) {
			var videoIFrameTemplate = await MyTemplates.getTemplateAsync("src/templates/adventure/videoIFrame.html", content); 
			MyDom.setContent("#videoFramePanel", {"innerHTML":videoIFrameTemplate});
			// Always make sure stream element is configured
			setContentView("content");
			onConfigureStream();
			MyStream.playVideo();
		}
		// Modify URL when loading content
		onModifyUrl({"content": contentID});

		// Get the short link for this content
		var shortLink = await MyUrls.getCodeFromPath();
		MyDom.setContent(".shortLink", {"data-short-link": shortLink});
		MyDom.showContent(".shareLinkSection");
	}


	// Copy the content
	function onCopyShortLink() {
		var shortLinkVal = document.querySelector(".shortLink")?.getAttribute("data-short-link") ?? "n/a";

		 // Copy the text inside the text field
		navigator.clipboard.writeText(shortLinkVal);

		// Alert the copied text
		MyDom.showContent(".showOnLinkCopied");
		MyDom.hideContent(".hideOnLinkCopied");

		// Reset copy
		setTimeout( ()=> {
			MyDom.showContent(".hideOnLinkCopied");
			MyDom.hideContent(".showOnLinkCopied");
		}, 2000);
	  }

	// Configure the stream object
	function onConfigureStream() {
		MyStream.setStreamElement("#videoFrame");

		// What to do if video errors
		MyStream.onVideoEvent("error", (ev)=> {
			console.error(ev);
			onCantLoadContent(`<h3 style="color:red;">${frownyFace} ERROR: Could not load the video.</h3>`);
			MyDom.showContent(".showOnError");
		});

		// What to do if video is playing
		MyStream.onVideoEvent("playing", (event) => {
			showNavButtons();
		});

		// What to do if video is playing
		MyStream.onVideoEvent("pause", () => {
			showNavButtons();
		});
	}

	// Temporarily show the nav
	function showNavButtons(hideAfter=3000) {
		MyDom.addClass(".contentNav", "visible");
		setTimeout( ()=> {
			MyDom.removeClass(".contentNav", "visible");
		}, hideAfter);
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
				// Show/hide the prev button
				var _back = MyAdventurePage.getContentCount() == 1 ? MyDom.hideContent(".hideIfOneContent") : MyDom.showContent(".hideIfOneContent");
				//Showing/hiding the next/prev buttons
				var _next = MyAdventurePage.hasNextContent() ? MyDom.replaceClass("#contentNavRight", "disabled", "clickable") : MyDom.replaceClass("#contentNavRight", "clickable", "disabled");
				var _prev = MyAdventurePage.hasPrevContent() ? MyDom.replaceClass("#contentNavLeft", "disabled", "clickable") : MyDom.replaceClass("#contentNavLeft", "clickable", "disabled");
				break;
			case "description":
				MyDom.showContent(".showOnDescriptionView");
				MyDom.hideContent(".hideOnDescriptionView");
				MyStream.pauseVideo();
				// We have to show back button for description page (even if just one video)
				MyDom.showContent("#backIconSection");
				break;
			default:
				MyDom.showContent(".showOnListView");
				MyDom.hideContent(".hideOnListView");
				MyStream.pauseVideo();
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
	function onPreviousView(){
		var lastViewState = MyAdventurePage.getLastViewState();
		console.log(lastViewState);
		// If only one content, then just go back to all adventures
		if(lastViewState == "home"){
			MyUrls.navigateTo("/");
		} else { 
			// If going back to content
			if(lastViewState == "content"){
				MyStream.playVideo();
			}
			setContentView(lastViewState);
		}
	}

	// On navigate back to a content list
	function onPrev(){
		var prevClickable = document.querySelector("#contentNavLeft")?.classList?.contains("clickable") ?? false;
		if(prevClickable){
			onChangeContent("prev");
		}
	}

	// On going to the next video
	function onNext(){
		var nextClickable = document.querySelector("#contentNavRight")?.classList?.contains("clickable") ?? false;
		if(nextClickable){
			onChangeContent("next");
		}
	}

	// Show the description
	function onShowDescription(){
		setContentView("description");
		toggleDropdownNav()
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
