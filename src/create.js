
/******** GETTING STARTED *****************************/

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

	// Clean values used
	function cleanValue(value)
	{
		return value.replaceAll("-", "")
				.replaceAll("(", "")
				.replaceAll(")", "");
	}

	// Validate passphrase & get the secure token
	function onCreateNewUser(event)
	{
		// Prevent default behavior;
		event.preventDefault();

		// Show spinning ; Hide button;
		mydoc.showContent("#submitLoadingGIF");
		mydoc.hideContent("#submitButton");

		// Get parts from form & key setup for URL
		var username = cleanValue(mydoc.getContent("#username")?.value ?? "");
		var nickname = cleanValue(mydoc.getContent("#nickname")?.value ?? "");
		var phoneNumber = cleanValue(mydoc.getContent("#phoneNumber")?.value ?? "");

		// Create card name
		var cardName = `${username} ~ ${nickname}`;

		console.log("Creating a user: " + cardName);

		// Load the saved user cards & validate
		MyTrello.get_list_by_name( "Requested", (listData)=>{
				
			let listResp = JSON.parse(listData.responseText);
			let listID = listResp[0]?.id;

			// Create the new card
			MyTrello.create_card(listID, cardName, (newCard)=>{
				console.log(newCard);

				let cardResp = JSON.parse(newCard.responseText);

				if(newCard.status == 200)
				{
					let requestBody = `p=${phoneNumber}`;

					MyStream.validateUser(requestBody, (streamResponse)=>{
						console.log(streamResponse);

						// Key part of responses
						let digest = streamResponse?.digest ?? "";

						// Set digest in card
						if(digest != ""){ 
							MyTrello.update_card_description(cardResp["id"], digest, (data)=>{
								onCreatUserSuccess();
							});
						}
						else
						{
							mydoc.setContent("#resultsMessage", {"innerHTML":"Couldn't set user correctly"});
						}
					});
				}
				else
				{
					mydoc.setContent("#resultsMessage", {"innerHTML":"Couldn't create user"});
				}
			});			
		});
	}


	// Successful creation of user
	function onCreatUserSuccess()
	{
		mydoc.setContent("#resultsMessage", {"innerHTML":""});
		mydoc.showContent("#successMessage");
		mydoc.showContent("#createUserSection");
		mydoc.hideContent("#protectedVideoForm");
		mydoc.hideContent("#submitLoadingGIF");
	}

