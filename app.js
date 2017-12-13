var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, 
    [
        // function (session) {
        // session.send("first test", session.message.text);    
        // }
        (session) => {
            session.beginDialog('greetings', session.userData.profile);
        },
        (session) => {
            session.beginDialog('enquiry', session.userData.enquiry);
        },
        (session, results) => {
            const profile = session.userData.profile = results.response;
            session.endConversation(`I hope I was able to answer your queries adequately. Goodbye ${profile.name}.`);
        }
        
    ]
);

bot.dialog('greetings', [
    (session, args, next) => {
        session.dialogData.profile = args || {};
        if (!session.dialogData.profile.name) {
            builder.Prompts.text(session, `Hi! Before we begin, let me get to know you a bit. What is your name?`);
        } else {
            next();
        }
    },
    (session, results, next) => {
        if(results.response) {
            if((results.response).match(/\Wis\W/)){
                results.response = ((results.response).slice((results.response).indexOf('is')+2)).trim();
            }
            session.dialogData.profile.name = results.response;
        }
        if(!session.dialogData.profile.location) {
            builder.Prompts.text(session, `Oh hello ${results.response}. What area are you chatting from?`)
        } else {
            next();
        }
    },
    (session, results, next) => {
        if(results.response) {
            session.dialogData.profile.location = results.response;
            if((results.response).toLowerCase().match(/\Wfrom\W/)){
                results.response = ((results.response).slice((results.response).indexOf('from')+4)).trim();
                 }
            else if ((results.response).toLowerCase().match(/\Wis\W/)){
                results.response = ((results.response).slice((results.response).indexOf('is')+2)).trim();
            }
            session.dialogData.profile.location = results.response;
        }
        if(!session.dialogData.profile.issue) {
            builder.Prompts.text(session, `Ahhh ${results.response}. Anyway, I assume we are chatting because you want to know about vaids?`)
        }
        
     },
     (session, results) => {
        session.endDialogWithResult({ response: session.dialogData.profile});
     }
]);

bot.dialog('enquiry', [
    (session, args, next) => {
        session.dialogData.enquiry = args || {};
        if (!session.dialogData.enquiry.enquiry) {
            builder.Prompts.choice(session, "Please select the closest option", "Why Vaids|Vaids Essentials|Vaids Participation", { listStyle: 3});
        } else {
            next();
        }
    },
    (session, results) => {
        session.endDialogWithResult({ response: session.dialogData.enquiry});
     }
]);