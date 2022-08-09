
/************************ GLOBAL VARIABLES ****************************************/

var STREAM_URL = "https://iframe.videodelivery.net/{{videoID}}?autoplay=true";

// Template content;
var IFRAME_TEMPLATE = `<iframe id="videoIFrame" src="{{link}}&" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`;
var VIDEO_PICKER_BARS = `<span id="videoPickerShowIcon" style="color:forestgreen; font-size:110%;" class="fa fa-bars"></span>&nbsp;`
var VIDEO_PICKER_CLOSE = `<span id="videoPickerHideIcon" style="color:red; font-size:110%;" class="fa fa-times"></span>&nbsp;`
var LOADING_GIF = `<img id="loadingGif" style="width:25px;height:25px;" src="https://dejai.github.io/scripts/assets/img/loading1.gif" alt="...loading">`

// Secure videos
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"
var IS_PROTECTED = false;

// Store the list of videos
var VIDEOS = [];
var CURR_INDEX = undefined;
var CURR_VIDEO_ID = undefined;
var CURR_ADVENTURE_ID = undefined;

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){

		MyTrello.SetBoardName("videos");

		let adventureID = mydoc.get_query_param("id");
		let videoID = mydoc.get_query_param("video");

		if(adventureID != undefined)
		{
			CURR_ADVENTURE_ID = adventureID; 
			loadAdventureVideos(adventureID, videoID);
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
			console.log(err);
		}
	}

	// Returning to home page
	function onReturnHome()
	{
		location.href = "/";
	}

