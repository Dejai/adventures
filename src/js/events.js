
/************************ GLOBAL VARIABLES ****************************************/
const MyTrello = new TrelloWrapper("events");
const MyEventPage = new EventPage();

const touchEvent = "ontouchstart" in window ? "touchstart" : "click";

/*********************** GETTING STARTED *****************************/
	// Once doc is ready
	MyDom.ready( async () => {
		
		var loginDetails = await MyAuth.onGetLoginDetails();
		loginDetails["ShowHome"] = true;
		await loadDropdownMenu(loginDetails);

		// Get params from URL;
		let eventID = MyUrls.getSearchParam("id");
		if(eventID != undefined){

			// Get all the event details
			await onGetEventDetails(eventID);

			// Mark any previous responses
			// onSetPreviousResponse();

			// Show the first form
			var firstForm = document.querySelector(".eventFormFade");
			if(firstForm != undefined){
				firstForm.classList.add("active");
			}

			// Hide the spinning loader
			MyDom.hideContent(".hideOnFormLoad");

		} else {
			onGetEventList();
		}
	});

/********* SETUP: Create the key things used throughout the file *************************************/

	// Get the details of an event
	async function onGetEventDetails(eventListID){
		try {
			// Get the cards of the event
			var eventsJson = await MyTrello.GetCards(eventListID);

			// Save in page manager
			MyEventPage.TrelloCards = eventsJson?.map(x => new TrelloCard(x));

			var numSections = 0;
			// Get the form cards
			var formCards = MyEventPage.TrelloCards;
			var isOverview = true;
			for(var card of formCards)
			{
				var cardName = card?.Name ?? "";
				var templateName = (isOverview) ? "Overview" : encodeURIComponent(cardName);
				var templateRequestUrl = `https://templates.dejaithekid.com/event/?key=${templateName}`
				var template = await MyFetch.call("GET", templateRequestUrl , { responseType: "text"});
				if(isOverview){
					MyDom.setContent("#eventName", {"innerHTML":cardName});
					MyDom.setContent("#eventOverviewSection", {"innerHTML": template});
					MyDom.showContent("#eventOverviewSection");
					isOverview = false;
				} else {
					MyDom.setContent("#eventContentSection", {"innerHTML": template}, true);
				}
				numSections += 1;
				// Get comments on this card & filter by current user
				// var comments = await MyTrello.GetComments(card.CardID);
				// card.Comments = comments.map(comment => new TrelloComment(comment));
			}

			// If only overview was added, then count would only be 1; And if so, show no content
			if(numSections <= 1){
				var isLoggedIn = MyCookies.getCookie( MyCookies.getCookieName("UserKey") ) != "";
				var title = (!isLoggedIn) ? "Login Required" : `<i class="fa-regular fa-face-frown"></i>Sorry, couldn't load this content. Try again later.`;
				var evHtml = await MyTemplates.getTemplateAsync("src/templates/events/noContent.html", { "Title": title, "IsLoggedIn": isLoggedIn });
				MyDom.setContent("#eventContentSection", {"innerHTML": evHtml});	
			}
		} catch (error){
			MyLogger.LogError(error);
			var errMessage = `<i class="fa-regular fa-face-frown"></i> <span>Sorry, couldn't load the content.</span><p>${error.message}</p>`;
			MyDom.setContent("#eventContentSection", {"innerHTML": errMessage});	
		}
	}

	// Get this adventure card & its list of videos
	async function onGetEventList()
	{
		try {
			// Get list of events
			var eventsJson = await MyTrello.GetLists("open");
			var events = eventsJson?.map(x => new TrelloCard(x));
			var eventsListHtml = await MyTemplates.getTemplateAsync("src/templates/events/eventList.html", events);
			MyDom.setContent("#eventOverviewSection", {"innerHTML": eventsListHtml });
			MyDom.setContent("#eventName", {"innerHTML": "Dejai's Events"});
			MyDom.hideContent(".hideOnLoaded");
			MyDom.hideContent(".hideOnListView");
			MyDom.showContent(".showOnLoaded");
		} catch (error){
			MyLogger.LogError(error);
		}
	}

	// After loading form, set the previous responses
	function onSetPreviousResponse(){

		// Get form sections
		var formSections = document.querySelectorAll(".eventForm");
		var userKey = MyCookies.getCookie( MyCookies.getCookieName("UserKey") ) ?? "";
		var prevs = 0;
		for(var form of formSections)
		{
			var cardID = form.getAttribute("data-form-id");
			var buttons = Array.from(form.querySelectorAll(".responseButton")) ?? [];
			var commentBox = form.querySelector(".commentBox");

			// Comments on card
			var cardComments  = MyEventPage.TrelloCards.filter(x => x.CardID == cardID)?.[0]?.Comments;
			var userComment = cardComments?.filter(comment => comment.Text.startsWith(userKey))?.[0] ?? undefined;
			if(userComment != undefined)
			{
				var justComment = userComment.Text.split(" ~ ").map(x => x.trim())?.[1] ?? "";
				// Matching button
				var matchingButton = buttons.filter(x => x.innerText == justComment)?.[0] ?? undefined;
				if(matchingButton != undefined){
					form.setAttribute("data-prev-response", userComment.CommentID);
					prevs += 1;
					matchingButton.click();
				}

				// Comment box
				if(commentBox != undefined){
					form.setAttribute("data-prev-response", userComment.CommentID);
					commentBox.value = justComment;
					commentBox.innerText = justComment;
				}
			}
		}
		// If there is at least one previous answer, then update the submit button
		if(prevs > 0){
			MyDom.setContent("#formsSubmitButton", {"innerText": "UPDATE"});
		}
	}

	// Selecting response option
	function onSelectResponseOption(button){
		var groupID = button.getAttribute("data-response-group");
		// Clear selected from all buttons
		MyDom.removeClass(`[data-response-group="${groupID}"]`, "selected");
		button.classList.add("selected");
	}

	// Navigate to previous or next form
	function onNavigateForms (button, direction="next"){
		var form = button.closest(".eventForm");
		var sibling = (direction == "prev") ? form.previousElementSibling : form.nextElementSibling;
		if(sibling != undefined && sibling.classList.contains("eventForm")){
			form.classList.remove("active");
			sibling.classList.add("active");
		}
	}

	// Submit response
	async function onSubmitResponses(){

		try{
			MyDom.hideContent(".hideOnSubmitting");
			MyDom.showContent(".showOnSubmitting");

			var forms = Array.from(document.querySelectorAll(".eventForm"));
			var userKey = MyCookies.getCookie( MyCookies.getCookieName("UserKey") ) ?? "";

			for(var form of forms)
			{
				var cardID = form.getAttribute("data-form-id");
				// var prevID = form.getAttribute("data-prev-response") ?? "";
				// if(prevID != ""){
				// 	await MyTrello.DeleteCardComment(cardID, prevID);
				// }

				var buttonText = form.querySelector(".responseButton.selected")?.innerText?.replaceAll("\n", "")?.trim();
				var commentText = form.querySelector(".commentBox")?.value;
				var response = buttonText ?? commentText ?? "";
				if(cardID != undefined && response != "")
				{
					comment = `${userKey} ~ ${response}`;
					MyLogger.LogInfo(`Creating comment on ${cardID} : ${comment}`);
					await MyTrello.CreateCardComment(cardID, comment);
				}
			}

			// Create a submitted card
			var responseList = await MyTrello.GetListByName("Responses");
			var listID = responseList?.id ?? "";
			if(listID != ""){
				var submittedBy = "Response submitted by: " + userKey;
				MyLogger.LogInfo("Creating response card: " + submittedBy);
				await MyTrello.CreateCard(listID, submittedBy);
			}

			var submittedHtml = await MyTemplates.getTemplateAsync("src/templates/events/submitted.html", {});
			MyDom.setContent("#eventContentSection", {"innerHTML": submittedHtml });
			
		} catch(err){
			MyLogger.LogError(err);
			var errorHtml = await MyTemplates.getTemplateAsync("src/templates/events/error.html", {});
			MyDom.setContent("#eventContentSection", {"innerHTML": errorHtml });
		} finally {
			MyDom.hideContent(".hideOnSubmitted");
			MyDom.showContent(".showOnSubmitted");
		}
	}