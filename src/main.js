
/************************ GLOBAL VARIABLES ****************************************/

var ADVENTURES = {};
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"


/*********************** GETTING STARTED *****************************/

// Once doc is ready
mydoc.ready(function(){

	MyTrello.SetBoardName("videos");

	getAdventures();

});

/********************* LISTENERS *************************************/

// Prevent the page accidentally closing
function onClosePage(event)
{
	event.preventDefault();
	event.returnValue='';
}

// Adds a listener for keystrokes (on keyup);
function listenerOnKeyUp(){
	document.addEventListener("keyup", function(event){
		switch(event.code)
		{
			case "Enter":
				if(!GAME_STARTED && !CHECKING_FOR_BINGO)
				{
					onStartGame();
				}
				else if (GAME_STARTED && !CHECKING_FOR_BINGO)
				{
					onPickNumber();
				}
				else if (CHECKING_FOR_BINGO)
				{
					onCheckCardForBingo();
				}
				break;
			default:
				return;
		}
	});
}

// Select random adventure
function onSelectRandomAdventure()
{
	let randIndex = Math.floor(Math.random()*4);
	let adventures = Object.keys(ADVENTURES);
	let adventureID = adventures[randIndex];
	let adventureLink = document.querySelector(`.adventure_block[data-adventure-id='${adventureID}'] a`);

	if(adventureLink != undefined)
	{
		adventureLink.click();
	}
}

/********************** LOAD CONTENT *******************************/

// Get list of adventures
function getAdventures()
{
	MyTrello.get_cards_by_list_name("Adventures",(data)=>{

		let resp = JSON.parse(data.responseText);
		if(resp.length > 0)
		{
			console.log("loading adventures");
			loadAdventures(resp);
		}
	});
}

function loadAdventures(adventureList)
{
	var adventureHTML = "";
		
	adventureList.forEach(element => {

		let id = element["id"];
		let name = element["name"];
		let desc = element["desc"];
		let isProtected = element["idLabels"].includes(SECURE_LABEL_ID);

		let date = element["start"];
		let monthYear = getMonthYear(new Date(date));

		var obj = {"id":id, "name":name, "desc":desc, "monthYear":monthYear, "protected":isProtected}
		ADVENTURES[id] = obj;
		
		// Get the description + more details
		let firstParagraph = desc.split("\n")[0];
		let moreDetails = desc.replaceAll("\n", "<br/>");

		// Set lock icon & external link icon
		let lockIcon = isProtected ? `&nbsp;<i class="fa fa-lock pointer protectedIcon" title="This adventure requires a passcode" aria-hidden="true"></i>` : "";
		let linkIcon = `<i class="fa fa-external-link openLinkIcon" aria-hidden="true"></i>`;

		adventureHTML += `<div class="centered adventure_block" data-adventure-id="${id}">
							<h2>
								${lockIcon} &nbsp;
								<a href="./adventure/?id=${id}">
									${name}
									&nbsp;${linkIcon} 
									<br/>
									<span class="adventureDate">(${monthYear})</span>
								</a><br/>
							</h2>
							<p id="firstParagraph_${id}">${firstParagraph}</p>
							<span id="moreDetailsLink_${id}" class="pointer additionalDetailsToggle spaced small" onclick="toggleDetails('${id}')">... more details</span>
							<p id="moreDetails_${id}" data-details-id="${id}" class="hidden pointer" onclick="toggleDetails('${id}')">${moreDetails}</p>
							<span id="lessDetailsLink_${id}" class="pointer additionalDetailsToggle spaced large hidden" onclick="toggleDetails('${id}')">... less details</span>
						</div>
						`
	});

	mydoc.loadContent(adventureHTML,"adventuresPanel");
}


function toggleDetails(id)
{
	let moreDetails = document.querySelector(`[data-details-id='${id}']`);

	if(moreDetails != undefined)
	{
		let isHidden = moreDetails.classList.contains("hidden");
		if(isHidden)
		{
			// Hide first paragraph
			mydoc.hideContent(`#firstParagraph_${id}`);
			mydoc.hideContent(`#moreDetailsLink_${id}`);

			// Show full content;
			mydoc.showContent(`#moreDetails_${id}`);
			mydoc.showContent(`#lessDetailsLink_${id}`);
		}
		else
		{
			// Show first paragraph
			mydoc.showContent(`#firstParagraph_${id}`);
			mydoc.showContent(`#moreDetailsLink_${id}`);

			// Hide full content;
			mydoc.hideContent(`#moreDetails_${id}`);
			mydoc.hideContent(`#lessDetailsLink_${id}`);
		}
	}
}

// Helper: Gets the month/year of an adventure
function getMonthYear(date)
{
	let months = [	"January", "February", "March", "April", "May", "June", 
					"July", "August", "September", "October", "November", "December"];

	let month = months[date.getMonth()];
	let year = date.getFullYear()
	return `${month}, ${year}`;

}