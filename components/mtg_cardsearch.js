const mtg = require('mtgsdk');
const { MessageEmbed } = require('discord.js');

const mtgregex = new RegExp("\\[\\[.*\\]\\]");

async function getCardWithImage(cardname) {
    let promise = new Promise((resolve,reject) => {
        mtg.card.where({ name: cardname })
        .then(matched_cards => {
            var found = false;
            for(i = 0; i < matched_cards.length; i++) {
                if (typeof matched_cards[i].imageUrl != 'undefined') {
                    matchCard = matched_cards[i];
                    url = matched_cards[i].imageUrl;
                    found = true;
                    break;
                }
            }
            if (found) {
                console.log("Card was image was found!");
                resolve(matchCard);
            }
            else {
                console.log("Card image was not found!")
                reject("NO CARD WITH IMG FOUND");
            }
        })
    })
    let imgcard = await promise;
    return imgcard;
}

exports.cardSearch = (channel, message) => {
    //remove [[ ]] - Adjusted for pulling [[<name>]] anywhere within a message.
    var msg = message.match(mtgregex)[0];
    var cardname = msg.substring(2, msg.length-2);

    mtg.card.where({ name: cardname })
    .then(async cards => {
        if (typeof cards[0] != 'undefined') {
            try {
                //console.log("matches found: ",cards.length)
                var matchCard = cards[0];
                var cardFound = matchCard.name;
                //console.log("cardFound: ",cards[0].name) // "Squee, Goblin Nabob"
                var url = matchCard.imageUrl;

                //If image not found on original card, look for it's image
                if (typeof matchCard.imageUrl == 'undefined') {
                    await getCardWithImage(cardFound)
                    .then(cardWithImage => {
                        url = cardWithImage.imageUrl;
                    })
                    .catch(result =>{
                        //send error no card with img was found
                        console.log(result);
                        channel.send(`${result} - It's probably broken Joe - see if this crashed the bot - should exit execution`)
                    })
                }

                //console.log("url: ", url)

                const embed = new MessageEmbed()
                embed.setImage(url);
                const embedded_image = await channel.send({embeds: [embed]});

                // const attachment = new MessageAttachment(url);
                // message.channel.send({
                //     files: [attachment],
                //     content_type: 'image/png',
                // });

                // If the card searched is not an exact match, find alternatives
                if (cardname.toLowerCase() != cardFound.toLowerCase()) {
                    let suggested = 5;
                    let mySet = new Set();
                    if (cards.length < 5) {
                        suggested = cards.length;
                    }

                    for (i = 1; i <= suggested; i++){
                        if (cardFound != cards[i].name){
                            mySet.add(cards[i].name);
                        }
                    }

                    emojiset = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
                    const setIterator = mySet.values();
                    var outputString = "Did you mean: \n";
                    for (i=0; i < mySet.size; i++) {
                        outputString = outputString + "> "+(i+1)+". "+setIterator.next().value+"\n";
                        //embedded_image.react(emojiset[i]);
                    }
                    //console.log(outputString);
                    if(mySet.size > 0) {
                        channel.send(outputString);
                    }

                }

                
            }
            catch(err) {
                console.log(err);
            }
        }
        else {
            //console.log("No card was found!")
            channel.send("No card was found!")
        }
        
    })
}