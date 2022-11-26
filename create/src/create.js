
var ExistingUsers = [];
var ListIDs = {};

/******** GETTING STARTED *****************************/

	// Once doc is ready
	mydoc.ready(function(){
		// Set name for trello;
		MyTrello.SetBoardName("videos");

		// Get list IDs
		onGetListIDS();

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
		let identifiers = ["#username", "#nickname", "#phoneNumber"];
		identifiers.forEach( (identifier)=>{
			let original = mydoc.getContent(identifier)?.value ?? "";
			let cleanValue = MyStream.cleanValue(original);
			mydoc.setContent(identifier, {"value":cleanValue});
		});
	}

	// Get the list IDs to be used for this process
	function onGetListIDS()
	{
		let names = ["Requested", "Users"];

		names.forEach( (name) => {
			MyTrello.get_list_by_name( name, (data)=>{
				let listResp = JSON.parse(data.responseText);
				let listID = listResp[0]?.id ?? "";
				if(listID != "" ) { ListIDs[name] = listID; }

				console.log(ListIDs);
			});
		});
	}

	// Validate passphrase & get the secure token
	function onCreateNewUser(event)
	{

		// Prevent default behavior;
		event.preventDefault();

		// Show spinning ; Hide button;
		mydoc.showContent("#submitLoadingGIF");
		mydoc.hideContent("#submitButton");

		// If the ListID is not set, error message & return
		if(ListIDs?.Requested == undefined)
		{
			onCreateUserFailure("Could not create user. Missing list");
			return;
		}

		// Get parts from form & key setup for URL
		var username = MyStream.cleanValue(mydoc.getContent("#username")?.value ?? "");
		var nickname = MyStream.cleanValue(mydoc.getContent("#nickname")?.value ?? "");
		var phoneNumber = MyStream.cleanValue(mydoc.getContent("#phoneNumber")?.value ?? "");

		// The new user object
		let newUser = {userName:username, nickName: nickname, phoneNumber:phoneNumber};

		// Create card name
		if(username != "" && nickname != "" && phoneNumber != "")
		{
			onCreateNewCard(newUser);
		}
		else
		{
			onCreateUserFailure("Please enter a value for each required field.");
		}
	}

	// Create the new card for the new user
	function onCreateNewCard(userObj)
	{

		var cardName = `${userObj.userName} ~ ${userObj.nickName}`;
		console.log("Creating a user card: " + cardName);

		MyTrello.create_card(ListIDs.Requested, cardName, (newCard)=>{

			let cardResp = JSON.parse(newCard.responseText);

			if(newCard.status == 200)
			{
				onCreateNewPass(userObj, cardResp);
			}
			else
			{
				onCreateUserFailure("Could not create the new user. Something went wrong");
			}
		});	
	}

	// Validate the new user object
	function onCreateNewPass(userObj, cardResp)
	{
		let requestBody = `p=${userObj.phoneNumber}`;

		MyStream.validateUser(requestBody, (streamResponse)=>{
			console.log(streamResponse);

			// Key part of responses
			let digest = streamResponse?.digest ?? "";

			// Set digest in card
			if(digest != "")
			{ 
				MyTrello.update_card_description(cardResp["id"], digest, (data)=>{
					onCreatUserSuccess();
				});
			}
			else
			{
				onCreateUserFailure("Could not set new user pass. Something went wrong");
			}
		});
	}

	// Failure to create user
	function onCreateUserFailure(message)
	{
		mydoc.setContent("#resultsMessage", {"innerHTML":message});
		mydoc.hideContent("#submitLoadingGIF");
		mydoc.showContent("#submitButton");
	}

	// Successful creation of user
	function onCreatUserSuccess()
	{
		mydoc.setContent("#resultsMessage", {"innerHTML":""});
		mydoc.showContent("#successMessage");
		mydoc.showContent("#createUserSection");
		mydoc.hideContent("#submitLoadingGIF");
	}

