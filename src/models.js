// Class to store the adventure
class Adventure 
{
	constructor(name, desc, labels)
	{
		this.Name = name;
		this.Description = desc; 
		this.Labels = labels;

		// Keep track of all videos in this adventure
		this.Videos = [];
		this.CurrentVideoIndex = 0;

		// This is set for every adventure & used to determine if an adventure is protected
		this.ProtectedLabelID = "6220aa911cbc61053bd65b52";
	}

	// Add a new video
	addVideo(video){ this.Videos.push(video); }

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
			let videoIDProtected = mydoc.getCookie( (video?.VideoID ?? "") ) ?? "";

			if(videoIDProtected != "")
			{
				video.VideoIDProtected = videoIDProtected;
				canPlay = true;
			}
		}
		return canPlay;
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


// Class to store the presentation of an adventure
class AdventureDisplay
{
	constructor(id,name,desc,monthYear,labels,isProtected)
	{
		this.AdventureID = id;
		this.Name = name;
		this.Description = desc;
		this.MonthYear = monthYear;
		this.IsProtected = (isProtected) ? "Yes" : "No";
		this.Labels = labels

		// Special adjustment for details
		this.FirstParagraph = this.Description.split("\n")[0];
		this.MoreDetails = this.Description.replaceAll("\n", "<br/>");
	}

	hasLabel(labelID){ return this.Labels.includes(labelID); }
}