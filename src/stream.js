/*
    Purpose: A constant object for managing all things relaed to the stream 

    NOTE: This depends on the common.js file being loaded first
*/

const MyStream = {

    // Common attribtues
    baseURL: "https://stream-security.the-dancinglion.workers.dev",

    stream: undefined, 
    
    // Set stream element
    setStreamElement: (htmlElement)=>{
        this.stream = Stream(htmlElement);
    },

    onVideoEnded: (callback)=>{
        this.stream.addEventListener("ended", callback);
    },

    onVideoError: (callback)=>{
        this.stream.addEventListener("error", callback);
    },

    // Get a stream object
    getStreamElement: ()=>{
		var player = Stream(document.getElementById('videoIFrame'));
		return player;
	},
    
    // Get the signed URL for a video
    getSignedURL: (videoID, requestBody, callback)=>{

        let streamPath = `${MyStream.baseURL}/video/${videoID}`;
    	var requestHeader = {"Content-Type":"application/x-www-form-urlencoded"};

        // Make the call to get the signed URL
        myajax.POST(streamPath, requestBody, requestHeader, (resp)=>{

            let responseText = (resp.responseText != "") ? resp.responseText : "[{'state':'No response'}]";
            let respData = myajax.GetJSON(responseText);

            callback(respData);

        }, (err)=> { Logger.log(err); });
    },

    // Validate a user for access to protected videos
    validateUser: (requestBody, callback)=> {

        let streamPath = MyStream.baseURL+"/auth";
    	var requestHeader = {"Content-Type":"application/x-www-form-urlencoded"};

        // Make the post call
        myajax.POST(streamPath, requestBody, requestHeader,  (data)=>{

                // Get response
                let response = JSON.parse(data.responseText) ?? {};
                
                // Use the callback;
                callback(response);
            
        }, (err)=>{ Logger.log(err) });
    }

}