/********************** LOAD CONTENT *******************************/

	// Get list of videos from this adventure
	function loadAdventureVideos(adventureID, videoID)
	{
		MyTrello.get_single_card(adventureID,(data)=>{

			let resp = JSON.parse(data.responseText);

			let videoPickerContent = "";

			if(resp != undefined)
			{

				// Check if this is a secure adventure
				if(resp["idLabels"].includes(SECURE_LABEL_ID))
				{
					IS_PROTECTED = true;
				}

				let name = resp["name"];
				mydoc.loadContent(name,"adventureTitle");

				let desc = resp["desc"]?.replaceAll("\n", "<br/>");
				mydoc.loadContent(desc,"adventureDescription");

				let checklistItems = resp["checklists"][0]["checkItems"] ?? [];

				// Order videos by pos;
				let videos = checklistItems.sort(function(a,b){
					return a.pos - b.pos;
				});

				// video num count;
				let count = 0;
				videos.forEach(video =>{

					count++; //increment count

					let id = video["id"];
					let parts = video["name"].split(" ~ ");

					// Parse video URL & get video ID;
					let videoURL = new URL(parts[1]) ?? "";
					let videoID = videoURL.pathname.replaceAll("/","");

					let partsObj = {"name":parts[0], "link":parts[1], "videoID":videoID, "desc":parts[2], "author":parts[3] }
					VIDEOS.push(partsObj);

					videoPickerContent +=  `<div class="videoPickerBlock centered dlf_center_block_large pointer" data-video-id="${videoID}" onclick="loadVideoByURL(${VIDEOS.length})">
												<table style="width:100%;">
													<tr>
														<td class="datacell">
															<span class="videoPickerCircle">${count}</span>
														</td>
														<td class="datacell" style="text-align: left; padding-left:10%;">
															<p class="title">
																${partsObj["name"]} 
																&nbsp; <i class="fa fa-external-link openLinkIcon" aria-hidden="true"></i>
															<p>
															<p class="description">${partsObj["desc"]}
														</td>
													</tr>
												</table>
											</div>`;

				});
			}

			// Load the section for picking a video
			mydoc.loadContent(videoPickerContent,"videoPickerSection");

			// Load the video based on given index;
			let index = !isNaN(Number(videoID)) ? Number(videoID)-1 : 0
			loadVideo(index)
			
		});
	}

	// Load a video based on index
	function loadVideo(videoIndex)
	{

		// Hide the picker section
		toggleVideoPicker(true);

		// Don't do anything if the index is the same as current; 
		if(videoIndex == CURR_INDEX)
		{
			return; 
		}

		// Get the video index
		videoIndex = videoIndex >= VIDEOS.length ? VIDEOS.length-1 : videoIndex;

		// The target video object;
		var video = VIDEOS[videoIndex];
		let videoID = video["videoID"];
		// Get/set the video ID;
		CURR_VIDEO_ID = videoID;

		// Set selected video index & video in video picker
		setCurrentVideoIndex(videoIndex);
		setSelectedVideo(videoID);

		// Hide both sections
		mydoc.hideContent("#videoFrameProtectedSection");
		mydoc.hideContent("#videoFrameSection");
		mydoc.hideContent("#videoSeparator");
		mydoc.hideContent("#moreDetailsLink");
		
		// Check if video can be played;
		if( canPlayVideo(videoIndex) )
		{

			mydoc.showContent("#videoSeparator");
			mydoc.showContent("#moreDetailsLink");

			// Setup the video count
			let videoCount = VIDEOS.length > 1 ? "<br/><span id='videoPickerIcon'>" + VIDEO_PICKER_BARS + `</span><span>(${videoIndex+1} of ${VIDEOS.length})</span>` : "";
			
			// Setup the video title + editor
			let author = video["author"] ?? "";
			let videoEditor = author != "" ? `<br/><span class="video_editor"/>by: ${video["author"]}</span>` : "";
			let videoTitle = video["name"] + videoEditor;

			// Load the video details;
			mydoc.loadContent(videoTitle, "videoTitle");
			mydoc.loadContent(videoCount, "videoCount");
			mydoc.loadContent(video["desc"], "videoDescription");
		
			// Toggle the next/prev buttons
			toggleNextPrevButtons(videoIndex);

			let newVideoID = VIDEOS[videoIndex]["videoIDProtected"] ?? VIDEOS[videoIndex]["videoID"];
			let newLink = STREAM_URL.replace("{{videoID}}", newVideoID);
			let iFrame = IFRAME_TEMPLATE.replace("{{link}}", newLink);
			mydoc.loadContent(iFrame, "videoFramePanel");
			mydoc.showContent("#videoFrameSection");

			// Add listeners for the iFrame
			addStreamListeners();
		}
		else if ( getCookie("passphrase") != undefined )
		{
			mydoc.showContent("#loadingGif");
			getSignedVideoID(CURR_VIDEO_ID);
		}
		else
		{
			// Load empty iFrame section;
			mydoc.loadContent("", "videoFramePanel");

			// Show the section to enter passphrase;
			mydoc.showContent("#videoFrameProtectedSection");
		}

		
	}

	// Load specific video (via URL)
	function loadVideoByURL(videoNumber)
	{
		// Hide the picker section
		toggleVideoPicker(true);
		
		// Don't do anything if the index is the same as current; 
		if( (videoNumber-1) == CURR_INDEX)
		{
			return; 
		}

		var newhref = location.origin + location.pathname + "?id=" + CURR_ADVENTURE_ID + "&video=" + videoNumber;
		location.href = newhref;
	}

	// Validate if this video can be played
	function canPlayVideo(videoIndex)
	{
		let canPlay = true;

		if(IS_PROTECTED)
		{
			// Assume it is false unless cookie exists(below); 
			canPlay = false;

			// Check if there is a cookie for current video ID
			let video = VIDEOS[videoIndex];
			let videoID = video["videoID"];
			var protectedVideoID = getCookie(videoID);

			// If the protected video ID is set;
			if(protectedVideoID != undefined)
			{
				// Set the videoID to be the signed value stored in cookie;
				VIDEOS[videoIndex]["videoIDProtected"] = protectedVideoID; 
				canPlay = true;
			}
		}
		return canPlay;
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
	function getSignedVideoID(videoID)
	{
		// Get the passphrase from the cookie; 
		let passphrase = getCookie("passphrase");

		if( passphrase != undefined && passphrase != "undefined" )
		{
			// The needed content for the call;
			var streamURL = `https://stream-security.the-dancinglion.workers.dev/${CURR_VIDEO_ID}/`;
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
						setCookie(CURR_VIDEO_ID, token, 60 );

						// Reload the page to specific video
						let videoNumber = CURR_INDEX + 1;
						loadVideoByURL(videoNumber);
					}
				}
				else
				{
					setResponseMessage("Incorrect passphrase! Video not loaded");
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

	// Set the current video index;
	function setCurrentVideoIndex(index)
	{
		// Set current index
		CURR_INDEX = index;
	}

	// Set error message for protected input
	function setResponseMessage(message)
	{
		// Maintain the original message in case it is needed again
		var protectedMessage = document.getElementById("protectedMessage");
		var originalMessage = protectedMessage?.innerText ?? "";

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
	function setSelectedVideo(videoID)
	{
		let block = document.querySelector(`.videoPickerBlock[data-video-id='${videoID}']`);

		if(block != undefined)
		{
			// Clear from all;
			document.querySelectorAll(".videoPickerBlock .selected").forEach(ele =>{
				ele.classList.remove("selected");
			});

			// Add to current; 
			let circle = block.querySelector(".videoPickerCircle");
			let title = block.querySelector(".title");
			if(circle != undefined && title != undefined)
			{
				circle.classList.add("selected");
				title.classList.add("selected");
			}
		}
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

		getSignedVideoID(passphrase);


	}

	// Select the next video
	function onNextVideo()
	{
		if(CURR_INDEX+1 >= VIDEOS.length)
		{
			return;
		}
		loadVideo(CURR_INDEX+1)
	}

	// Select the previous video
	function onPrevVideo()
	{
		loadVideo(CURR_INDEX-1)
	}

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
		if(VIDEOS.length > 1)
		{
			mydoc.removeClass("#nextVideoButton","hidden");
			mydoc.removeClass("#prevVideoButton","hidden");

			// Last video in list
			if(videoIndex == VIDEOS.length-1)
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
			if(videoIndex != 0 && videoIndex != VIDEOS.length-1)
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
			// Toggle the picker section
			mydoc.showContent("#videoPickerSection");
			mydoc.loadContent(VIDEO_PICKER_CLOSE,"videoPickerIcon");
			mydoc.hideContent("#videoDescription");
		}
		else
		{
			mydoc.hideContent("#videoPickerSection");
			mydoc.loadContent(VIDEO_PICKER_BARS,"videoPickerIcon");
			mydoc.showContent("#videoDescription");
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

		if(CURR_INDEX < VIDEOS.length-1)
		{
			loadVideo(CURR_INDEX+1);
		}
	}

	// When the video throws an error
	function onVideoError()
	{
		if(IS_PROTECTED)
		{
			mydoc.showContent("#videoFrameProtectedSection");
		}
	}

	