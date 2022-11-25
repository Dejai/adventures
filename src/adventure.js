
/************************ GLOBAL VARIABLES ****************************************/
var LOADING_GIF = `<img id="loadingGif" style="width:25px;height:25px;" src="https://dejai.github.io/scripts/assets/img/loading1.gif" alt="...loading">`

// Main instance of adventure
var MyAdventure = undefined;

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){

		// Set name for trello;
		MyTrello.SetBoardName("videos");

		// Get params from URL;
		let adventureID = mydoc.get_query_param("id") ?? "";

		if(adventureID != undefined)
		{
			onGetAdventure(adventureID);
		}

		addListener("#backIcon", "click",onReturnHome);
	});

/********************* LISTENERS *************************************/

	// Add listeners to given selectors
	function addListener(selector, event, listener)
	{
		try
		{
			let objects = document.querySelectorAll(selector);
			if(objects != undefined)
			{
				objects.forEach(obj =>{
					obj.addEventListener(event, listener);
				});
			}

		}catch(err)
		{
			console.error(err);
		}
	}

	// Returning to home page
	function onReturnHome()
	{
		location.href = "/";
	}

/********* SETUP: Create the key things used throughout the file *************************************/

	// Create an instance of the Adventure class
	function createAdventure(name, desc, labels )
	{
		MyAdventure = (MyAdventure != undefined) ? MyAdventure : new Adventure(name, desc, labels);
	}

	// Get this adventure card & its list of videos
	function onGetAdventure(adventureID)
	{

		mydoc.showContent("#loadingGif");

		MyTrello.get_single_card(adventureID,(data)=>{

			let resp = JSON.parse(data.responseText);

			let videoPickerContent = "";

			if(resp != undefined)
			{

				// Creating the instance of adventure
				let name = resp["name"];
				let labels = resp["idLabels"] ;
				let desc = resp["desc"]?.replaceAll("\n", "<br/>");

				// Create the adventure
				createAdventure(name, desc, labels);

				// Set the key adventure details
				setAdventureDetails()
			
				// Get/set the videos; Ordered
				let checklistItems = resp["checklists"][0]["checkItems"] ?? [];
				let videos = checklistItems.sort(function(a,b){
					return a.pos - b.pos;
				});

				// Loop through each video & create instance
				videos.forEach( (video, idx, array) =>{

					let videoObject = new Video(video)
					MyAdventure.addVideo( videoObject );

					MyTemplates.getTemplate("templates/videoPick.html", videoObject, (template)=>{
						videoPickerContent += template;

						if(idx == array.length-1)
						{
							mydoc.setContent("#videoPickerSection", {"innerHTML":videoPickerContent});

							// Load the initial video;
							onLoadInitialVideo();
						}
					});
				});
			}
		});
	}

	// Loading the initial video after loading adventure
	function onLoadInitialVideo()
	{
		// The index of the video to load
		let videoID = mydoc.get_query_param("video") ?? "";
		let index = !isNaN(Number(videoID)) ? Number(videoID)-1 : 0;

		if(MyAdventure.isProtected())
		{
			onLoadProtectedVideos(index);
		}
		else
		{
			onLoadVideo(index, true);	
		}
	}

	// Load a video based on index
	function onLoadVideo(videoIndex, initial=false)
	{
		// Hide the picker section
		toggleVideoPicker(true);

		// If we are on the same video, just return
		if(MyAdventure.onSameVideo(videoIndex) && !initial)
			return

		// Set the index & then get it
		MyAdventure.setCurrentVideoIndex(videoIndex);
		video = MyAdventure.getCurrentVideo();

		// Hide both sections
		// mydoc.hideContent("#videoFrameProtectedSection");
		mydoc.hideContent("#videoFrameSection");
		mydoc.hideContent("#videoSeparator");
		mydoc.hideContent("#moreDetailsLink");

		// Check if video can be played;
		if( MyAdventure.canPlayVideo() )
		{
			mydoc.showContent("#videoSeparator");
			mydoc.showContent("#moreDetailsLink");

			// Setup the video count
			let numberOfVideos = MyAdventure.Videos.length;
			let videoNum = MyAdventure.CurrentVideoIndex+1;
			let videoCount =  numberOfVideos > 1 ?`(${videoNum} of ${numberOfVideos})` : "";
			mydoc.setContent("#videoIndexCount", {"innerHTML":videoCount});

			// Setup the video title + editor
			let author = video.Author ?? "";
			let videoEditor = author != "" ? `<br/><span class="video_editor"/>by: ${author}</span>` : "";
			let videoTitle = (video.Name ?? "") + videoEditor;

			// Load the video details; Hide loading
			mydoc.setContent("#videoTitle", {"innerHTML":videoTitle});
			mydoc.setContent("#videoDescription", {"innerHTML":video.Description});
			setResponseMessage("");
			// Toggle the next/prev buttons
			toggleNextPrevButtons(MyAdventure.CurrentVideoIndex);

			// Set the iFrame template for the video
			MyTemplates.getTemplate("templates/videoFrame.html", {"VideoID": video.getVideoID() }, (template)=>{

				mydoc.setContent("#videoFramePanel", {"innerHTML":template});
				mydoc.showContent("#videoFrameSection");

				// Add listeners for the iFrame
				onConfigureStream();

				// Set the picked video
				setSelectedVideo();

				// Add the video ID to the URL for easy refresh
				let newSearch = mydoc.getNewSearch({"video":videoNum});
				let newPath = location.pathname + newSearch;
				mydoc.addWindowHistory({"path":newPath}, true); // use replace to avoid confusion with back button

			});			
		}
		else
		{
			// Show the section to enter passphrase;
			setResponseMessage("Could not load this video");
		}		
	}

	// Get the signed URL for all protected videos, then load the one based on given index
	function onLoadProtectedVideos(index)
	{
		let passphrase = mydoc.getCookie("AdventureLogin") ?? "";

		if(passphrase != "")
		{
			// Loop through al videos & set 
			MyAdventure.Videos.forEach( (video, idx, array)=>{
				
				// Get the signed video ID;
				getSignedVideoID(video, passphrase);

				if(index != undefined && (idx == array.length-1))
				{
					setTimeout(()=>{
						// Load the video based on given index;
						onLoadVideo(index, initial=true); 
					},1500);
				}
			});
		}
		else
		{
			// Show the section to enter passphrase;
			setResponseMessage("");
			mydoc.showContent("#videoFrameProtectedSection");
		}

	}

