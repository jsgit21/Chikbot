require('dotenv').config(); //initialize dotenv
const Discord = require('discord.js'); //import discord.js
const fetch = require('node-fetch'); //import node fetch
const mtg = require('mtgsdk');
const { Client } = require('pg');
const { MessageEmbed } = require('discord.js');

const client = new Discord.Client({intents: ["GUILDS", "GUILD_MESSAGES"]}); //create new client

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function commandsToString(commands) {
    let printout = "";
    for (const [command, description] of Object.entries(commands)) {
        printout = printout +"> **"+command + "** - " + description+ "\n";
    }
    return printout;
}

function validName(name) {
    //console.log("Valid name check...");
    if(!(/^([a-zA-Z0-9 ]*)$/.test(name))) {
        //console.log("Valid name, false");
        return false;
    }
    //console.log("Valid name, true");
    return true;
}

function getFullUsername(givenFlags) {
    var commandFlag = "";

    if (givenFlags.length >= 32) {
        //Return name over 32 to hit name length exception check
        return "commandFlagcommandFlagcommandFlag";
    }

    for (i = 0; i < givenFlags.length; i++) {
        commandFlag = commandFlag + givenFlags[i];
        //Prevent adding space after username
        if (i != givenFlags.length-1) {
            commandFlag = commandFlag + " ";
        }
    }
    return commandFlag;
}

function msTillWordleReset() {
    var wordleReset = new Date();
    wordleReset.setHours(5,0,0,0);
    var timeNow = new Date().getTime()
    var offsetMs
    if (wordleReset < timeNow) {
        wordleReset.setDate(wordleReset.getDate() + 1);
    }
    else {
    }
    offsetMs = wordleReset - timeNow;
    console.log("wordleReset: ", wordleReset);
    console.log("timenow: ", timeNow);
    console.log("offset: ", offsetMs/(1000*60*60),"hrs");
    return offsetMs;
}

function resetWordleDB() {
    console.log("Resetting wordle/quordle DB, time to reset!");
    var wordleChannelID = '940720249454608414';
    client.channels.cache.get(wordleChannelID).send('Wordle and Quordle has been reset (EST) and scores may be submitted again, hooray!');

    const con = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var wordle = `UPDATE wordle SET playedtoday = 'f'`;
        var quordle = `UPDATE quordle SET playedtoday = 'f'`;

        con.query(wordle, function (err, result) {
            if (err) throw err;
            for (let row of result.rows) {
                console.log(JSON.stringify(row));
            }
        });

        con.query(quordle, function (err, result) {
            if (err) throw err;
            for (let row of result.rows) {
                console.log(JSON.stringify(row));
            }
            con.end();
        });
    });

    var waitTimeMS = msTillWordleReset();
    setTimeout(resetWordleDB, waitTimeMS);

}

var waitTimeMS = msTillWordleReset();
setTimeout(resetWordleDB, waitTimeMS);

const commandList = {
    "$help":"Information about Chikbot",
    "$hi":"Say hello to Chikbot",
    "$ping":"Pongs back with latency between messages",
    "$chiken":"Bwakk bwakk!",
    "$keys":"Who got the key?",
    "$dadjoke":"Get a random dad joke!",
    "$breakchikbot":"That's rude.",
    "$wstats":"Check for your wordle stats tracked in discord",
    "$wstats <name>":"Check another user's wordle stats tracked in discord",
    "$qstats":"Check for your quordle stats tracked in discord",
    "$qstats <name>":"Check another user's quordle stats tracked in discord",
}
const wordleRegex = new RegExp('Wordle [0-9]{3}([0-9]?){2} (X|x|[1-6])/6');
const qregex = new RegExp("Daily Quordle #[0-9].*\n");
const mtgregex = new RegExp("\\[\\[.*\\]\\]");
const prefix = "$";

