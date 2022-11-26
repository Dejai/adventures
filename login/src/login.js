
/************************ GLOBAL VARIABLES ****************************************/
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
			let newPath = location.href.replace("/login", "/adventure");
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

		// Clear errors (if any);
		mydoc.setContent("#resultsMessage", {"innerHTML":""} );

		// Show spinning ; Hide button;
		mydoc.showContent("#submitLoadingGIF");
		mydoc.hideContent("#submitButton");

		// Get parts from form & key setup for URL
		var username = mydoc.getContent("#username")?.value ?? "";
		var passphrase = mydoc.getContent("#passphrase")?.value ?? "";
		var userObj = {userName: username, passPhrase: passphrase};

		// Load the saved user cards & validate
		MyTrello.get_list_by_name( "Users", (listData)=>{
				
			let listResp = JSON.parse(listData.responseText);
			let listID = listResp[0]?.id;

			// Get the cards from the matching list
			MyTrello.get_cards(listID, (data2) => {
				
				let response = JSON.parse(data2.responseText);

				// Get the cards that match the given name 
				let matchingUsers = response.filter( (obj)=> {
					return (obj.name.toUpperCase().includes(username.toUpperCase()));
				});

				console.log("Matching users");
				console.log(matchingUsers);

				// Validate all possible users
				onValidateDigest(matchingUsers, userObj);
			});
		});
	}

	// Validate the digest for user
	async function onValidateDigest(matchingUsers, userObj)
	{
		let requestBody = `u=${userObj.userName}&p=${userObj.passPhrase}`;

		// Validate the digest for details given
		MyStream.validateUser(requestBody, (streamResponse)=>{

			// Key part of responses
			let state = streamResponse?.state ?? "";
			let digest = streamResponse?.digest ?? "";
			let cookie = streamResponse?.cookie ?? "";

			// Filter matching users down to one with matching digest
			var singleUser = matchingUsers.filter( (user)=>{
				return (user.desc == digest);
			});

			if(state == "Success" && singleUser.length == 1)
			{
				// Set Adventure login
				console.log("Success");
				mydoc.setCookie("AdventureLogin", cookie, MyStream.cookieLimit);
				mydoc.setCookie("AdventureUser", singleUser[0]["name"] , MyStream.cookieLimit);
				onNavigateAfterLogin();
			}
			else
			{
				onBadAttempt("Invalid username/password combo.");
			}
		});
	}