/***************** GETTERS / SETTERS ********************** */

	// Get signed video ID
	function getSignedVideoID(video, passphrase)
	{
		var requestBody = `p=${passphrase}`;
		var videoID = video?.VideoID ?? "";
		var cookie = mydoc.getCookie( (video?.VideoID ?? "") ) ?? "";

		// If cookie is already set, don't bother trying to get it again
		if(cookie != "")
			return

		// Get signed URL for a video
		MyStream.getSignedURL(videoID, requestBody,(streamResp)=>{
			
			if(streamResp != undefined)
			{
				// Validate token from signed URL response;
				let token = streamResp?.result?.token ?? undefined;
				if(token != undefined)
				{
					// Set the video ID cookie as the token
					mydoc.setCookie(videoID, token, 60 );
					video.setProtectedID(token);
				}
				else
				{
					setResponseMessage("Something went wrong. No token");
				}
			}
			else
			{
				setResponseMessage("Something went wrong. Could not get signed video ID");
			}
		});
	}

	// Set the adventure details
	function setAdventureDetails()
	{
		if(MyAdventure != undefined)
		{
			mydoc.setContent("#adventureTitle", {"innerHTML":MyAdventure.Name});
			mydoc.setContent("#adventureDescription", {"innerHTML":MyAdventure.Description});
		}
	}

	// Set error message for protected input
	function setResponseMessage(message)
	{
		// Hide the loader
		mydoc.hideContent("#loadingGif");
		mydoc.setContent("#protectedMessage", message);
	}

	// Set the video that is selected in the video picker;
	function setSelectedVideo()
	{

		let videoID = MyAdventure.getCurrentVideo()?.VideoID ?? ""

		// Clear from all;
		document.querySelectorAll(".videoPickerBlock.selected").forEach(ele =>{
			ele.classList.remove("selected");
		});

		// Add that class to the current selected block
		mydoc.addClass(`.videoPickerBlock[data-video-id='${videoID}']`, "selected");

	}

/***************** ACTIONS / EVENTS ********************** */

	// Select the next video
	function onNextVideo()
	{
		// Don't do anything if we are at the end of the list of videos
		if(MyAdventure.CurrentVideoIndex >= MyAdventure.Videos.length)
			return

		// Load next possible index
		onLoadVideo(MyAdventure.CurrentVideoIndex+1);
	}

	// Select the previous video
	function onPrevVideo()
	{
		// Don't do anything if we are at start
		if(MyAdventure.CurrentVideoIndex == 0)
			return 

		// Load prev video by index
		onLoadVideo(MyAdventure.CurrentVideoIndex-1);
	}

	// Pick a video from the list of videos
	function onPickVideo(event)
	{
		let target = event.target;
		let videoID = target.getAttribute("data-video-id") ?? "";
		let videoIndex = MyAdventure.getVideoIndex(videoID) ?? -1;

		// Make sure we have a video ID and index
		if(videoID != "" && videoIndex >= 0)
		{
			onLoadVideo(videoIndex);
		}
	}

	// Navigate to page for login
	function onNavigateToLogin()
	{
		let newPath = location.href.replace("/adventure", "/login");
		location.replace(newPath);
	}

