
/************************ GLOBAL VARIABLES ****************************************/
const MyCloudFlare = new CloudflareWrapper();
const MyEventPage = new EventPage();

const touchEvent = "ontouchstart" in window ? "touchstart" : "click";
const spinner = `<i class="fa-solid fa-spinner dtk-spinning dtk-spinning-1000"></i>`

/*********************** GETTING STARTED *****************************/
// Once doc is ready
MyDom.ready( async () => {
	
	var loginDetails = await MyAuth.onGetLoginDetails();
	loginDetails["ShowHome"] = true;
	await loadDropdownMenu(loginDetails);

	// Get params from URL;
	let eventID = MyUrls.getSearchParam("id");
	try {
		if(eventID == undefined){
			throw new Error("Could not find requested event");
		}
		// Get event details
		var eventDetails = await MyCloudFlare.Files("GET", `/event/?key=${eventID}`);
		var event = new Event(eventDetails);
		MyEventPage.setEvent(event);

		// Set event name
		var useFN = MyUrls.getSearchParam("fn") ?? "0";
		var eventName = (useFN == "1") ? event.Name.replace("Dejai", "Derrick") : event.Name;
		MyDom.setContent("#eventName", {"innerHTML":eventName});
		MyDom.addClass("#eventName", "dtk-fade-in");

		// Get event content
		var template = await MyCloudFlare.Files("GET", `/template/?key=${event.Template}`, { responseType: "text" });
		MyDom.setContent("#mainContent", {"innerHTML": template});

		// Show hide subcontent
		var _action = (loginDetails.IsLoggedIn) ? MyDom.showContent(".showIfLoggedIn") : MyDom.showContent(".showIfNotLoggedIn");

		// Get response (if exists)
		var response = await MyCloudFlare.Files("GET", `/event/user/response/?key=${event.EventKey}`);
		onSetPreviousResponse(response);

	} catch(err){
		MyLogger.LogError(err);
		MyDom.setContent("#mainContent", {"innerHTML": "Could not load requested content." });
	}
});

// If user has responded to this event already, show them their previous response
function onSetPreviousResponse(responseObj){
	if( !(responseObj?.isError ?? false) ){
		for(var key of Object.keys(responseObj)){
			if(key == "comments") {
				MyDom.setContent(".eventForm .commentBox", {"innerHTML": responseObj.comments, "innerText": responseObj.comments });
			} else {
				var buttons = Array.from(document.querySelectorAll(`[data-form-id='${key}'] .responseButtonGroup button`));
				var response = responseObj[key];
				var buttonMatch = buttons.filter(x => x.innerText == response)?.[0];
				if(buttonMatch != undefined){
					buttonMatch.click();
				}
			}
		}
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
		var event = MyEventPage.Event;
		var forms = Array.from(document.querySelectorAll(".eventForm"));

		// Setup the responses in an object
		var responseObj = {}
		responseObj["comments"] = MyDom.getContent(".commentBox")?.value ?? "";
		for(var form of forms)
		{
			var formID = form.getAttribute("data-form-id");
			var buttonText = form.querySelector(".responseButton.selected")?.innerText?.replaceAll("\n", "")?.trim() ?? "";
			responseObj[formID] = buttonText;
		}
		// Show saving info & save to cloudflare
		MyDom.setContent("#mainContent", {"innerHTML": `<h2>Saving ${spinner} </h2>` });
		var createResp = await MyCloudFlare.Files("POST", `/event/response/?key=${event.EventKey}`, { body: JSON.stringify(responseObj)});
		if( (createResp?.isError ?? false)) {
			throw new Error(createResp?.message ?? "Something went wrong");
		}
		var submittedHtml = await MyTemplates.getTemplateAsync("src/templates/events/submitted.html", {});
		MyDom.setContent("#mainContent", {"innerHTML": submittedHtml });

	} catch(err){
		MyLogger.LogError(err);
		var errorHtml = await MyTemplates.getTemplateAsync("src/templates/events/error.html", {});
		MyDom.setContent("#mainContent", {"innerHTML": errorHtml });
	}
}

// Toggle subsection visibility
async function onToggleSubsection(sectionItem) {
	var section = sectionItem.closest(".eventInfoSection");
	var subsection = section.querySelector(".eventInfoSubsection");
	var isCollapsed = subsection.classList.contains("collapsed");
	MyDom.replaceClass(".eventInfoSubsection", "open", "collapsed");  // make sure all other ones are collapsed
	MyDom.replaceClass(".eventInfoSection .subsectionIcon", "fa-circle-chevron-down", "fa-circle-chevron-right");  // make sure all other ones are closed
	if(isCollapsed){
		MyDom.replaceClass(".eventInfoSection .subsectionIcon", "fa-circle-chevron-right", "fa-circle-chevron-down", section); 
		MyDom.replaceClass(".eventInfoSubsection", "collapsed", "open", section);
	}
}