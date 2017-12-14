

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
            .text("Always there to help")
            .images([
                 builder.CardImage.create(session, "http://oi66.tinypic.com/2z52dc3.jpg")
            ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.send("Hi... I am the VAIDS bot for skype and I will be answering your queries");
        session.beginDialog('greetings', session.userData.profile);
    },
    function(session, results){
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
            builder.Prompts.text(session, `Oh hello ${results.response}, nice to meet you. What area are you chatting from?`)
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
            else if ((results.response).toLowerCase().match(/\Win\W/)){
                results.response = ((results.response).slice((results.response).indexOf('in')+2)).trim();
            }
            session.dialogData.profile.location = results.response;
        }
        if(!session.dialogData.profile.issue) {
            builder.Prompts.text(session, `Ahhh ${results.response}? I am a bot so I have never been there. Before we start, lets run through some instructions. OK?`)
        }
        
     },
     (session, results) => {
        session.endDialogWithResult({ response: session.dialogData.profile});
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
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu|main menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("If you type:\n\n* 'menu' or 'show menu' - You will be given the main menu.\n* 'goodbye' or 'bye' - You will end this conversation.\n* 'help' - And these commands will be displayed again incase you forget. \n\n   PS - You can also press the (quit) button to end this anytime.");
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
            session.send("Nigeria’s tax system is based on global best practice. It is a progressive system that ensures fairness. \
            Those with the highest income levels should shoulder the greatest proportion of the tax burden. \
            Whilst considerable progress has been made with taxing those in formal employment, self-employed persons, \
            professionals and some companies are able to evade full tax payment due to the inability of the tax authorities \
            to assess their true income and thereby tax them accurately. According to the Joint Tax Board (JTB), as at May 2017 \
            the total number of taxpayers in Nigeria is just 14 million out of an estimated 69.9 million who are economically active.\
            \
            \n\nNigeria’s tax to GDP ratio, at just 6%, is one of the lowest in the world (compared to India’s of 16%, Ghana’s of 15.9%, and South Africa’s of 27%). \
            Most developed nations have tax to GDP ratios of between 32% and 35%.\
            Some of the ways in which taxes are evaded include:\
            \
            \n\n* Manipulating accounting records by keeping two sets of books\
            \n* Many states have lacked the machinery to accurately track the true income of their residents.\
            \n* Use of complex structures in transactions to evade taxes.\
            \n* Non registration for VAT, or charging of VAT without remitting to FIRS.\
            \n* Non payment of Capital Gains Tax (CGT) on asset disposals.\
            \nNigeria\'s low tax revenues are at variance with the lifestyles of a large number of its people \
            and with the value of assets known to be owned by Nigerians resident around the world. \
            There has been a systemic breakdown of compliance with the tax system with various strategies used \
            to evade tax obligations. These include but are not limited to, transfer of assets overseas, the use\
             of offshore companies in tax havens to secure assets, and the registration of assets in nominee names. \
             In addition despite having some of the most profitable and well capitalized companies in Africa, the level of tax remittance is low.")
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
            \n* Have not been fully declaring their taxable income/assets;\
            \n* Have not been paying the tax due at all and or\
            \n*. Have been underpaying or under remitting\
            \nIt does not matter whether the relevant tax default arose \
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
        builder.Prompts.choice(session, "Please select the closest option to your query", "How do I pay the tax due?|\
Pay all liabilities at once?|I don\'t know how much tax I owe?|My obligations be going forward as a result of my declaration?|\
I have no TIN and never paid tax?|FIRS and SBIRS invite people to participate?|Must I be resident in Nigeria to participate?What if I spend time abroad?|\
For those that don't participate?|Pay tax on overseas income and assets?|\
Assets located outside of the country on which no income is earned?|Assets that are owned in no-tax jurisdictions?|\
Assets held in nominee names? Can they now be formally declared? Am I free to transfer them after the declaration?|\
The effect on waiver of interest and penalty introduced by the FIRS?|Will the tax authority review the information filed?|\
What about taxes I have already paid?|Can I declare anonymously?|Assurance that information provided  isn't used against me?", { listStyle: 3});
     },
    function (session, results) {
        if (results.response && results.response.entity =='How do I pay the tax due?'){
            session.send("All taxes paid under the Scheme are to be collected by the relevant tax authorities including \
            the FIRS and SBIRS, depending on the type of tax in issue. Payments should be made to the Relevant \
            Tax Authority quoting your full name and TIN as a reference. The bank will issue a receipt for the payment.")
        }
        else if (results.response && results.response.entity =='Pay all liabilities at once?'){
            session.send("The Federal Government appreciates that many defaulters have assets but may not have cash. \
            Therefore taxpayers will be allowed to enter into arrangements to pay outstanding tax liabilities in installments. \
            Taxpayers may, at the discretion of the relevant authority, be granted up to three years to pay their liability,\
             but will be obligated to pay interest on the outstanding balance.")
        }
        else if (results.response && results.response.entity =='I don\'t know how much tax I owe?'){
            session.send("Once you register for VAIDS by filing the Declaration form, agents of the Relevant Tax Authority \
            can help you to calculate your tax liability. VAIDS will also be providing extensive training \
            to legal advisers, tax accountants and other professionals to ensure that taxpayers fully \
            understand their obligations under Nigeria’s tax laws.")
        }
        else if (results.response && results.response.entity =='My obligations be going forward as a result of my declaration?'){
            session.send("Taxpayers will be expected to remain fully compliant with tax laws following the Scheme, \
            failing which, they may be forced to forfeit the tax forgiveness granted under \
            VAIDS and be liable to pay past liabilities in full.")
        }
        else if (results.response && results.response.entity =='I have no TIN and never paid tax?'){
            session.send("Registration for a Tax Identification Number would be the first step for persons who have never paid tax.\
            Your application for a TIN will be fast tracked.")
        }
        else if (results.response && results.response.entity =='FIRS and SBIRS invite people to participate?'){
            session.send("The idea of the Scheme is that it is a voluntary programme, the decision to participate should \
            therefore be left to the taxpayers. The FIRS shall give effective publicity to the program\
             and encourage as many people as possible to take advantage of it.")
        }
        else if (results.response && results.response.entity =='Must I be resident in Nigeria to participate?What if I spend time abroad?'){
            session.send("The Scheme is open to all those who were liable to tax in Nigeria. It covers Nigerian residents \
            who had taxable undeclared income outside Nigeria and non – residents who earned \
            undeclared income derived from or accruing within Nigeria.\
            \
            \n\nThose who are resident outside of Nigeria are encouraged to make an online declaration, \
            or to appoint a local agent to make the necessary declaration on their behalf.")
        }
        else if (results.response && results.response.entity =='For those that don\'t participate?'){
            session.send("Those who fail to take advantage of the Scheme and are later found to have under declared \
            their income or assets will be treated as wilful tax evaders and will therefore face the full force of the law.\
            \
            Specifically, we have engaged on retainership, one of the world’s leading asset tracing and \
            recovery firms who will track the true assets of those who have not participated but are believed to have underpaid their taxes.\
            \
            This will be supported by criminal prosecution, and recovery of taxes due with full penalties and interest. \
            In addition, we plan a “Name and Shame” programme that will reveal the identities of tax evaders.\
            \
            Furthermore, the Relevant Tax Authorities are in the process of profiling certain categories of non-compliant \
            taxpayers for ongoing audits and investigations, in line with the tax compliance reforms. \
            As such, taxpayers are encouraged to make the most of the time-limited opportunity available under the Scheme to \
            declare their incomes and assets, and pay outstanding tax liabilities to avoid the adverse consequences inherent \
            in the tax enforcement processes to be implemented by the Relevant Tax Authorities at the end of the Scheme.")
        }
        else if (results.response && results.response.entity =='Pay tax on overseas income and assets?'){
            session.send("Nigerian tax law is clear that Nigerian tax residents are liable to pay tax on their \
            income earned anywhere in the world. Nigerian tax residents include the following:\
            \
            \n\n* Individuals that derive income from sources in Nigeria;\
            \n\n* Employees that are in Nigerian employment or resident in Nigeria \
            for at least 183 days within a twelve month period; and\
            \n\n* Nigerian companies who were incorporated or have a fixed base in Nigeria.")
        }
        else if (results.response && results.response.entity =='Assets located outside of the country on which no income is earned?'){
            session.send("Some Nigerians own assets overseas, but do not earn any revenue on them, rather they are for personal use.\
            In such cases, they might not have taxable income but if the original purchase of those assets was, \
            in any way, financed from revenue earned by a Nigerian tax payer but on which the correct amount \
            of tax was not paid in Nigeria, then the unpaid tax liability may attach to that overseas asset.\
           \
           \n\nThe information obtained on some citizens suggest clearly that the funds they used to \
           purchase overseas assets far exceed the income declared in the tax returns in the year pf purchase. \
           Such Tax Returns are therefore rendered false and a tax liability exists.")
        }
        else if (results.response && results.response.entity =='Assets that are owned in no-tax jurisdictions?'){
            session.send("The use of Tax Avoidance Schemes is legal but tax evasion is not. \
            If the ultimate beneficial owner of those assets had paid all taxes on the funds\
             prior to their transfer to the tax shelter, then there will be no additional liability\
             except any tax payable on further income earned on those funds. However if the correct \
             amount of tax was not paid prior to transfer, then a liability exists and Government is\
             entitled to trace its tax claim through to those assets and any income that arises from them.")
        }
        else if (results.response && results.response.entity =='Assets held in nominee names? Can they now be formally declared? Am I free to transfer them after the declaration?'){
            session.send("All assets owned, whether held directly or indirectly should be formally declared. \
            VAIDS will also entail the creation of proper records so that future dealings\
             with such assets will be properly recorded. The owner of assets held in nominee’s names \
             can then freely transfer them based on the extant law.\
            \
            \n\nAfter declaration, the owner of assets held in nominee’s names can then freely transfer them based on the extant law.")
        }
        else if (results.response && results.response.entity =='The effect on waiver of interest and penalty introduced by the FIRS?'){
            session.send("The grace period recently allowed by FIRS for waiver of interest and penalties \
            pursuant to the recent tax amnesty has lapsed. VAIDS is more comprehensive in terms of taxes and timeframe. \
            It covers personal taxes as well as company taxes. The commitments made by the FIRS during the \
            Scheme will be respectably saved for discovery of new facts, non-disclosure and partial disclosure.\
            \
            \n\nThis will be supported by criminal prosecution, and recovery of taxes due with full penalties and interest. \
            In addition, we plan a “Name and Shame” programme that will reveal the identities of tax evaders.")
        }
        else if (results.response && results.response.entity =='Will the tax authority review the information filed?'){
            session.send("Yes. The tax authority will review the information supplied by the taxpayer. \
            If they are not satisfied with its completeness, they may ask for additional information. \
            Indeed, The Relevant Tax Authorities are empowered by specific provisions of the relevant \
            tax laws to require participating taxpayers to produce any books, documents, accounts, returns and other records.\
            \
            \n\nWithin the Scheme period, an applicant can file an amended declaration if further tax liabilities are identified.\
             However, all information must be received within the duration of VAIDS.")
        }
        else if (results.response && results.response.entity =='What about taxes I have already paid?'){
            session.send("All taxes already paid will be taken into account into determining the final tax position of a taxpayer.")
        }
        else if (results.response && results.response.entity =='Can I declare anonymously?'){
            session.send("No! Declaration cannot be made anonymously. For any taxpayer to get clearance, \
            he must have declared correctly and made payment in his own name or that of his company\
             as the case may be. Tax declarations are however treated as confidential by the tax authorities.")
        }
        else if (results.response && results.response.entity =='Assurance that information provided  isn\'t used against me?'){
            session.send("The confidentiality of the information you provide under the Scheme is assured. \
            Measures have been put in place for information received by the tax authority will\
             be kept in strict confidence, and will not be disclosed to third parties other than \
             in compliance with extant provisions of relevant laws.")
        }
        session.endDialog('I hope that answers your query.');
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