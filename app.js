

var restify = require('restify');
//var builder = require('../../core/');
var builder = require('botbuilder');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('I have %s listening to port %s', server.name, server.url); 
});
  
var inMemoryStorage = new builder.MemoryBotStorage();

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage); // Register in memory storage;
server.post('/api/messages', connector.listen());


bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Oh hello %s... Thanks for adding me.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'I hope I was able to answer your queries adequately. Goodbye', { matches: /^goodbye|bye|good bye/i});
bot.beginDialogAction('help', '/help', { matches: /^help|help me|i need help/i });

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        var card = new builder.HeroCard(session)
            .title("The VAIDS Bot")
            .text("There to help, whenever")
            .images([
                 builder.CardImage.create(session, "http://oi66.tinypic.com/2z52dc3.jpg")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Hi... I am the VAIDS bot for skype. I will answer your queries");
        session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        session.send("Ok... See you later!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        //prompts|picture|cards|list|carousel|receipt|actions|(quit)
        builder.Prompts.choice(session, "What general topic would you like to know about?", "Why Vaids?|Vaids Essentials|Vaids Participation|(quit)", { listStyle: 3});
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("If you type:\n\n* 'menu' - You will be given the main menu.\n* 'goodbye' - You will end this conversation.\n* 'help' - These commands will be displayed.");
    }
]);

bot.dialog('/Why Vaids?', [
    function (session) {
        builder.Prompts.choice(session, "Please select the closest option", "What is the Voluntary Asset & Income Declaration Scheme?|Why is the FG offering this scheme?|Why is the FG implementing VAIDS now?|Why aren't tax evaders persecuted?", { listStyle: 3});
        //session.endDialog();
    },
    function (session, results) {
        if(results.response && results.response.entity =='What is the Voluntary Asset & Income Declaration Scheme?'){
            session.send('VAIDS is a time-limited opportunity for taxpayers to regularize their tax status relating to previous tax periods. In exchange for fully and honestly declaring previously undisclosed assets and income, tax payers will benefit from forgiveness of overdue interest and penalties, and the assurance that they will not face criminal prosecution for tax offences or be subject to tax investigations. VAIDS ushers in an opportunity to increase the nation’s general tax awareness and compliance.');
        }
        else if(results.response && results.response.entity =='Why is the FG offering this scheme?'){
            session.send("Nigeria’s tax system is based on global best practice. It is a progressive system that ensures fairness. Those with the highest income levels should shoulder the greatest proportion of the tax burden. Whilst considerable progress has been made with taxing those in formal employment, self-employed persons, professionals and some companies are able to evade full tax payment due to the inability of the tax authorities to assess their true income and thereby tax them accurately. According to the Joint Tax Board (JTB), as at May 2017 the total number of taxpayers in Nigeria is just 14 million out of an estimated 69.9 million who are economically active.\
            \
            \n\nNigeria’s tax to GDP ratio, at just 6%, is one of the lowest in the world (compared to India’s of 16%, Ghana’s of 15.9%, and South Africa’s of 27%). Most developed nations have tax to GDP ratios of between 32% and 35%.\
            Some of the ways in which taxes are evaded include:\
            \
            \n\nManipulating accounting records by keeping two sets of books\
            Many states have lacked the machinery to accurately track the true income of their residents.\
            Use of complex structures in transactions to evade taxes.\
            Non registration for VAT, or charging of VAT without remitting to FIRS.\
            Non payment of Capital Gains Tax (CGT) on asset disposals.\
            Nigeria\'s low tax revenues are at variance with the lifestyles of a large number of its people and with the value of assets known to be owned by Nigerians resident around the world. There has been a systemic breakdown of compliance with the tax system with various strategies used to evade tax obligations. These include but are not limited to, transfer of assets overseas, the use of offshore companies in tax havens to secure assets, and the registration of assets in nominee names. In addition despite having some of the most profitable and well capitalized companies in Africa, the level of tax remittance is low.")
        }
        else if (results.response && results.response.entity =='Why is the FG implementing VAIDS now?'){
            session.send("There is currently a global initiative to tackle the problem of illicit financial flows and tax evasion,\
            which has contributed to the country’s underdevelopment. A report by former South African Premier, Thabo Mbeki\
            found that the amount of illicit financial flows out of Africa exceeded the amount of development aid that Africa receives.\
            Nigeria has the highest level of illicit financial flows in Africa. \
           \
           \n\nAs part of the global support to rebuild Nigeria under President Muhammadu Buhari, \
           the Government has secured the co-operation of a number of nation states in its quest \
           \to repatriate funds due to it. Nigeria has also signed agreements with a number of nations,\
            which provide for the Automatic Exchange of Information (AEI). Countries who are party to this \
            agreement include Switzerland, Panama, the Bahamas and other tax havens. Additionally, banking \
            information will easily be shared across countries due to newly implemented Common Reporting Standards (CRS).\
           \
           \n\nOn 16 August, 2016 the Federal Executive Council approved Nigeria’s participation in the Country-by-Country \
           reporting standard. This will provide tax authorities with greater transparency into the scale of multinational \
           company operations, and enable increased detection of profit shifting and other tax evasion strategies. In addition, \
           Nigeria has signed up for the establishment of the Beneficial Ownership Register at the Anti-Corruption Summit in \
           London in 2016. The will give us access to true owners of properties in the UK and other participating countries.\
           \
           \n\nWithin Nigeria, recent reforms provide additional information to the tax authorities. \
           There is now increased interagency cooperation providing information from BVN, NFIU, State \
           Land Registries, CAC, and other agencies to create an accurate financial picture of Nigeria’s tax payers. \
           In addition, the asset tracing team of the Ministry of Finance has engaged international asset tracing \
           professionals who have been gathering information on individuals and companies which suggests that the \
           level of non-compliance is significant; therefore VAIDS is offering an opportunity for tax payers to voluntarily regularize their tax status.")
        }
        else if (results.response && results.response.entity =='Why aren\'t tax evaders persecuted?'){
            session.send("Even though ignorance of the law is not an excuse, Government has decided to take the pragmatic approach \
            of offering an amnesty window to allow Nigerians, who may have evaded tax, whether ignorantly or deliberately, \
            the opportunity to do their civic duty and pay the correct taxes whilst providing much needed revenue for Nigeria’s infrastructure. \
            A number of countries, including Indonesia, Italy and Argentina, who have seen their tax revenues illegally moved \
            to other nations have undertaken similar programmes to fund their national development. This will reduce the amount\
             that Government will need to borrow for essential projects and will enable Nigeria to make a concerted effort to\
             upgrade essential infrastructure and spur development.\
            \
            \n\nUpon expiration of the Voluntary Asset and Income Declaration programme, \
            Government will commence criminal prosecution of those who have evaded taxes and yet failed to take advantage of the scheme.")            
        }
        else{
            session.send("I feel you did not make a selection from the options")
        }
        session.endDialog('I hope that answers your query.');
    }
]);

