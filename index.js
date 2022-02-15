require('dotenv').config(); //initialize dotenv
const Discord = require('discord.js'); //import discord.js
const fetch = require('node-fetch'); //import node fetch
const { Client } = require('pg');

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

const wordleRegex = new RegExp('Wordle [0-9]{3}([0-9]?){2} (X|x|[1-6])/6');

const prefix = "$";
const commandList = {
    "$help":"Information about Chikbot",
    "$hi":"Say hello to Chikbot",
    "$ping":"Pongs back with latency between messages",
    "$chiken":"Bwakk bwakk!",
    "$keys":"Who got the key?",
    "$dadjoke":"Get a random dad joke!",
    "$wordlestats":"Check for your wordlestats tracked in discord",
    "$wordlestats <name>":"Check another user's wordlestats tracked in discord"
}

const laz = ["We don't take kindly to llamas round these parts...","Hey! What did I say llama boy", "No seriously, stop it", "You're starting to really get on my nerves", "Excuse me, what do you think this is?","Sir, this is a llama free zone", "Ok really im gonna need you to stop.", "Stop.", "Stop...", "STOP IT", "LLAMA!!!!!!", "I'm going to Alt+F4 myself", "This is bullshit.", "@Chiken dude can you fucking stop this guy?", "alright, fuck this!"];
let count = 0;

function msTillWordleReset() {
    var wordleReset = new Date();
    wordleReset.setHours(20,11,0,0);
    var timeNow = new Date().getTime()
    var offsetMs
    if (wordleReset < timeNow) {
        wordleReset.setDate(wordleReset.getDate() + 1);
    }
    offsetMs = wordleReset - timeNow;
    console.log("wordleReset: ", wordleReset);
    console.log("timenow: ", timeNow);
    console.log("offset: ", offsetMs/(1000*60*60),"hrs");
    return offsetMs;
}

function resetWordleDB() {
    console.log("Resetting wordle DB, time to reset!");

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    client.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE wordle SET playedtoday = FALSE;`;
        client.query(sql, function (err, result) {
            if (err) throw err;
            for (let row of result.rows) {
                console.log(JSON.stringify(row));
            }
            client.end();
        });
    });

    var waitTimeMS = msTillWordleReset();
    setTimeout(resetWordleDB, waitTimeMS);

}

var waitTimeMS = msTillWordleReset();
setTimeout(resetWordleDB, waitTimeMS);

client.on("messageCreate", function(message) {
    //Ignore bot messages
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const wordlechat = "940720249454608414";
    if (channelId !== "941770101672267808" && channelId !== 
    "941756769154252820" && channelId !== wordlechat) return;

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
        else if (commandBody === "emoji") {
            message.channel.send("<a:Untitled:941779064191078400>")
        }

        else if (commandBody === "dadjoke") {
            // if (message.author.username.toLowerCase() == "lazlodallama") {
            //     if (count <= 14) {
            //         message.channel.send(laz[count]);
            //     }
            //     count = count + 1;
            //     return
            // }
            //https://icanhazdadjoke.com/api
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
        else if (commandBody == "wordlestats") {
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
                        message.reply(`\n**GUESS DISTRIBUTION**\`\`\`fix\n${userinfo.name}\n\`\`\`\`\`\`prolog\nONE --- ${userinfo.one}\nTWO --- ${userinfo.two}\nTHREE - ${userinfo.three}\nFOUR -- ${userinfo.four}\nFIVE -- ${userinfo.five}\nSIX --- ${userinfo.six}\n\`\`\`\`\`\`fix\nTotal played = ${userinfo.total}\n\`\`\``)
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
        else if (commandBody == "rules") {
            message.channel.send("This database is being hosted for free on Heroku with limitations on the number of entries. This is for fun, please do not abuse the score system or you will be removed from it.")
        }
    }

    // Check for wordle score submission
    else if (message.content.match(wordleRegex)){
        var userID = message.author.id;
        var username = message.author.username;

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
            console.log("something went wrong with score input");
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
                        message.channel.send(`Sorry ${username} - It looks like you've already submitted a Wordle score today.`);
                        client.end();
                        return;
                    }
                }
            });
            
            query = `INSERT INTO wordle (one, two, three, four, five, six, total, userid, name, playedtoday) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (userid) DO UPDATE SET one=wordle.one+${scoreAdder[0]}, two=wordle.two+${scoreAdder[1]}, three=wordle.three+${scoreAdder[2]}, four=wordle.four+${scoreAdder[3]}, five=wordle.five+${scoreAdder[4]}, six=wordle.six+${scoreAdder[5]}, total=wordle.total+1, playedtoday='t'`;
            
            client.query(query,scoreAdder, function (err, result) {
                if (err) throw err;
                for (let row of result.rows) {
                    console.log(JSON.stringify(row));
                }
                message.channel.send(`Thanks ${username} - Your score has been recorded. You can use **$wordlestats** to see your score distribution. See **$rules** for more details.`);
                //console.log(result);
                client.end();
            });
        });
          
    }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token