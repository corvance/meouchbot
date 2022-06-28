import { Command } from '../command'
import { Message, MessageEmbed, MessageReaction, Role } from "discord.js";
import { BOT_COLOR, ERROR_EMBED, getEmoji } from '../common';
import { db } from '../db';

module.exports = {
    name: "rolemenu",
    command: new Command(rolemenu, new MessageEmbed({
        color: BOT_COLOR,
        title: 'rolemenu',
        description: 'If the user is an admin, creates a reaction roles menu in the same channel.',
        fields: [
            { name: 'message', value: 'The message to use as the title of the embed.'},
            { name: 'role_ids', value: 'A list of role IDs for the roles to be given.'},
            { name: 'emojis', value: 'A list of emojis (default emojis like 1️⃣ or the ID for custom ones) to use as the reactions.'},
            { name: 'Examples', value: '```bash\nm/rolemenu "React to this to get a role" ["727243849621176330", "727244844736577706"] ["1️⃣", "2️⃣"]\n'
             + 'm/rolemenu "Pick your favourite EP role!" ["727243849621176330", "727244844736577706"] ["730733122768994305", "730732529044291624"]\n```'}
        ]
    }))
}

async function rolemenu(msg: Message, args: string): Promise<void> {
    // Split on all spaces except within "", '' and [].
    let regex: RegExp = /(?:(["'])(\\.|(?!\1)[^\\])*\1|\[(?:(["'])(\\.|(?!\2)[^\\])*\2|[^\]])*\]|\((?:(["'])(\\.|(?!\3)[^\\])*\3|[^)])*\)|[^\s])+/g;
    let parsedArgs: RegExpMatchArray | null = args.match(regex);

    if (!parsedArgs || parsedArgs.length < 3)
        return Promise.reject(ERROR_EMBED.setDescription('❌ Missing arguments!'));
    if (parsedArgs.length > 3)
        return Promise.reject(ERROR_EMBED.setDescription('❌ Too many arguments!'));

    if (parsedArgs[0].charAt(0) !== '"' || parsedArgs[0].charAt(parsedArgs[0].length - 1) !== '"')
        return Promise.reject(ERROR_EMBED.setDescription('❌ Invalid message! Please make the first argument a message enclosed in "".'));

    let message: string = parsedArgs[0].substring(1, parsedArgs[0].length - 1);

    // Attempt to parse arrays.
    let roleIds: string[] = JSON.parse(parsedArgs[1]);
    let emojis: string[] = JSON.parse(parsedArgs[2]);

    if (emojis.length !== roleIds.length)
        return Promise.reject(ERROR_EMBED.setDescription('❌ You must give the same number of emojis and role IDs!'));

    if (!msg.guild)
        return Promise.reject(ERROR_EMBED.setDescription('❌ Unknown Guild error!'));

    let description: string = '';

    for (let i = 0; i < emojis.length; i++) {
        let role: Role | undefined = msg.guild.roles.cache.get(roleIds[i]);

        if (role)
            description += `${getEmoji(msg.client, emojis[i])} ${role.name}\n`;
    }

    let roleMenu: MessageEmbed = new MessageEmbed({
        title: message,
        description: description,
        color: BOT_COLOR
    });

    let sent: Message = await msg.channel.send({ embeds: [roleMenu] })
        .catch(_ => { return Promise.reject(ERROR_EMBED.setDescription('❌ Failed to send role menu embed!')); });

    try {
        for (let i = 0; i < emojis.length; i++) {
            let reaction: MessageReaction = await sent.react(getEmoji(msg.client, emojis[i]));
            await db.run(`INSERT INTO reactionroles VALUES ('${sent.guildId}','${sent.id}','${reaction.emoji.toString()}','${roleIds[i]}')`);
        }
    }
    catch {

    }
}