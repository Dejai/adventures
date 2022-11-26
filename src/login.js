
/************************ GLOBAL VARIABLES ****************************************/
var LOADING_GIF = `<img id="loadingGif" style="width:25px;height:25px;" src="https://dejai.github.io/scripts/assets/img/loading1.gif" alt="...loading">`

// Main instance of adventure
var MyAdventure = undefined;

/*********************** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){
		// Set name for trello;
		MyTrello.SetBoardName("videos");
	});

/********************* LISTENERS *************************************/

	// Returning to home page
	function onReturnHome(){
		location.href = "/";
	}

/***************** ACTIONS / EVENTS ********************** */

	// Dynamically updating fields
	function onCleanValue()
	{
		let identifiers = ["#username", "#passphrase"];
		identifiers.forEach( (identifier)=>{
			let original = mydoc.getContent(identifier)?.value ?? "";
			let cleanValue = MyStream.cleanValue(original);
			mydoc.setContent(identifier, {"value":cleanValue});
		});
	}

	// Navigating after login
	function onNavigateAfterLogin()
	{
		let adventureID = mydoc.get_query_param("id") ?? "";

		if(adventureID != "")
		{
			console.log("Adventure ID: " + adventureID);
			let newPath = location.href.replace("/login", "/adventure");
			console.log("New path: " + newPath);
			location.href = newPath;
		}
		else
		{
			location.href = "/";
		}
	}

	// Show message if bad attempt
	function onBadAttempt(message)
	{
		mydoc.setContent("#resultsMessage", {"innerHTML":message} );
		mydoc.hideContent("#submitLoadingGIF");
		mydoc.showContent("#submitButton");
	}

	// Validate passphrase & get the secure token
	function onValidatePassphrase(event)
	{
		// Prevent default behavior;
		event.preventDefault();

		// Show spinning ; Hide button;
		mydoc.showContent("#submitLoadingGIF");
		mydoc.hideContent("#submitButton");

		// Get parts from form & key setup for URL
		var username = mydoc.getContent("#username")?.value ?? "";
		var passphrase = mydoc.getContent("#passphrase")?.value ?? "";

		// Load the saved user cards & validate
		MyTrello.get_list_by_name( "Users", (listData)=>{
				
			let listResp = JSON.parse(listData.responseText);
			let listID = listResp[0]?.id;

			// Get the cards from the matching list
			MyTrello.get_cards(listID, (data2) => {
				
				let response = JSON.parse(data2.responseText);

				// Get list of games
				let playerCards = response.filter( (obj)=>{
					return (obj.name.toUpperCase().includes(username.toUpperCase()));
				});

				if (playerCards.length == 1)
				{
					
					// Expected digest
					let savedDigest = playerCards[0]["desc"];
					// Key request parts
					let requestBody = `u=${username}&p=${passphrase}`;
					console.log(requestBody);

					// Validate the digest
					MyStream.validateUser(requestBody, (streamResponse)=>{

						console.log(streamResponse);

						// Key part of responses
						let state = streamResponse?.state ?? "";
						let digest = streamResponse?.digest ?? "";
						let cookie = streamResponse?.cookie ?? "";

						console.log(passphrase + " = " + digest);

						if(state == "Success" && digest == savedDigest)
						{
							// Set Adventure login
							mydoc.setCookie("AdventureLogin", cookie, MyStream.cookieLimit);
							mydoc.setCookie("AdventureUser", playerCards[0]["name"] , MyStream.cookieLimit);
							onNavigateAfterLogin();
						}
						else
						{
							onBadAttempt("Invalid username/password combo.");
						}
					});
				}
				else
				{
					onBadAttempt("Invalid username/password combo.");
				}
			});
		});
	}

