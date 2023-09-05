// Class to store the adventure page controls
class AdventurePage
{
	constructor(){
		this.Adventure = undefined;
		this.CurrentVideo = undefined;
		this.CurrentViewState = "default";

		// List of view states that the page is showing
		this.ViewStates = ["default"]
	}

	// Set the current adventure
	setAdventure(adventure) {
		this.Adventure = adventure;
	}

	// Set the index of the content that is loaded
	setContentIdx(contentID){
		var idx = this.Adventure?.Content?.findIndex( x => x.ContentID == contentID );
		this.Adventure.CurrentContentIdx = (idx >= 1) ? (idx--) : 0;
	}

	// Set the view states
	setViewState(state){
		var currentState = this.ViewStates[this.ViewStates.length-1];
		if( currentState != state ) {
			this.ViewStates.push(state);
		}
		console.log(this.ViewStates);
	}

	// Get the last view
	getLastViewState(){
		var currentState = this.ViewStates.pop();
		console.log("Popped current state: " + currentState);
		if(this.ViewStates.length == 0){
			this.ViewStates.push("default"); // always make sure default is first in list
		}
		var lastState = this.ViewStates[this.ViewStates.length-1];
		return lastState;
	}

	// Get number of adventures
	getContentCount(){
		return this.Adventure.Content.length;
	}

	// Get content by index
	getContentByIndex(idx){
		var content = undefined;
		if(idx < this.Adventure.Content.length){
			console.log("Getting the next content: " + idx);
			content = this.Adventure.Content[idx];
		}
		return content;
	}

	// Get content by index
	getContentByID(contentID){
		return this.Adventure.getContent(contentID);
	}

	// Has a "next" content to view
	hasNextContent(){
		var length = this.Adventure?.Content?.length;
		var idx = this.Adventure?.CurrentContentIdx ?? 0;
		return (length > 1 && idx < length-1);
	}

	// Has a "prev" content to view
	hasPrevContent(){
		var length = this.Adventure?.Content?.length;
		var idx = this.Adventure?.CurrentContentIdx ?? 0;
		return (length > 1 && idx > 0);
	}
}


// Class to store the presentation of an adventure
class Adventure
{
	//Build new adventure display
	constructor(cardDetails){
		this.AdventureID = cardDetails["id"] ?? "";
		this.Name = cardDetails["name"] ?? "";
		this.Description = cardDetails["desc"] ?? "";
		// this.IsProtected = cardDetails["idLabels"]?.includes(SECURE_LABEL_ID) ?? "";
		this.Date = new Date(cardDetails["start"]) ?? "";
		this.Labels = cardDetails["idLabels"] ?? "";
		this.MonthYear = this.getMonthYear();

		// The content of this adventure
		this.CoverThumbnail = "";
		this.Content = [];
		this.CurrentContentIdx = 0;

		// Special adjustment for details
		this.FirstParagraph = this.Description.split("\n")[0];
		this.MoreDetails = this.Description.replaceAll("\n", "<br/>");
	}

	// Add content for this adventure
	addContent(content){
		this.Content.push(content);
	}

	// Get a video by video ID
	getContent(contentID) {
		if(contentID == undefined){ return; }
		var content = this.Content.filter(x => (x.ContentID == contentID))?.[0];
		return content;
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

	hasLabel(labelID){ return this.Labels.includes(labelID); }
}

// Class to store the video details
class StreamVideo
{
	constructor(videoObj) {
		this.AdventureID = videoObj?.adventureID ?? "";
		this.ContentID = videoObj?.uid ?? "";
		this.VideoID = videoObj?.uid ?? "";
		this.Name = videoObj?.name ?? "";
		this.Description = videoObj?.description ?? "";
		this.Duration = videoObj?.duration ?? 0;
		this.Order = videoObj?.order ?? 0;
		this.Ready = videoObj?.readyToStream ?? false;
		this.Signed = videoObj?.requireSignedURLs ?? false;
		this.URL = videoObj?.videoUrl ?? "";
		this.Thumbnail = videoObj?.thumbnail ?? "";
	}
}

// Class to store the video details
class Video 
{
	constructor(videoDetails)
	{
		let parts = videoDetails["name"].split(" ~ ");
		let videoURL = new URL(parts[1]) ?? "";
		let videoID = videoURL.pathname.substring(1).split("/")[0];

		this.Name = parts[0] ?? "";
		this.Link = parts[1] ?? "";
		this.VideoID = videoID ?? "";
		this.VideoIDProtected = undefined;
		this.Description = parts[2] ?? "";
		this.Author = parts[3] ?? "";
	}

	// Get Video ID
	getVideoID(){ return (this.VideoIDProtected ?? this.VideoID)}

	// Set protected ID
	setProtectedID(id){ this.VideoIDProtected = id; }
}

