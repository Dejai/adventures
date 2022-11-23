
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
		let videoID = mydoc.get_query_param("video") ?? "";

		if(adventureID != undefined)
		{
			onGetAdventure(adventureID, videoID);
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
	function onGetAdventure(adventureID, videoID)
	{

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
				createAdventure(name, desc, resp["idLabels"]);
				console.log(MyAdventure);

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

							// Load the video based on given index;
							let index = !isNaN(Number(videoID)) ? Number(videoID)-1 : 0;
							console.log("Try to load index: " + index);
							loadVideo(index, initial=true); 
						}
					});
				});
			}
		});
	}

	// Load a video based on index
	function loadVideo(videoIndex, initial=false)
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
		mydoc.hideContent("#videoFrameProtectedSection");
		mydoc.hideContent("#videoFrameSection");
		mydoc.hideContent("#videoSeparator");
		mydoc.hideContent("#moreDetailsLink");
		
		// Check if video can be played;
		if( MyAdventure.canPlayVideos() )
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

			// Load the video details;
			mydoc.setContent("#videoTitle", {"innerHTML":videoTitle});
			mydoc.setContent("#videoDescription", {"innerHTML":video.Description});
		
			// Toggle the next/prev buttons
			toggleNextPrevButtons(MyAdventure.CurrentVideoIndex);

			// Set the iFrame template for the video
			MyTemplates.getTemplate("templates/videoFrame.html", {"VideoID": video.getVideoID() }, (template)=>{
				console.log(template);

				mydoc.setContent("#videoFramePanel", {"innerHTML":template});
				mydoc.showContent("#videoFrameSection");

				// Add listeners for the iFrame
				addStreamListeners();

				// Set the picked video
				setSelectedVideo();

				// Add the video ID to the URL for easy refresh
				let newSearch = mydoc.getNewSearch({"video":videoNum});
				let newPath = location.pathname + newSearch;
				mydoc.addWindowHistory({"path":newPath}, true); // use replace to avoid confusion with back button

			});			
		}
		else if ( getCookie("passphrase") != undefined )
		{
			mydoc.showContent("#loadingGif");
			getSignedVideoID();
		}
		else
		{
			// Load empty iFrame section;
			mydoc.loadContent("", "videoFramePanel");

			// Show the section to enter passphrase;
			mydoc.showContent("#videoFrameProtectedSection");
		}		
	}