bot.dialog('/Vaids Essentials', [
    function (session) {
        builder.Prompts.choice(session, "Please select the closest option to your query", "How long will VAIDS last?|\
        What are the benefits?|What types of Taxes will be covered?|Which period of default will be covered?|\
        Who can participate in the scheme?|Can companies make declarations as well?|Where can one get information about VAIDS?", { listStyle: 3});
    },
    function (session, results) {
        if (results.response && results.response.entity =='How long will VAIDS last?'){
            session.send("The Scheme is expected to last for 9 months only from 1st July, 2017 to 31st March, 2018.\
            There will be no renewal or extension, once the scheme period has expired all remaining \
            tax defaulters who have not taken advantage of its will face the full force of the law.")
        }
        else if (results.response && results.response.entity =='What are the benefits?'){
            session.send("Tax evasion is a crime punishable, upon conviction, by imprisonment of up to 5 years, \
            while the taxpayer will still be required to pay the tax due along with the associated interest and penalties. \
            Typically, a penalty of 10% of the tax due is assessed, along with related interest charges that accrue at 21% per annum, \
            commencing from the due date of the related tax charge. In some cases, the penalty assessed is 100% of the tax due and further, \
            the related assets are liable to be forfeited. Those taking advantage of the Scheme by declaring honestly and fully \
            will be free from prosecution and will qualify for the forgiveness of penalties and interest.\
            \
            \
            \n\n\nAnother benefit of participating in the Scheme, is that tax payers will be able to transfer\
             assets that they had previously held by nominees into their own name. It should be remembered that\
             many Nigerians have lost assets in the course of trying to conceal them from the authorities. \
             Such losses typically occur in the event of death or an urgent need to liquidate assets when \
             required documentation and proof of ownership cannot be provided. The global focus on illicit \
             financial flows is such that global regulations will only become tighter with time, thus this \
             opportunity to regularise should be seized. Declaration allows assets to be legally and formally held by the true owner.")
        }
        else if(results.response && results.response.entity =='What types of Taxes will be covered?'){
            session.send("The Scheme will cover all Federal and State taxes such as Companies Income Tax,\
            Personal Income Tax, Petroleum Profits Tax, Capital Gains Tax, Stamp Duties, Tertiary Education Tax.")
        }
        else if(results.response && results.response.entity =='Which period of default will be covered?'){
            session.send("While the statute of limitations for a tax investigation for honest returns is limited to six years, \
            there is no limit where a fraudulent return has been submitted. \
            A condition of VAIDS is that tax payers will declare fully and honestly.")
        }
        else if(results.response && results.response.entity =='Who can participate in the scheme?'){
            session.send("VAIDS is open to all persons who are in default on their tax liabilities. \
            The Scheme is specifically targeted at taxpayers who:\
            \
            \nhave not been fully declaring their taxable income/assets;\
            \nhave not been paying the tax due at all and or\
            \nhave been underpaying or under remitting\
            It does not matter whether the relevant tax default arose \
            from undeclared assets within or outside the country. \
            If tax should have been paid, VAIDS is providing a once in a lifetime\
             opportunity to declare the tax outstanding and resolve it definitively.")
        }
        else if (results.response && results.response.entity =='Can companies make declarations as well?'){
            session.send("The Scheme covers all taxable persons and entities including individuals,\
            trusts, executors, registered companies and statutory companies.")
        }
        else if (results.response && results.response.entity =='Where can one get information about VAIDS?'){
            session.send("Further information can be obtained from the information unit of the \
            Federal Inland Revenue Service (FIRS), various State Boards Internal \
            Revenue Services(SBIRS) and the dedicated website of the Scheme www.vaids.gov.ng.")
        }
        else{
            session.send("You did not pick an option")
        }
        session.endDialog('I hope that answers your query.');
    }
]);

