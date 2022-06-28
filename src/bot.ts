import { config } from 'dotenv'; config();
import { Client, GuildManager, GuildMember, Intents, Message, MessageEmbed, PartialMessage, Role, User } from 'discord.js';
import * as fs from 'fs';
import { db } from './db';
import { Command } from './command';
import { BOT_COLOR, getEmoji } from './common';

export const client: Client = new Client(
    {
        intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES],
        partials: ['USER', 'REACTION', 'MESSAGE']
    }
);

client.on('ready', async e => {
    console.log(`MeouchBot connected!`);
});

db.initialiser.on('complete', async _ => {
    client.login(process.env.MEOUCHBOT_TOKEN).catch(err => {
        console.error(err);
        process.exit()
    });
});

// Facilitate uptime monitors.
import { createServer, IncomingMessage, ServerResponse } from 'http';
const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200);
    res.end('ok');
});
server.listen(3000);

// Fill a commands object with commands accessible
// by key via their command name/prefix.
let commands: Map<string, Command | undefined> = new Map<string, Command>();

// Populate commands map.
const jsFiles: string[] = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
jsFiles.forEach(commandFile => {
    const commandModule = require(`./commands/${commandFile}`);
    if (commandModule.name && commandModule.command)
        commands.set(commandModule.name, commandModule.command);
});

let helpEmbed: MessageEmbed = new MessageEmbed({
    color: BOT_COLOR,
    title: 'MeouchBot - A TWRP-themed reaction roles bot for the Ladyworld Discord server.',
    description: 'Use m/help [command] for more detailed help. Note that this is a reaction roles bot and so has few actual commands.\n',
    fields: [{ name: 'Commands', value: '`' + Array.from(commands.keys()).join('`\n`') + '`', inline: false }]
});

// React to messages.
client.on('messageCreate',
    async function (msg) {
        const prefixedCommand: string = msg.content.split(' ')[0];
        let commandName: string = prefixedCommand.toLowerCase().split('m/')[1];

        // If this is a testing instance
        if (client.user && client.user.username.endsWith('-Testing'))
            commandName = prefixedCommand.toLowerCase().split('mt/')[1];

        // Everything following the first space.
        let args: string = msg.content.split(/ (.*)/s)[1];
        args = (args === undefined) ? '' : args;

        if (commandName === 'help') {
            // No argument - main help.
            if (!args) {
                msg.channel.send({ embeds: [helpEmbed] });
            }
            else {
                const command: Command | undefined = commands.get(args);
                if (command)
                    msg.channel.send({ embeds: [command.help] });
            }

            return;
        }

        const command: Command | undefined = commands.get(commandName);

        // Filter out invalid commands and bot senders.
        if (command && !msg.author.bot) {
            try {
                await command.fn(msg, args);
            }
            catch (errEmbed) {
                if (errEmbed instanceof MessageEmbed)
                    msg.channel.send({ embeds: [errEmbed] });
            }
        }
    });

client.on('messageReactionAdd',
    async function (reaction, user): Promise<void> {
        // May be a PartialMessage, so fetch it to get the missing data.
        const msg: Message | void = await reaction.message.fetch().catch(_ => { return Promise.resolve(); });
        if (!msg || !msg.guild || !user) return Promise.resolve();
        const member: GuildMember | undefined = await msg.guild.members.cache.get(user.id);
        if (!member) return Promise.resolve();


        let roleMenuOption = await db.get(`SELECT guild_id, msg_id, emoji, role_id FROM reactionroles` +
            ` WHERE guild_id = '${msg.guildId}' AND msg_id = '${msg.id}' AND emoji = '${reaction.emoji.toString()}'`)
            .catch(_ => { return Promise.resolve(); });

        if (roleMenuOption) {
            // This is a reaction role, so attempt to give the user the role if they don't already have it.
            if (!member.roles.cache.has(roleMenuOption.role_id) && !member.user.bot) {
                let role: Role | undefined = msg.guild.roles.cache.get(roleMenuOption.role_id);
                if (role) {
                    await member.roles.add(role.id)
                        .catch(_ => { console.log(`Failed to add role to user ${msg.author.id}.`); return Promise.resolve(); });
                }
            }
        }
    });

client.on('messageReactionRemove',
    async function (reaction, user): Promise<void> {
        // May be a PartialMessage, so fetch it to get the missing data.
        const msg: Message | void = await reaction.message.fetch().catch(_ => { return Promise.resolve(); });
        if (!msg || !msg.guild || !user) return Promise.resolve();
        const member: GuildMember | undefined = await msg.guild.members.cache.get(user.id);
        if (!member) return Promise.resolve();


        let roleMenuOption = await db.get(`SELECT guild_id, msg_id, emoji, role_id FROM reactionroles` +
            ` WHERE guild_id = '${msg.guildId}' AND msg_id = '${msg.id}' AND emoji = '${reaction.emoji.toString()}'`)
            .catch(_ => { return Promise.resolve(); });

        if (roleMenuOption) {
            // This is a reaction role, so attempt to remove the role from the user if they have it.
            if (member.roles.cache.has(roleMenuOption.role_id) && !member.user.bot) {
                let role: Role | undefined = msg.guild.roles.cache.get(roleMenuOption.role_id);
                if (role) {
                    await member.roles.remove(role.id)
                        .catch(_ => { console.log(`Failed to add role to user ${msg.author.id}.`); return Promise.resolve(); });
                }
            }
        }
    });
