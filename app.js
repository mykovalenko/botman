var builder = require('botbuilder');
var restify = require('restify');
var spellService = require('./bingspell');
var Store = require('./store');

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

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// Connect LUIS model
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

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

// Helper funtions
function hotelAsAttachment(hotel) {
    return new builder.HeroCard()
        .title(hotel.name)
        .subtitle('%d stars. %d reviews. From $%d per night.', hotel.rating, hotel.numberOfReviews, hotel.priceStarting)
        .images([new builder.CardImage().url(hotel.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value('https://www.bing.com/search?q=hotels+in+' + encodeURIComponent(hotel.location))
        ]);
}

function reviewAsAttachment(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}

// Dialogs
bot.dialog('SearchHotels', [
    function (session, args, next) {
        session.send('Welcome to the Hotels finder! We are analyzing your message: \'%s\'', session.message.text);

        // try extracting entities
        var cityEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'builtin.geography.city');
        var airportEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'AirportCode');
        if (cityEntity) {
            // city entity detected, continue to next step
            session.dialogData.searchType = 'city';
            next({ response: cityEntity.entity });
        } else if (airportEntity) {
            // airport entity detected, continue to next step
            session.dialogData.searchType = 'airport';
            next({ response: airportEntity.entity });
        } else {
            // no entities detected, ask user for a destination
            builder.Prompts.text(session, 'Please enter your destination');
        }
    },
    function (session, results) {
        var destination = results.response;

        var message = 'Looking for hotels';
        if (session.dialogData.searchType === 'airport') {
            message += ' near %s airport...';
        } else {
            message += ' in %s...';
        }

        session.send(message, destination);

        // Async search
        Store
            .searchHotels(destination)
            .then(function (hotels) {
                // args
                session.send('I found %d hotels:', hotels.length);

                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(hotels.map(hotelAsAttachment));

                session.send(message);

                // End
                session.endDialog();
            });
    }
]).triggerAction({
    matches: 'SearchHotels',
    onInterrupted: function (session) {
        session.send('Please provide a destination');
    }
});

bot.dialog('ShowHotelsReviews', function (session, args) {
    // retrieve hotel name from matched entities
    var hotelEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'Hotel');
    if (hotelEntity) {
        session.send('Looking for reviews of \'%s\'...', hotelEntity.entity);
        Store.searchHotelReviews(hotelEntity.entity)
            .then(function (reviews) {
                var message = new builder.Message()
                    .attachmentLayout(builder.AttachmentLayout.carousel)
                    .attachments(reviews.map(reviewAsAttachment));
                session.endDialog(message);
            });
    }
}).triggerAction({
    matches: 'ShowHotelsReviews'
});

bot.dialog('GetHelp', function (session) {
    session.endDialog('Hi! Try asking me things like \'search hotels in Seattle\', \'search hotels near LAX airport\' or \'show me the reviews of The Bot Resort\'');
}).triggerAction({
    matches: 'Help'
});