/***************** GETTERS / SETTERS ********************** */

	// Get a cookie based on a key
	function getCookie(key)
	{
		// The default value is undefined;
		var cookieValue = undefined; 

		// Setup a  map of cookie key/name pair;
		let cookieMap = {};
		let cookies = document.cookie.split(";");
		cookies.forEach(cookie =>{
			let splits = cookie.split("=");
			let key = decodeURIComponent(splits[0]).trim();
			let val = decodeURIComponent(splits[1]).trim();
			cookieMap[key] = val;
		});

		// If the cookie is set, then make it the value;
		if( cookieMap.hasOwnProperty(key) )
		{
			cookieValue = cookieMap[key];
		}

		return cookieValue;
	}

	// Get the signed video ID
	function getSignedVideoID()
	{
		// Get the passphrase from the cookie; 
		let passphrase = getCookie("passphrase");

		if( passphrase != undefined && passphrase != "undefined" )
		{
			// The needed content for the call;
			let videoID = MyAdventure.getCurrentVideo()?.Video ?? "";
			var streamURL = `https://stream-security.the-dancinglion.workers.dev/${videoID}/`;
			var requestBody = {"Content-Type":"application/x-www-form-urlencoded"}
			var data = `p=${passphrase}`;

			// Make the call to get the signed URL
			myajax.POST(streamURL,data, requestBody, (resp)=>{
						
				let respData = myajax.GetJSON(resp.responseText);

				if(respData != undefined)
				{
					let token = respData?.result?.token ?? undefined
					if(token != undefined)
					{
						// Set the video ID as a token
						setCookie(videoID, token, 60 );

						// Reload the page to specific video
						loadVideo(MyAdventure.getVideoIndex(videoID))
					}
					else
					{
						setResponseMessage("Something went wrong. Could not load video");
					}
				}
				else
				{
					setResponseMessage("Incorrect passphrase! Video not loaded. ");
				}
			}, (resp)=>{
				setResponseMessage("Something went wrong. Could not load video");
			});
		} 
		else
		{
			setResponseMessage("Incorrect passphrase! Video not loaded");
		}

	}

	// Set the adventure details
	function setAdventureDetails()
	{
		if(MyAdventure != undefined)
		{
			console.log("Setting for adventure");
			mydoc.setContent("#adventureTitle", {"innerHTML":MyAdventure.Name});
			mydoc.setContent("#adventureDescription", {"innerHTML":MyAdventure.Description});
		}
	}

	// Set a cookie;
	function setCookie(key, value, expirationMinutes=60)
	{
		// The cookie value;
		let cookieValue = `${key}=${value}`;

		// Set expiration time;
		let expDate = new Date();
		expDate.setTime(expDate.getTime() + (expirationMinutes*60*1000)); // Add 1 hour to current time;
		let expires = expDate.toUTCString();

		// // Set the cookie
		document.cookie = `${cookieValue}; expires=${expires}; path=/`;
	}

	// Set error message for protected input
	function setResponseMessage(message)
	{
		console.log(message);
		// Hide the loader
		mydoc.hideContent("#loadingGif");

		// Maintain the original message in case it is needed again
		var protectedMessage = document.getElementById("protectedMessage");
		console.log(protectedMessage);
		console.log(protectedMessage.innerText);

		var originalMessage = protectedMessage?.innerText ?? "";
		console.log(originalMessage);

		// Make sure the section is visible
		mydoc.showContent("#videoFrameProtectedSection");

		// Update the content;
		MyNotification.notify("#protectedMessage", message);
		// passphraseInput.value = "";
		setTimeout(()=>{
			MyNotification.notify("#protectedMessage", originalMessage);
		},7000);
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

	// Validate passphrase & get the secure token
	function onValidatePassphrase(event)
	{
		// Prevent default behavior;
		event.preventDefault();

		// Show loading gif on form submission
		setResponseMessage(LOADING_GIF);

		// Key elements from form block:
		var passphraseInput = document.getElementById("passphrase");
		var passphrase = passphraseInput?.value ?? "";

		// Set the passphrase as a cookie that is then checked by the function to get the signed ID
		setCookie("passphrase",passphrase, 50);

		getSignedVideoID();


	}

	// Select the next video
	function onNextVideo()
	{
		// Don't do anything if we are at the end of the list of videos
		if(MyAdventure.CurrentVideoIndex >= MyAdventure.Videos.length)
			return

		// Load next possible index
		loadVideo(MyAdventure.CurrentVideoIndex+1);
	}

	// Select the previous video
	function onPrevVideo()
	{
		// Don't do anything if we are at start
		if(MyAdventure.CurrentVideoIndex == 0)
			return 

		// Load prev video by index
		loadVideo(MyAdventure.CurrentVideoIndex-1);
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
			loadVideo(videoIndex);
		}
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

	// Get the stream element
	function getStreamElement()
	{
		var player = Stream(document.getElementById('videoIFrame'));
		return player;
	}

	// Add stream listeners
	function addStreamListeners()
	{
		var stream = getStreamElement();

		// What to do when the video ends;
		stream.addEventListener('ended',onVideoEnded);

		// What to do if there is an error
		stream.addEventListener('error',onVideoError);
	}

	// When the video ends, load the next one
	function onVideoEnded()
	{

		if(MyAdventure.CurrentVideoIndex < MyAdventure.Videos.length-1)
		{
			loadVideo(MyAdventure.CurrentVideoIndex+1);
		}
	}

	// When the video throws an error
	function onVideoError()
	{
		if(MyAdventure.isProtected())
		{
			mydoc.showContent("#videoFrameProtectedSection");
		}
	}

	