client.on("messageCreate", function(message) {

    //Ignore bot messages
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const wordlechat = "940720249454608414";
    if (channelId !== "941770101672267808" && channelId !== 
    "941756769154252820" && channelId !== wordlechat) return;

    var username = message.author.username;
    var userID = message.author.id;
    var tagUser = message.author.toString();

    if (message.content.startsWith(prefix)) {
        var splitFlags = message.content.split(" ");
        console.log("splitFlags: ", splitFlags);
        const commandBody = splitFlags[0].replace("$","").toLowerCase();
        //Remove command body - splitFlags now contains only argument flags
        splitFlags.splice(0,1);
        console.log("splitFlags: ", splitFlags);

        if(commandBody === "ping") {
            const timeTaken = Math.abs(Date.now() - message.createdTimestamp);
            message.reply('Pong!\nLatency of '+timeTaken+'ms.')
        }
        else if (commandBody === "commands") {
            message.channel.send("Here's a list of my current commands: \n"+ commandsToString(commandList))
        }
        else if (commandBody === "chiken") {
            message.channel.send('Bwakk bwakk!');
        }
        else if (commandBody === "help") {
            message.channel.send("Hi, I'm **Chikbot** - Joe is trying to become familiar with Node.js so until I actually become useful *(Don't hold your breath)* please abuse my relatively useless commands for fun! Check for a list of my commands here "+prefix+"**commands**")
        }
        else if (commandBody === "hi") {
            const user = message.author.username;
            message.reply("Yo, what's up " + user + "!")
        }
        else if (commandBody === "keys") {
            message.channel.send("Imagine losing a hardcore getting ecumenical keys...")
        }
        else if (commandBody == "breakchikbot") {
            message.channel.send("Attempting to kick player from friends chat...");
        }

        else if (commandBody === "dadjoke") {
            const url = "https://icanhazdadjoke.com/";

            const options = {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Personal Discord Bot'
                  }
            }

            fetch(url, options)
            .then( res => res.json() )
            .then( data => {
                console.log(data);
                message.channel.send(data.joke);
            });

            
        }
        else if (commandBody == "wstats") {
            var badActors = [];
            var userID = message.author.id;

            //Get full username if search user flags are passed
            const commandFlag = getFullUsername(splitFlags);
            //console.log("CommandFlag: ", commandFlag);
            if(commandFlag != '') {
                if(commandFlag.length > 32) {
                    message.channel.send("Sorry, this name is too long to be a discord name.");
                    return;
                }
                else if(!validName(commandFlag)) {
                    message.channel.send("Sorry, this is invalid use of this command, please see $commands.");
                    return;
                }
            }

            //Uses default .ENV parameters specified in .ENV file
            //https://node-postgres.com/features/connecting
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            });
    
            client.connect(function(err) {
                if (err) throw err;
                console.log("Connected!");

                if (commandFlag == '') {
                    var sql = `SELECT * FROM wordle WHERE userid='${userID}'`;
                }
                else {
                    var sql = `SELECT * FROM wordle WHERE name='${commandFlag}'`;
                }
                client.query(sql, function (err, result) {
                    if (err) throw err;
                    for (let row of result.rows) {
                        console.log(JSON.stringify(row));
                    }
                    //console.log(result['rows'][0]);

                    if (result['rows'].length != 0) {
                        var userinfo = result['rows'][0];

                        var biggest = 1;
                        var gameswon = 0;
                        var nums = [userinfo.one, userinfo.two, userinfo.three, userinfo.four, userinfo.five, userinfo.six];
                        for (i = 0; i < 6; i++) {
                            gameswon = gameswon + nums[i];
                            if (nums[i] > biggest) {
                                biggest = nums[i];
                            }
                        }
                        var displaybar = []
                        for (i = 0; i < 6; i++) {
                            numofx = (nums[i]/biggest)*16;
                            displaybar[i] = '>'.repeat(numofx);
                            displaybar[i] = displaybar[i] + " ";
                        }
                        var gameslost = userinfo.total - gameswon;

                        message.reply(`\n**GUESS DISTRIBUTION**\`\`\`py\n@ ${userinfo.name}\n\`\`\`\`\`\`prolog\n1/6 ->${displaybar[0]}${userinfo.one}\n2/6 ->${displaybar[1]}${userinfo.two}\n3/6 ->${displaybar[2]}${userinfo.three}\n4/6 ->${displaybar[3]}${userinfo.four}\n5/6 ->${displaybar[4]}${userinfo.five}\n6/6 ->${displaybar[5]}${userinfo.six}\n\`\`\`\`\`\`prolog\nGames Lost = ${gameslost}\nTotal Played = ${userinfo.total}\n\`\`\``)
                    }
                    else {
                        if (commandFlag == '') {
                            message.reply(`You were not found in the Wordle database.\nBegin playing Wordle daily and sharing your scores in the \`#»🚾wordle-chat\` channel.`)
                        }
                        else {
                            message.reply(`The user **${commandFlag}** was not found in the Wordle database\n\`\`\`Please use their name as it appears in their discord tag <NAME>#0000\`\`\`\nIf you're using the correct NAME, they can begin playing Wordle daily and sharing their scores in the \`#»🚾wordle-chat\` channel.`) 
                        }
                    }

                    client.end();
                });
            });
        }
        else if (commandBody == "qstats") {
            var badActors = [];

            //Get full username if search user flags are passed
            const commandFlag = getFullUsername(splitFlags);
            //console.log("CommandFlag: ", commandFlag);
            if(commandFlag != '') {
                if(commandFlag.length > 32) {
                    message.channel.send("Sorry, this name is too long to be a discord name.");
                    return;
                }
                else if(!validName(commandFlag)) {
                    message.channel.send("Sorry, this is invalid use of this command, please see $commands.");
                    return;
                }
            }

            //Uses default .ENV parameters specified in .ENV file
            //https://node-postgres.com/features/connecting
            const client = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            });
    
            client.connect(function(err) {
                if (err) throw err;
                console.log("Connected!");

                if (commandFlag == '') {
                    var sql = `SELECT * FROM quordle WHERE userid='${userID}'`;
                }
                else {
                    var sql = `SELECT * FROM quordle WHERE name='${commandFlag}'`;
                }
                client.query(sql, function (err, result) {
                    if (err) throw err;
                    for (let row of result.rows) {
                        console.log(JSON.stringify(row));
                    }
                    //console.log(result['rows'][0]);

                    if (result['rows'].length != 0) {
                        var userinfo = result['rows'][0];

                        var biggest = 1;
                        var gameswon = 0;
                        var nums = [userinfo.four, userinfo.five, userinfo.six, userinfo.seven, userinfo.eight, userinfo.nine];
                        for (i = 0; i < 6; i++) {
                            gameswon = gameswon + nums[i];
                            if (nums[i] > biggest) {
                                biggest = nums[i];
                            }
                        }
                        var displaybar = []
                        for (i = 0; i < 6; i++) {
                            numofx = (nums[i]/biggest)*16;
                            displaybar[i] = '>'.repeat(numofx);
                            displaybar[i] = displaybar[i] + " ";
                        }
                        var gameslost = userinfo.total - gameswon;

                        message.reply(`\n**GUESS DISTRIBUTION**\`\`\`py\n@ ${userinfo.name}\n\`\`\`\`\`\`prolog\n4/9 ->${displaybar[0]}${userinfo.four}\n5/9 ->${displaybar[1]}${userinfo.five}\n6/6 ->${displaybar[2]}${userinfo.six}\n7/9 ->${displaybar[3]}${userinfo.seven}\n8/9 ->${displaybar[4]}${userinfo.eight}\n9/9 ->${displaybar[5]}${userinfo.nine}\n\`\`\`\`\`\`prolog\nGames Lost = ${gameslost}\nTotal Played = ${userinfo.total}\n\`\`\``)
                    }
                    else {
                        if (commandFlag == '') {
                            message.reply(`You were not found in the Quordle database.\nBegin playing Quordle daily and sharing your scores in the \`#»🚾wordle-chat\` channel.`)
                        }
                        else {
                            message.reply(`The user **${commandFlag}** was not found in the Quordle database\n\`\`\`Please use their name as it appears in their discord tag <NAME>#0000\`\`\`\nIf you're using the correct NAME, they can begin playing Quordle daily and sharing their scores in the \`#»🚾wordle-chat\` channel.`) 
                        }
                    }

                    client.end();
                });
            });
        }
        
    }

    // Check for wordle score submission
    else if (message.content.match(wordleRegex)){

        wordleHeader = message.content.split(' ');
        wordleScore = wordleHeader[2].split('\n')[0];
        rawScore = wordleScore[0]
        console.log(rawScore);
        //console.log(message.content.split('\n'))

        var numBlockRows;
        if (rawScore == 'X' || rawScore == 'x') {
            rawScore = rawScore.toLowerCase();
            numBlockRows = 'x';
        }
        else {
            checkBlockRows = message.content.split('\n');
            numBlockRows = checkBlockRows.length - 2;
        }

        console.log("checkblockrows ", checkBlockRows);
        if (checkBlockRows[1].startsWith("ADD ")) {
            console.log("Lets add a new user: ");
            var addinfo = checkBlockRows[1].split(" ");
            console.log("addinfo: ", addinfo);
            if (addinfo.length != 3) {
                console.log("ADD requires 3 parameters");
                return;
            }
            if (addinfo[1].length != 18) {
                console.log("2nd Parameter USERID needs to be 18 chars");
                return;
            }
            userID = addinfo[1];
            username = addinfo[2];
        }

        var scoreAdder = [0, 0, 0, 0, 0, 0, 1, userID, username, 't'];
        console.log("scoreAdder: ", scoreAdder);

        console.log("num block rows ", numBlockRows);
        console.log("rawScore ", rawScore);

        if (numBlockRows != rawScore) {
            console.log("The length of the message was not as expected for this score");
            message.channel.send(`${tagUser} your score was not properly submitted. Please paste your Wordle score without any extra content added to the message.`);

            return;
        }
        else {

            if (rawScore != 'x') {
                scoreAdder[rawScore-1] = 1;
            }

            console.log(scoreAdder)
        }

        //Uses default .ENV parameters specified in .ENV file
        //https://node-postgres.com/features/connecting
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        client.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            var query = `SELECT * FROM wordle WHERE userid='${userID}'`;
            
            client.query(query, function (err, result) {
                if (err) throw err;
                var playerstats = result['rows'][0];
                console.log(playerstats);

                if (result['rows'].length != 0) {
                    if (playerstats.playedtoday) {
                        message.channel.send(`Sorry ${tagUser} - It looks like you've already submitted a Wordle score today.`);
                        client.end();
                        return;
                    }
                }

                query = `INSERT INTO wordle (one, two, three, four, five, six, total, userid, name, playedtoday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (userid) DO UPDATE SET one=wordle.one+${scoreAdder[0]}, two=wordle.two+${scoreAdder[1]}, three=wordle.three+${scoreAdder[2]}, four=wordle.four+${scoreAdder[3]}, five=wordle.five+${scoreAdder[4]}, six=wordle.six+${scoreAdder[5]}, total=wordle.total+1, playedtoday='t'`;
            
                client.query(query,scoreAdder, function (err, result) {
                    if (err) throw err;
                    for (let row of result.rows) {
                        console.log(JSON.stringify(row));
                    }
                    message.channel.send(`Thanks ${tagUser} - Your score has been recorded. You can use **$wstats** to see your score distribution.`);
                    //console.log(result);
                    client.end();
                });

            });
        });
          
    }
    else if ( message.content.match(qregex)) {

        //message.channel.send("Nice Qordle");
        var splitQuordle = message.content.split("\n");
        //console.log(splitQuordle)
        
        var arrayOffset = 4;
        var quordleData = [0, 0, 0, 0, 0, 0, 1, userID, username, 't']

        //For a quordle to be complete, the guessScore needs to be at least 4
        //nums found + red squares found need to = 4
        var topquordleHeight = -1;
        var bottomquordleHeight = -1;
        var guessScore = 1;
        var numsfound = 0;
        var redSquaresFound = 0;
        var solved;
        for (i=1; i<=2; i++) {
            console.log(splitQuordle[i], " length: ", splitQuordle[i].length);
            if (splitQuordle[i].length < 4 || splitQuordle[i].length > 6) {
                console.log("QUORDLE ERROR: splitquordle[",i,"] is not within length 4 to 6, length: ",splitQuordle[i].length);
                message.channel.send(`${tagUser} your score was not properly submitted. Please paste your Quordle score without any extra content added to the message.`);
                return;
            }

            //Find the number of red squares in the pattern
            var array = splitQuordle[i].split('');
            console.log("array: ", array);
            for(x = 0; x < array.length-1; x++) {
                //console.log("array[x] = ",array[x], " array[x+1] = ",array[x+1]);
                if (array[x] == '\ud83d' && array[x+1] == '\udfe5') {
                    redSquaresFound++;
                    if (i == 1) {
                        topquordleHeight = 9;
                    }
                    else if (i == 2){
                        bottomquordleHeight = 9;
                    }
                }
            }
            for(j=0; j<splitQuordle[i].length; j++) {
                //Check if its a number
                //console.log(splitQuordle[i][j])
                if (splitQuordle[i][j] >= '0' && splitQuordle[i][j] <= '9') {
                    numsfound++;
                    if (splitQuordle[i][j] > guessScore) {
                        guessScore = splitQuordle[i][j];
                    }
                    if(splitQuordle[i][j] > topquordleHeight && i == 1) {
                        topquordleHeight = splitQuordle[i][j];
                    }
                    else if (splitQuordle[i][j] > bottomquordleHeight && i == 2) {
                        bottomquordleHeight = splitQuordle[i][j];
                    }
                }
            }
        }
        console.log("guessScore: ",guessScore);
        console.log("numsfound: ",numsfound);
        console.log("topquordleHeight: ", topquordleHeight);
        console.log("bottomquordleHeight: ", bottomquordleHeight);

        if (topquordleHeight == -1){
            topquordleHeight = 9;
        }
        if (bottomquordleHeight == -1){
            bottomquordleHeight = 9;
        }

        var expectedLength = parseFloat(topquordleHeight) + parseFloat(bottomquordleHeight) + 5;
        
        
        if (splitQuordle.length != expectedLength) {
            console.log(`QUORDLE ERROR: splitQuordle length is not ${expectedLength}, length: `,splitQuordle.length);
            message.channel.send(`${tagUser} your score was not properly submitted. Please paste your Quordle score without any extra content added to the message.`);
            return;
        }

        if (numsfound + redSquaresFound != 4) {
            console.log("QUORDLE ERROR: Nums + redsquares != 4");
            message.channel.send(`${tagUser} your score was not properly submitted. Please paste your Quordle score without any extra content added to the message.`);
            return;
        }

        if (numsfound == 4) {
            solved = true;
        }
        else {
            solved = false;
        }

        if (solved) {
            quordleData[guessScore-arrayOffset]=1;
        }

        console.log(quordleData)
        console.log("Red Squares Found: ", redSquaresFound);

        //Uses default .ENV parameters specified in .ENV file
        //https://node-postgres.com/features/connecting
        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        client.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            var query = `SELECT * FROM quordle WHERE userid='${userID}'`;
            
            client.query(query, function (err, result) {
                if (err) throw err;
                //console.log("RESULT: ", result);
                var playerstats = result['rows'][0];
                console.log(playerstats);

                if (result['rows'].length != 0) {
                    if (playerstats.playedtoday) {
                        message.channel.send(`Sorry ${tagUser} - It looks like you've already submitted a Quordle score today.`);
                        client.end();
                        return;
                    }
                }

                query = `INSERT INTO quordle (four, five, six, seven, eight, nine, total, userid, name, playedtoday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (userid) DO UPDATE SET four=quordle.four+${quordleData[0]}, five=quordle.five+${quordleData[1]}, six=quordle.six+${quordleData[2]}, seven=quordle.seven+${quordleData[3]}, eight=quordle.eight+${quordleData[4]}, nine=quordle.nine+${quordleData[5]}, total=quordle.total+1, playedtoday='t'`;
            
                client.query(query, quordleData, function (err, result) {
                    if (err) throw err;
                    for (let row of result.rows) {
                        console.log(JSON.stringify(row));
                    }
                    message.channel.send(`Thanks ${tagUser} - Your score has been recorded. You can use **$qstats** to see your score distribution.`);
                    //console.log(result);
                    client.end();
                });

            });
        });
    }
    else if (message.content.match(mtgregex)) {
        //remove [[ ]]
        var cardname = message.content.substring(2, message.content.length-2);

        mtg.card.where({ name: cardname })
        .then(cards => {
            if(typeof cards[0] != 'undefined') {
                console.log(cards[0].name) // "Squee, Goblin Nabob"

                var url = cards[0].imageUrl;
                const embed = new MessageEmbed()
                embed.setImage(url);
                message.channel.send({embeds: [embed]});

                var suggested = 5;
                if (cards.length < 5) {
                    suggested = cards.length;
                }

                console.log("Did you mean:\n");
                for (i = 1; i < suggested; i++){
                    console.log(cards[i].name);
                }
            }
        })

    }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token