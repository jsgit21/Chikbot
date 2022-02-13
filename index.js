require('dotenv').config(); //initialize dotenv
const Discord = require('discord.js'); //import discord.js
const fetch = require('node-fetch'); //import node fetch
var mysql = require('mysql');

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
        // else if (commandBody == "wordlestats") {
        //     var badActors = [];
        //     var userID = message.author.id;

        //     //Get full username if search user flags are passed
        //     const commandFlag = getFullUsername(splitFlags);
        //     //console.log("CommandFlag: ", commandFlag);
        //     if(commandFlag != '') {
        //         if(commandFlag.length > 32) {
        //             message.channel.send("Sorry, this name is too long to be a discord name.");
        //             return;
        //         }
        //         else if(!validName(commandFlag)) {
        //             message.channel.send("Sorry, this is invalid use of this command, please see $commands.");
        //             return;
        //         }
        //     }

        //     const con = mysql.createConnection({
        //         host: 'localhost',
        //         user: 'admin',
        //         password: 'chikenadmin',
        //         database: "chickbotdb",
        //         debug : false
        //     });
    
        //     con.connect(function(err) {
        //         if (err) throw err;
        //         console.log("Connected!");

        //         if (commandFlag == '') {
        //             var sql = `SELECT * FROM wordle WHERE userid=${userID}`;
        //         }
        //         else {
        //             var sql = `SELECT * FROM wordle WHERE name='${commandFlag}'`;
        //         }
        //         con.query(sql, function (err, result) {
        //             if (err) throw err;
        //             //console.log(result);

        //             if (result.length != 0) {
        //                 var userinfo = result[0];
        //                 message.reply(`\n**GUESS DISTRIBUTION**\`\`\`fix\n${userinfo.name}\n\`\`\`\`\`\`prolog\nONE --- ${userinfo.one}\nTWO --- ${userinfo.two}\nTHREE - ${userinfo.three}\nFOUR -- ${userinfo.four}\nFIVE -- ${userinfo.five}\nSIX --- ${userinfo.six}\n\`\`\`\`\`\`fix\nTotal played = ${userinfo.total}\n\`\`\``)
        //             }
        //             else {
        //                 if (commandFlag == '') {
        //                     message.reply(`You were not found in the Wordle database.\nBegin playing Wordle daily and sharing your scores in the \`#»🚾wordle-chat\` channel.`)
        //                 }
        //                 else {
        //                     message.reply(`The user **${commandFlag}** was not found in the Wordle database\n\`\`\`Please use their name as it appears in their discord tag <NAME>#0000\`\`\`\nIf you're using the correct NAME, they can begin playing Wordle daily and sharing their scores in the \`#»🚾wordle-chat\` channel.`) 
        //                 }
        //             }
        //         });
        //     });
        // }
    }

    // Check for wordle score submission -- COMMENTED OUT TILL I CAN GET DB RUNNING LIVE ON HOSTED SERVER
    // else if (message.content.match(wordleRegex)){
    //     var userID = message.author.id;
    //     var username = message.author.username;

    //     //userID = '159518215104495617';
    //     //username = 'Beleti';

    //     var scoreAdder = [0, 0, 0, 0, 0, 0, 1, userID, username];
    //     wordleHeader = message.content.split(' ');
    //     wordleScore = wordleHeader[2].split('\n')[0];
    //     rawScore = wordleScore[0]
    //     console.log(rawScore);
    //     //console.log(message.content.split('\n'))

    //     var numBlockRows;
    //     if (rawScore == 'X' || rawScore == 'x') {
    //         rawScore = rawScore.toLowerCase();
    //         numBlockRows = 'x';
    //     }
    //     else {
    //         checkBlockRows = message.content.split('\n');
    //         numBlockRows = checkBlockRows.length - 2;
    //     }

    //     console.log("num block rows ", numBlockRows);
    //     console.log("rawScore ", rawScore);

    //     if (numBlockRows != rawScore) {
    //         console.log("something went wrong with score input");
    //         return;
    //     }
    //     else {

    //         if (rawScore != 'x') {
    //             scoreAdder[rawScore-1] = 1;
    //         }

    //         console.log(scoreAdder)
    //     }

    //     const con = mysql.createConnection({
    //         host: 'localhost',
    //         user: 'admin',
    //         password: 'chikenadmin',
    //         database: "chickbotdb",
    //         debug : false
    //     });

    //     con.connect(function(err) {
    //     if (err) throw err;
    //     console.log("Connected!");
    //     var sql = `INSERT INTO wordle (one, two, three, four, five, six, total, userid, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE one=one+${scoreAdder[0]}, two=two+${scoreAdder[1]}, three=three+${scoreAdder[2]}, four=four+${scoreAdder[3]}, five=five+${scoreAdder[4]}, six=six+${scoreAdder[5]}, total=total+1`;
    //         con.query(sql,scoreAdder, function (err, result) {
    //             if (err) throw err;
    //             console.log("fin");
    //         });
    //     });
          
    // }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token