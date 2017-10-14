var builder = require('botbuilder');
var restify = require('restify');
var spellService = require('./spell-service');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen to messages
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

// Spell Check
if (process.env.IS_SPELL_CORRECTION_ENABLED === 'true') {
    bot.use({
        botbuilder: function (session, next) {
            spellService
                .getCorrectedText(session.message.text)
                .then(function (text) {
                    session.message.text = text;
                    next();
                })
                .catch(function (error) {
                    console.error(error);
                    next();
                });
        }
    });
}

// Root Dialog
bot.dialog('/', [
    function (session) {
        session.beginDialog('/askName');
    },
    function (session, results) {
        session.send('Hi! We are analyzing your message: \'%s\'', session.message.text);
        //session.send('Hello %s!', results.response);
    }
]);

// Branch Dialog
bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, 'Hello world! What is your name?');
    }
]); 
