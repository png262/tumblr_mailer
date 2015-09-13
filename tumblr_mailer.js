var fs = require('fs');
var ejs = require('ejs');

var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('INSERT KEY');

var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: 'INSERT KEY',
  consumer_secret: 'INSERT KEY',
  token: 'INSERT KEY',
  token_secret: 'INSERT KEY'
});

var blogArr=[];
var lastweek = new Date();
lastweek.setTime(lastweek.getTime() - 86400000*7);

client.posts('png262.tumblr.com', function(err, data){
	for(var i =0;i<data.posts.length;i++) {
		postDate = new Date(data.posts[i].date);
		if(postDate > lastweek) {
			blogArr.push( {href: data.posts[i].post_url, title: data.posts[i].title })
		}
	}

	var csvFile = fs.readFileSync("friend_list.csv","utf8");
	var emailTemplate = fs.readFileSync("email_template.html","utf8");
	var csvData = csvParse(csvFile);

	for(var i=0;i<csvData.length;i++) {
		var customizedTemplate = ejs.render(emailTemplate, {firstName: csvData[i]["firstName"], numMonthsSinceContact: csvData[i]["numMonthsSinceContact"], latestPosts: blogArr});
		sendEmail(csvData[i]["firstName"], csvData[i]["emailAddress"], "Phil", "phil@fullstackacademy.com", "testEmail" , customizedTemplate);
	}

});


function csvParse(csvFile) {
	var csvArr = [];
	//Determine number of lines in file (excluding header)
	var lines = +csvFile.match(/\n/g).length-1

	//Split CSV into array of lines
	var entireFile = csvFile.match(/(.+),(.+),(.+),(.+)\n/g);

	//Parse header, store in temp
	//var header = csvFile.match(/(.+),(.+),(.+),(.+)\n/);
	
	for(var j=0;j<lines;j++) {
		csvArr.push({});
		csvArr[j].firstName = entireFile[j+1].split(',')[0];
		csvArr[j].lastName = entireFile[j+1].split(',')[1];
		csvArr[j].numMonthsSinceContact = entireFile[j+1].split(',')[2];
		csvArr[j].emailAddress = entireFile[j+1].split(',')[3].replace("\n","");
	}
	return csvArr;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
	var message = {
	    "html": message_html,
	    "subject": subject,
	    "from_email": from_email,
	    "from_name": from_name,
	    "to": [{
	            "email": to_email,
	            "name": to_name
	        }],
	    "important": false,
	    "track_opens": true,    
	    "auto_html": false,
	    "preserve_recipients": true,
	    "merge": false,
	    "tags": [
	        "Fullstack_Tumblrmailer_Workshop"
	    ]    
	};
	var async = false;
	var ip_pool = "Main Pool";
	mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
	    	      
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	});
}
