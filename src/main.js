
/************************ GLOBAL VARIABLES ****************************************/

var ADVENTURES = {};
var SECURE_LABEL_ID = "6220aa911cbc61053bd65b54"

// Template content
var FILTER_TEMPLATE = `<span class="filterOption" data-label-id="{{labelID}}" onclick="onFilterByLabel(event)">{{filterName}}</span>`;

// Labels for filters
var LABEL_GROUP = {}

/*********************** GETTING STARTED *****************************/

// Once doc is ready
mydoc.ready(function(){

	MyTrello.SetBoardName("videos");

	loadLabels();

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

// Filter the functions based on label
function onFilterByLabel(event)
{
	let target = event.target;
	let labelID = target.getAttribute("data-label-id") ?? ""

	if(labelID != "")
	{
		let addFilter = !target.classList.contains("filterOptionSelected");
		if(addFilter)
		{
			// Remove from all other instances
			document.querySelectorAll(".filterOptionSelected")?.forEach( ele =>{
				ele.classList.remove("filterOptionSelected");
			});
			target.classList.add("filterOptionSelected");

			let adventuresToShow = LABEL_GROUP[labelID]?.adventures ?? [];
			onFilterAdventures(adventuresToShow);
		}
		else
		{
			target.classList.remove("filterOptionSelected");
			onFilterAdventures(); 

		}
	}
}

// Filter based on a given set of adventures
function onFilterAdventures(adventures = [])
{

	var adventureBlocks = document.querySelectorAll(".adventure_block");

	// If any filters applied, then show only those adventures;
	if(adventures.length > 0)
	{
		adventureBlocks.forEach( adv =>{
			
			let id = adv.getAttribute("data-adventure-id") ?? "";
			if(adventures.includes(id))
			{
				adv.classList.remove("hidden");
			}
			else
			{
				adv.classList.add("hidden");
			}
		});
	}
	else
	{
		adventureBlocks.forEach( adv =>{
			adv.classList.remove("hidden");
		});
	}
}

/********************** LOAD CONTENT *******************************/

// Get list of adventures
function getAdventures()
{
	MyTrello.get_cards_by_list_name("Adventures",(data)=>{

		let resp = JSON.parse(data.responseText);
		console.log(resp);
		if(resp.length > 0)
		{
			loadAdventures(resp);
		}
	});
}

// Load the adventures
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
						`;

		addToLabelGroup(element);
		
	});

	mydoc.loadContent(adventureHTML,"adventuresPanel");

	// Once loaded, show the filter section
	mydoc.showContent("#findAdventureSection");

}

// Load the labels to be used for filtering
function loadLabels()
{
	MyTrello.get_labels( data =>{

		var resp = myajax.GetJSON(data.responseText);
		if(resp != undefined)
		{

			var labelSet = "";
			resp = resp.sort(function(a,b){
				return a.name.localeCompare(b.name)
			});
	
			resp.forEach( label =>{

				var labelName = label.name ?? "";
				var labelColor = label.color;
				var labelID = label.id; 

				if(labelName != "" && labelID != SECURE_LABEL_ID)
				{
					// Setup labels & filters
					labelSet += FILTER_TEMPLATE.replaceAll("{{filterName}}", labelName).replaceAll("{{labelID}}",labelID);
				}
			});
			// Add the labels
			mydoc.loadContent(labelSet,"filterSection");
		}
	})
}

/********************** HELPERS *******************************/


// Add an adventure to a group based on its label(s)
function addToLabelGroup(adventure)
{
	let labelList = adventure["idLabels"];
	let adventureID = adventure["id"]; 

	labelList.forEach( label =>{

		// If group doesn't already have label;
		if( !LABEL_GROUP.hasOwnProperty(label))
		{
			LABEL_GROUP[label] = {"filter":false, "adventures":[] };
		}

		// Add the adenture to this label's group
		LABEL_GROUP[label]["adventures"].push(adventureID);
	});
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