bot.dialog('/Vaids Participation', [
    function (session) {
        builder.Prompts.choice(session, "Please select the closest option to your query", " How do I pay the tax due?|Pay all liabilities at once?|I don't know how much tax I owe?|My obligations be going forward as a result of my declaration?|I have no TIN and never paid tax?|FIRS and SBIRS invite people to participate?|Must I be resident in Nigeria to participate?|What if I spend time abroad?|For those that don't participate?|Pay tax on overseas income and assets?|Assets located outside of the country on which no income is earned?|Assets that are owned in no-tax jurisdictions?|Assets held in nominee names? Can they now be formally declared? Am I free to transfer them after the declaration?|The effect on waiver of interest and penalty introduced by the FIRS?|Will the tax authority review the information filed?|What about taxes I have already paid?|Can I declare anonymously?|Assurance that information provided  isn't be used against me?", { listStyle: 3});
    }
]);

bot.dialog('/test', [
    function (session) {
        session.send("You can send the user a list of cards as multiple attachments in a single message...");
    }
]);

bot.dialog('/carousel', [
    function (session) {
        session.send("You can pass a custom message to Prompts.choice() that will present the user with a carousel of cards to select from. Each card can even support multiple actions.");
    },
    function (session, results) {
        var action, item;
        var kvPair = results.response.entity.split(':');
        switch (kvPair[0]) {
            case 'select':
                action = 'selected';
                break;
        }
        switch (kvPair[1]) {
            case '100':
                item = "the <b>Space Needle</b>";
                break;
            case '101':
                item = "<b>Pikes Place Market</b>";
                break;
            case '102':
                item = "the <b>EMP Museum</b>";
                break;
        }
        session.endDialog('You %s "%s"', action, item);
    }    
]);

bot.dialog('/receipt', [
    function (session) {
        session.send("You can send a receipts for purchased good with both images and without...");
        
        // Send a receipt with images
        var msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/a/a0/Night_Exterior_EMP.jpg")),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle").image(builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/7/7c/Seattlenighttimequeenanne.jpg"))
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.send(msg);

        // Send a receipt without images
        msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$22.00", "EMP Museum"),
                        builder.ReceiptItem.create(session, "$22.00", "Space Needle")
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Order Number"),
                        builder.Fact.create(session, "VISA 4076", "Payment Method"),
                        builder.Fact.create(session, "WILLCALL", "Delivery Method")
                    ])
                    .tax("$4.40")
                    .total("$48.40")
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/signin', [ 
    function (session) { 
        // Send a signin 
        var msg = new builder.Message(session) 
            .attachments([ 
                new builder.SigninCard(session) 
                    .text("You must first signin to your account.") 
                    .button("signin", "http://example.com/") 
            ]); 
        session.endDialog(msg); 
    } 
]); 


bot.dialog('/actions', [
    function (session) { 
        session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
                    ])
            ]);
        session.send(msg);

        session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function (session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
bot.beginDialogAction('weather', '/weather');   // <-- no 'matches' option means this can only be triggered by a button.