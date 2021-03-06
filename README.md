# MeouchBot

MeouchBot is a TWRP-themed reaction roles bot created for the [Ladyworld Discord server](https://discord.gg/NZGZJ2C), originally to replace existing 3rd party bots that began working with NFTs, cryptocurrency and other blockchain technology. TWRP is a Canadian band most recongisable for their costumed personas, concealing their real identities. You should check them out!

## Features

- Reaction role menus setup by admins.

## Roadmap

- Nothing more yet.

## Usage

To run the bot, install the dependencies, compile the TypeScript to JavaScript with `tsc`, enter the `dist` directory and run `node bot.js` with the environment MEOUCHBOT_TOKEN set to your bot token.

```bash
git clone https://www.github.com/corvance/meouchbot
cd meouchbot

npm i --save-dev typescript dotenv discord.js sqlite3 @types/sqlite3

export MEOUCHBOT_TOKEN=1234567890_abcdefghijklmnopqrstuvwxyz.ABCDEFGHIJKLMNOPQRSTUVWXYZ_12345
npm run compile && npm run start
```

You can run a testing instance of the bot using a Discord application bot with a username ending in '-Testing', changing the prefix from m/ to mt/.
Before using, you MUST create a database file `db.sqlite3` in the top level directory (adjacent to the `dist` directory). For it to work in your server,
you must add it to the `guilds` table.

## Dependencies

- `discord.js` - The Discord bot development library.
- `dotenv` - For loading the bot token from .env files in local development.
- `sqlite3` - For the starred messages database.

## License

This repository is subject to the terms of the MIT License, available at the LICENSE file in the root directory.
