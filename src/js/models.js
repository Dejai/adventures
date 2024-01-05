// Class to store the presentation of an adventure
class Adventure {

	constructor(jsonDetails){
		this.AccessGroup = jsonDetails?.accessGroup ?? "";
		this.AdventureID = jsonDetails?.adventureID ?? "";
		this.Date = new Date(jsonDetails?.date) ?? "";
		this.Name = jsonDetails?.name ?? "";
		this.Status = jsonDetails?.status ?? "";
		// this.Thumbnail = jsonDetails?.thumbnail ?? `https://thumbnails.dejaithekid.com/adventures_${AdventureID}.jpg`;
		this.Thumbnail = `https://thumbnails.dejaithekid.com/adventures_${this.AdventureID}.jpg`;
		this.Description = jsonDetails?.description ?? "";

		// Calculated fields
		this.MonthYear = this.getMonthYear();
		this.Content = [];
		this.CurrentContentIdx = 0;
		this.FirstParagraph = this.Description.split("\n")[0];
		this.MoreDetails = this.Description.replaceAll("\n", "<br/>");
	}

	// Add content to this adventure
	addContent(contentList){
		var idx = 0;
		contentList.forEach( (c) =>{
			idx++;
			c.ContentIndex = idx;
			this.Content.push(c);
		});
	}

	// Get a video by video ID
	getContent(filterType, filter){
		var content = undefined;
		if(filterType == undefined){
			return content;
		}
		// Get content based on filter type
		switch(filterType){
			case "contentID":
				content = this.Content.filter(x => (x.ContentID == filter))?.[0];
				break;
			case "index":
				content = (this.Content.length > filter) ? this.Content[filter] : undefined; 
				break;
			default:
				MyLogger.LogInfo("Can't get content by type: " + filterType);
		}
		this.setCurrentContentIndex(content);
		return content;
	}

	// Set the current content index (for next/prev actions)
	setCurrentContentIndex(content){
		if(content == undefined) { return; }
		var idx = this.Content?.findIndex( x => x.ContentID == content.ContentID );
		this.CurrentContentIdx = (idx >= 0) ? idx : 0;
	}

	// Get the next content based on index
	getNextContent(){
		if( (this.CurrentContentIdx+1) < this.Content.length){
			return this.Content[this.CurrentContentIdx+1];
		}
		return undefined;
	}

	// Get the date in a month/year format
	getMonthYear()
	{
		let months = [	"January", "February", "March", "April", "May", "June", 
						"July", "August", "September", "October", "November", "December"];

		let month = months[this.Date.getMonth()];
		let year = this.Date.getFullYear()
		return `${month}, ${year}`;
	}
}

// Class to store the adventures home page
class AdventureHomePage
{
	constructor () {
		this.Adventures = [];
	}

	// Add adventure
	addAdventures(adventures){
		adventures?.forEach( (adv) => {
			if(adv instanceof Adventure){
				this.Adventures.push(adv);
			}
		});
	}

	// Search content based on name & description
	searchContent(filter) {
		var filterUpper = filter.toUpperCase();
		var matchingContentIds = this.Adventures.filter(x => x.Name.toUpperCase().includes(filterUpper) || x.Description.toUpperCase().includes(filterUpper) ).map(y => y.AdventureID);
		return matchingContentIds;
	}

}

// Class to store the adventure page controls
class AdventurePage
{
	constructor(){
		this.Adventure = undefined;

		// Determine the content currently being displayed
		this.CurrentContent = undefined;

		// Manage the view of the page
		this.ViewStates = ["default"]

		// Keep track of scroll location
		this.Scroll = { "X": 0, "Y": 0}
		
	}

	// Set the current adventure
	setAdventure(adventure) {
		this.Adventure = adventure;
	}

	// Set the current content
	setCurrentContent(content){
		if(content == undefined){ return; }
		this.CurrentContent = content;
	}

	// Set the view states
	setViewState(state){
		var currentState = this.ViewStates[this.ViewStates.length-1];
		if( currentState != state ) {
			this.ViewStates.push(state);
		}
	}

	// Go back to the last view state
	getLastViewState(){
		// Pop off the current state first
		this.ViewStates.pop();
		var lastState = this.ViewStates[this.ViewStates.length-1] ?? "default";
		if(lastState == "default" && this.Adventure.Content.length == 1) {
			return "home";
		} else {
			this.setViewState(lastState);
			return lastState;
		}
	}

	// Peek at current view state
	currentViewState(){
		return this.ViewStates[this.ViewStates.length-1] ?? "default";
	}

	// Get number of adventures
	getContentCount(){
		return this.Adventure.Content.length;
	}

	getContentByIndex(idx){
		var content = this.Adventure.getContent("index", idx);
		this.setCurrentContent(content);
		return content;
	}

	// Get content by index
	getContentByID(contentID){
		var content = this.Adventure.getContent("contentID", contentID);
		this.setCurrentContent(content);
		return content;
	}

	// Has a "next" content to view
	hasNextContent(){
		var length = this.getContentCount(); 
		var idx = this.Adventure?.CurrentContentIdx ?? 0;
		return (length > 1 && idx < length-1);
	}

	// Has a "prev" content to view
	hasPrevContent(){
		var length = this.getContentCount(); 
		var idx = this.Adventure?.CurrentContentIdx ?? 0;
		return (length > 1 && idx > 0);
	}

	// Set the scroll values
	setScroll(x, y) {
		this.Scroll.X = x;
		this.Scroll.Y = y;
	}
}

// Class to manage the event page
class EventPage
{
	constructor(){
		this.Event = undefined;
	}

	setEvent(event){
		this.Event = event;
	}
}

// Class to map to a single Event
class Event { 
	constructor(jsonDetails){
		this.Name = jsonDetails?.name ?? "";
		this.EventKey = jsonDetails?.eventKey ?? "";
		this.EventID = jsonDetails?.eventID ?? "";
		this.Template = jsonDetails?.template ?? "";
	}
}

// Class to store the video details
class StreamVideo
{
	constructor(videoObj) {
		this.AdventureID = videoObj?.adventureID ?? "";
		this.ContentID = videoObj?.uid ?? "";
		this.Creator = videoObj?.creator ?? "";
		this.ShowCreator = videoObj?.showCreator ?? "No";
		this.Name = videoObj?.name ?? "";
		this.Description = videoObj?.description ?? "";
		this.Duration = videoObj?.duration ?? 0;
		this.Date = new Date(videoObj?.date);
		this.Order = Number(videoObj?.order ?? "1");
		this.Ready = videoObj?.readyToStream ?? false;
		this.Signed = videoObj?.requireSignedURLs ?? false;
		this.Urls = videoObj?.urls ?? {}
		this.RAW = videoObj;
	}
}

// Maps to a user who is logged in (or not)
class UserDetails {
	constructor(jsonObj, hasDetails=false){
		
		this.IsLoggedIn = (jsonObj?.IsLoggedIn) ?? false;
		this.UserKey = jsonObj?.UserKey ?? "";

		this.FirstName = jsonObj?.FirstName ?? "";
		this.UserText = (this.FirstName != "") ? `Hi, ${this.FirstName}` : "Hi, Guest";

		this.AuthText = (this.IsLoggedIn) ? "Log out" : "Log in";
		this.AuthAction = (this.IsLoggedIn) ? "logout" : "login";

		// Showing the home row
		this.ShowHome = jsonObj?.ShowHome ?? false;

		// Showing the details row
		this.ShowDetails = (jsonObj?.ShowDetails ?? false) && this.IsLoggedIn;
	}
}