var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create bot connector and listen to messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

// Log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

// Root Dialog
bot.dialog('/', [
    function (session) {
        //Trigger /askName dialog
        session.beginDialog('/askName');
    },
    function (session, results) {
        //Return hello + user's input (name)
        session.send('Hello %s!', results.response);
    }
]);

// Branch Dialog
bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, 'Hello world! What is your name?');
    }
]); 
