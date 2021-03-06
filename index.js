/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
const fetch = (...args) => import('node-fetch')
	.then(({default: fetch}) => fetch(...args));
const Discord = require('discord.js'); // Start
require('dotenv').config();

const config = {
	token: process.env.TOKEN,
	prefix: process.env.PREFIX,
	url: process.env.URL,
};

const bot = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
	],
});

const Bot = async () => {
	bot.login(config.token);
	bot.on('ready', messageCreate => {
		console.log('✔️  Bot foi iniciado');
		return messageCreate;
	});

	function sleep(ms) {
		return new Promise(
			resolve => setTimeout(resolve, ms),
		);
	}

	async function request(data) {
		const players = [];
		for (let i = 0; i < data.length; i += 1) {
			if (data[i].matches < 10) {
				players.push(data[i].account_id);
			}
		}

		for (let n = 0; n < players.length; n += 1) {
			console.log(`${n + 1}/${players.length}`);
			console.log('Busca:', new Date().toLocaleTimeString('pt-BR', {timeZone: 'America/Sao_Paulo'}));
			await sleep(1 * 60 * 60 * 1000);
			const send = players[n];
			const result = await fetch(`${config.url}/api/auto/${send}`);
			console.log('result', result);
		}
	}

	let dataRanking = [];
	async function pull() {
		console.log('start Pull');
		const {data} = await fetch(`${config.url}/api/bot/0/10`).then(data => data.json());
		if (data) {
			dataRanking = await data;
		}
		
		const auto = await fetch(`${config.url}/api/bot/1/1`).then(data => data.json());
		if (auto) {
			request(auto.data);
		}
	}

	await pull();
	setInterval(pull, 24 *  60 * 60 * 1000);

	bot.on('messageCreate', async messageCreate => {
		if (messageCreate.author.bot) {
			return;
		}

		if (messageCreate.channel.type === 'dm') {
			return;
		}

		if (!messageCreate.content.startsWith(config.prefix)) {
			return;
		}

		const args = messageCreate.content.slice(config.prefix.length).trim().split(/ +/g);
		const [comando, info] = args.shift().toLowerCase().split('=');

		// Comando ping
		if (comando === 'hello' || comando === 'h') {
			await messageCreate.channel.send('Hello world!');
		} else if (comando === 'help' || comando === '?') {
			await messageCreate.channel.send(`\n
      Commands:
      !p => Verifica seu ping
      !r=account_id => Verifica seu ranked e seu status médio
      !help => Mostra os comandos disponíveis     
      `);
		} else if (comando === 'r') {
			if (dataRanking) {
				const [playerData] = dataRanking.filter(x => Number(x.account_id) === Number(info));

				if (playerData) {
					const img = `${playerData.avatarfull.slice(0, playerData.avatarfull.length - 9)}_medium.jpg`;
					await messageCreate.channel.send({
						files: [img],
					});
					await messageCreate.channel.send(
						`Aqui esta  ${playerData.personaname}:
          ➡️ Position: ${playerData.id} de ${dataRanking.length} in the world!
          Rating : ${playerData.ranking.toLocaleString('pt-BR')}  
          Kill/Deaths/Assists = ${playerData.kills}/${playerData.deaths}/${playerData.assists}
          Last/Denies = ${playerData.last_hits}/${playerData.denies}
          GPM = ${playerData.gold_per_min.toLocaleString('pt-BR')}
          XPM = ${playerData.xp_per_min.toLocaleString('pt-BR')}
          Hero damage = ${playerData.hero_damage.toLocaleString('pt-BR')}
          Tower damage = ${playerData.tower_damage.toLocaleString('pt-BR')}
          Hero healing = ${playerData.hero_healing.toLocaleString('pt-BR')}   
          Win/Matches = ${playerData.win}/${Number(playerData.matches)}
          Win rate = ${playerData.winRate}%

          veja o ranking completo: https://dota-try-hard.vercel.app/ranking
          `,
					);
				} else {
					await messageCreate.channel.send(`
          Infelizmente você não esta no ranking
          busque no site: https://dota-try-hard.vercel.app/add
          `);
				}
			} else {
				await messageCreate.channel.send('Desculpe! DataBase esta offline');
				pull();
			}
		}
	});
};

Bot();
