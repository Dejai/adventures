// Class to store the adventure
class Adventure 
{
	constructor(cardDetails)
	{
		this.Name = cardDetails["name"] ?? "";
		this.Description = cardDetails["desc"] ?? ""; 
		this.Labels = cardDetails["labels"] ?? labels;
		this.Checklists = cardDetails["checklists"] ?? [];

		// Keep track of all videos in this adventure
		this.Videos = [];
		this.#setVideos();
		this.CurrentVideoIndex = 0;

		// This is set for every adventure & used to determine if an adventure is protected
		this.ProtectedLabelID = "6220aa911cbc61053bd65b52";

		// Used to allow a retry if videos didn't load
		this.RetryCount = 0;
	}

	// Set the video objects based on checklist
	#setVideos(){
		this.Checklists?.[0]?.checkItems?.forEach((checklist)=>{
			this.Videos.push(new Video(checklist));
		});
	}

	// Set the current video
	setCurrentVideoIndex(idx)
	{
		let index = (idx == undefined) ? this.CurrentVideoIndex : idx; 
		this.CurrentVideoIndex = (index > this.Videos.length || index < 0) ? 0 : index;
	}
	// Get the current video to be played
	getCurrentVideo(){ return this.Videos[this.CurrentVideoIndex]; }

	// Get the index of a video based on video ID
	getVideoIndex(videoID)
	{
		let index = 0;
		this.Videos.forEach( (video, idx) =>{
			if(video.VideoID == videoID)
			{
				index = idx;
			}
		});
		return index;
	}

	// Confirm if adventure is protected
	isProtected(){ return this.Labels.includes(this.ProtectedLabelID); }

	// Check if we're on the same vieo
	onSameVideo(idx){ return ( (idx ?? -1) == this.CurrentVideoIndex); }

	// Can play the current video in this adventure
	canPlayVideo()
	{
		let canPlay = true;
		if(this.isProtected())
		{
			canPlay = false;
			let video = this.getCurrentVideo() ?? {};
			let videoIDProtected = MyCookies.getCookie( (video?.VideoID ?? "") ) ?? "";
			if(videoIDProtected != "") {
				video.VideoIDProtected = videoIDProtected;
				canPlay = true;
			}
		}
		return canPlay;
	}
}

class AdventurePage
{
	constructor(){
		this.Adventure = undefined;
		this.CurrentVideo = undefined;
	}

	// Get number of adventures
	getContentCount(){
		return this.Adventure.Content.length;
	}

	// Get content by index
	getContentByIndex(idx){
		var content = undefined;
		if(this.Adventure.Content.length > idx){
			console.log("Great enough index");
			content = this.Adventure.Content[idx];
			console.log(this.Adventure.Content);
			console.log(content);
		}
		return content;
	}

	// Get content by index
	getContentByID(contentID){
		return this.Adventure.getContent(contentID);
	}

	// Set the current adventure
	setAdventure(adventure) {
		this.Adventure = adventure;
	}

	// Get a specific video
	getVideo(videoID){
		if(videoID == undefined){
			return;
		}
		console.log(videoID);
		var video = this.Adventure.getContent(videoID);
		return video;
	}
}


// Class to store the presentation of an adventure
class Adventure2
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

