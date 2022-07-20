
/************************ GLOBAL VARIABLES ****************************************/

var STREAM_URL = "https://iframe.videodelivery.net/{{videoID}}?autoplay=true";

// Template content;
var IFRAME_TEMPLATE = `<iframe id="videoIFrame" src="{{link}}&" style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`;
var VIDEO_PICKER_BARS = `<span id="videoPickerShowIcon" style="color:forestgreen; font-size:110%;" class="fa fa-bars"></span>&nbsp;`
var VIDEO_PICKER_CLOSE = `<span id="videoPickerHideIcon" style="color:red; font-size:110%;" class="fa fa-times"></span>&nbsp;`
// Secure videos
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"
var IS_PROTECTED = false;

// Store the list of videos
var VIDEOS = [];
var CURR_INDEX = undefined;
var CURR_VIDEO_ID = undefined;

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){

		MyTrello.SetBoardName("videos");

		let adventureID = mydoc.get_query_param("id");
		let videoID = mydoc.get_query_param("video");

		if(adventureID != undefined)
		{
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

	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

	// Adds a listener for keystrokes (on keyup);
	function listenerOnKeyUp(){
		document.addEventListener("keyup", function(event){
			switch(event.code)
			{
				case "Enter":
					if(!GAME_STARTED && !CHECKING_FOR_BINGO)
					{
						onStartGame();
					}
					else if (GAME_STARTED && !CHECKING_FOR_BINGO)
					{
						onPickNumber();
					}
					else if (CHECKING_FOR_BINGO)
					{
						onCheckCardForBingo();
					}
					break;
				default:
					return;
			}
		});
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

					let splits = parts[1].split("/");
					let videoID = splits[splits.length-1];

					let partsObj = {"name":parts[0], "link":parts[1], "videoID":videoID, "desc":parts[2], "author":parts[3] }
					VIDEOS.push(partsObj);

					videoPickerContent +=  `<div class="videoPickerBlock centered dlf_center_block_large pointer" data-video-id="${videoID}" onclick="loadVideo(${VIDEOS.length-1})">
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

		// Get the video
		videoIndex = videoIndex >= VIDEOS.length ? VIDEOS.length-1 : videoIndex;
		var video = VIDEOS[videoIndex];

		// Only proceed if the video exists;
		if(video != undefined)
		{

			// Toggle the next/prev buttons
			toggleNextPrevButtons(videoIndex);

			// Setup the video count
			let videoCount = VIDEOS.length > 1 ? "<br/><span id='videoPickerIcon'>" + VIDEO_PICKER_BARS + `</span><span">(${videoIndex+1} of ${VIDEOS.length})</span>` : "";
			
			// Setup the video title + editor
			let author = video["author"] ?? "";
			let videoEditor = author != "" ? `<br/><span class="video_editor"/>by: ${video["author"]}</span>` : "";
			let videoTitle = video["name"] + videoEditor;

			// Load the video details;
			mydoc.loadContent(videoTitle, "videoTitle");
			mydoc.loadContent(videoCount, "videoCount");
			mydoc.loadContent(video["desc"], "videoDescription");

			// Get/set the video ID;
			let videoID = video["videoID"];
			CURR_VIDEO_ID = videoID;


			// Hide both sections
			mydoc.hideContent("#videoFrameProtectedSection");
			mydoc.hideContent("#videoFrameSection");

			// Check if video can be played;
			if(canPlayVideo(videoIndex))
			{
				let newVideoID = VIDEOS[videoIndex]["videoIDProtected"] ?? VIDEOS[videoIndex]["videoID"];
				let newLink = STREAM_URL.replace("{{videoID}}", newVideoID);
				let iFrame = IFRAME_TEMPLATE.replace("{{link}}", newLink);
				mydoc.loadContent(iFrame, "videoFramePanel");
				mydoc.showContent("#videoFrameSection");

				// Add listeners for the iFrame
				addStreamListeners();
			}
			else
			{
				// Load empty iFrame section;
				mydoc.loadContent("", "videoFramePanel");

				// Show the section to enter passphrase;
				mydoc.showContent("#videoFrameProtectedSection");
			}

			// Set current index
			CURR_INDEX = videoIndex;

			// Set selected video in video picker
			setSelectedVideo(videoID);
		}
	}

	// Validate if this video can be played
	function canPlayVideo(videoIndex)
	{
		let canPlay = true;

		if(IS_PROTECTED)
		{
			// Assume it is false unless cookie exists(below); 
			canPlay = false;

			// Get cookies
			let cookies = document.cookie.split(";");
			let cookieMap = {};
			cookies.forEach(cookie =>{
				let splits = cookie.split("=");
				let key = decodeURIComponent(splits[0]).trim();
				let val = decodeURIComponent(splits[1]).trim();
				cookieMap[key] = val;
			});

			// Check if there is a cookie for current video ID
			let video = VIDEOS[videoIndex];
			let videoID = video["videoID"];
			if(cookieMap.hasOwnProperty(videoID))
			{
				// Set the videoID to be the signed value stored in cookie;
				VIDEOS[videoIndex]["videoIDProtected"] = cookieMap[videoID]; 
				canPlay = true;
			}
		}
		return canPlay;
	}

/***************** ACTIONS / EVENTS ********************** */

	// Validate passphrase & get the secure token
	function onValidatePassphrase(event)
	{
		// Prevent default behavior;
		event.preventDefault();

		// Key elements from form block:
		var passphraseInput = document.getElementById("passphrase");
		var protectedMessage = document.getElementById("protectedMessage");

		// The original message;
		var originalMessage = protectedMessage?.innerText ?? "";

		// The needed content for the call;
		var streamURL = `https://stream-security.the-dancinglion.workers.dev/${CURR_VIDEO_ID}/`;
		var requestBody = {"Content-Type":"application/x-www-form-urlencoded"}
		var passphrase = passphraseInput?.value ?? "";
		var data = `p=${passphrase}`;

		// Make the call to get the signed URL
		myajax.POST(streamURL,data, requestBody, (resp)=>{


			let respData = myajax.GetJSON(resp.responseText);
			console.log(respData);

			if(respData != undefined)
			{
				let token = respData?.result?.token ?? undefined

				if(token != undefined)
				{
					// Set expiration for 1 hour;
					let expDate = new Date();
					expDate.setTime(expDate.getTime() + (60*60*1000)); // Add 1 hour to current time;
					let expires = expDate.toUTCString();
					console.log(expires);

					// // Set the cookie value
					let cookieValue = `${CURR_VIDEO_ID}=${token}`;

					// // Set the cookie
					document.cookie = `${cookieValue}; expires=${expires}; path=/`;

					// Reload the page to specific video
					let currentVideo = CURR_INDEX + 1;
					var newhref = location.href + `&video=${currentVideo}`;
					location.href = newhref;
				}
			}
			else
			{
				MyNotification.notify("#protectedMessage", "Incorrect passphrase! Video not loaded");
				passphraseInput.value = "";
				setTimeout(()=>{
					MyNotification.notify("#protectedMessage", originalMessage);
				},7000);
			}

		}, (resp)=>{
			MyNotification.notify("#protectedMessage", "Something went wrong. Could not load video");
			passphraseInput.value = "";
			setTimeout(()=>{
				MyNotification.notify("#protectedMessage", originalMessage);
			},7000);
			console.log(resp);
		});
	}

	// Incorrect passphrase

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

				// mydoc.removeClass("#nextVideoButton","invisible");
				// mydoc.removeClass("#prevVideoButton","invisible");
			}

			// Set the button text based on index
			mydoc.loadContent(`(video ${videoIndex+2} of ${VIDEOS.length})`, "videoCount");
			// mydoc.loadContent(`NEXT (${videoIndex+2} / ${VIDEOS.length})`, "nextVideoButton");
			// mydoc.loadContent(`PREV (${videoIndex} / ${VIDEOS.length})`, "prevVideoButton");
		}
		else
		{
			mydoc.addClass("#nextVideoButton","hidden");
			mydoc.addClass("#prevVideoButton","hidden");
		}
		


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

	// Listener to show video picker section
	function toggleVideoPicker(forceClose=false)
	{
		let section = document.getElementById("videoPickerSection");
		let isHidden = section.classList.contains("hidden");

		if(isHidden && !forceClose)
		{
			// Toggle the picker section
			mydoc.showContent("#videoPickerSection");
			// mydoc.addClass("#videoPickerSection","open");

			mydoc.loadContent(VIDEO_PICKER_CLOSE,"videoPickerIcon");
			// mydoc.hideContent("#videoCount");
			mydoc.hideContent("#videoDescription");
		}
		else
		{
			mydoc.hideContent("#videoPickerSection");
			// mydoc.removeClass("#videoPickerSection","open");

			mydoc.loadContent(VIDEO_PICKER_BARS,"videoPickerIcon");
			// mydoc.showContent("#videoCount");
			mydoc.showContent("#videoDescription");
		}
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

	