/********** VISIBILITY ********************** */

	// Toggle the details about the adventure
	function toggleDetails(state)
	{

		if(state == "show")
		{
			// Hide sections
			mydoc.hideContent(`#adventureMenuSection`);
			mydoc.hideContent(`#moreDetailsLink`);
			mydoc.hideContent("#videoDescription");
			mydoc.hideContent("#adventureSeparator");

			// Show full content;
			mydoc.showContent(`#adventureDescription`);
			mydoc.showContent(`#lessDetailsLink`);
		}
		else
		{
			// Show menu sections
			mydoc.showContent(`#adventureMenuSection`);
			mydoc.showContent(`#moreDetailsLink`);
			mydoc.showContent("#videoDescription");
			mydoc.showContent("#adventureSeparator");

			// Hide full content;
			mydoc.hideContent(`#adventureDescription`);
			mydoc.hideContent(`#lessDetailsLink`);
		}
	}

	// Toggle visibility of next/previous buttons
	function toggleNextPrevButtons(videoIndex)
	{
		//This only matters if there is more than one video
		if(MyAdventure.Videos.length > 1)
		{
			// Show the key navigation for adventures with more than one 
			mydoc.showContent("#nextVideoButton");
			mydoc.showContent("#prevVideoButton");
			mydoc.showContent("#videoIndexCountSection")

			// Last video in list
			if(videoIndex == MyAdventure.Videos.length-1)
			{
				// Make next button gray;
				mydoc.addClass("#nextVideoButton", "dlf_button_gray");
				mydoc.removeClass("#nextVideoButton", "dlf_button_blue");

				// Make prev button orange;
				mydoc.addClass("#prevVideoButton", "dlf_button_orange");
				mydoc.removeClass("#prevVideoButton", "dlf_button_gray");
			}

			// If first video ...
			if(videoIndex == 0)
			{
				// Make prev button gray
				mydoc.addClass("#prevVideoButton", "dlf_button_gray");
				mydoc.removeClass("#prevVideoButton", "dlf_button_orange");

				// Make next button blue;
				mydoc.addClass("#nextVideoButton", "dlf_button_blue");
				mydoc.removeClass("#nextVideoButton", "dlf_button_gray");
			}

			// If NOT zero and NOT last, then show both
			if(videoIndex != 0 && videoIndex != MyAdventure.Videos.length-1)
			{
				// Make prev button orange
				mydoc.addClass("#prevVideoButton", "dlf_button_orange");
				mydoc.removeClass("#prevVideoButton", "dlf_button_gray");

				// Make next button blue;
				mydoc.addClass("#nextVideoButton", "dlf_button_blue");
				mydoc.removeClass("#nextVideoButton", "dlf_button_gray");
			}
		}
		else
		{
			mydoc.addClass("#nextVideoButton","hidden");
			mydoc.addClass("#prevVideoButton","hidden");
		}
		


	}

	// Listener to show video picker section
	function toggleVideoPicker(forceClose=false)
	{
		let section = document.getElementById("videoPickerSection");
		let isHidden = section.classList.contains("hidden");

		if(isHidden && !forceClose)
		{
			// THide things
			mydoc.hideContent("#videoPickerShowIcon");
			mydoc.hideContent("#videoFrameSection");

			// Show things
			mydoc.showContent("#videoPickerSection");
			mydoc.showContent("#videoPickerHideIcon");
		}
		else
		{
			// Hide things
			mydoc.hideContent("#videoPickerSection");
			mydoc.hideContent("#videoPickerHideIcon");

			// Show things
			mydoc.showContent("#videoFrameSection");
			mydoc.showContent("#videoPickerShowIcon");

		}
	}

/*********************** Stream API Helper *****************************/

	// Add stream listeners
	function onConfigureStream()
	{

		// Set the stream element
		MyStream.setStreamElement( document.getElementById("videoIFrame") );

		// Set listener for video ended
		MyStream.onVideoEnded( ()=>{
			if(MyAdventure.CurrentVideoIndex < MyAdventure.Videos.length-1)
			{
				onLoadVideo(MyAdventure.CurrentVideoIndex+1);
			}
		});

		// Set listener for video error
		MyStream.onVideoError( ()=>{
			console.log("Something went wrong");
		});
	}
	