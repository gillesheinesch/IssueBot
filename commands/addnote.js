const Discord = require('discord.js');
const settings = require('./../settings.json');

exports.run = async (client, msg, args) => {
	const input = args.slice(0, 1);
	const botconfs = await client.botSettings.findOne({ botconfs: 'botconfs' });

	if (!input || input.length === 0) return msg.delete() && msg.reply('You forgot to specify the report ID!').then(m => m.delete(10000));
	if (isNaN(input)) return msg.delete() && msg.reply('You have to enter a Report ID').then(m => m.delete(10000));
	if (args.slice(1).length === 0) return msg.delete() && msg.reply('You forgot to add a note!').then(m => m.delete(10000));
	if (msg.attachments.size !== 0) return msg.delete() && msg.reply('You are not allowed to add screenshots to an approve!').then(m => m.delete(10000));
	if (!botconfs.settings.issues.hasOwnProperty(input.join(' '))) return msg.delete() && msg.reply('This issue does not exist!').then(m => m.delete(10000));

	const issueconfs = botconfs.settings.issues[args.slice(0, 1).join(' ')];

	if (issueconfs.notes.hasOwnProperty(msg.author.id)) return msg.delete() && msg.reply('You have already added a note this report').then(m => m.delete(10000));

	issueconfs.notes[msg.author.id] = args.slice(1).join(' ');
	await client.botSettings.updateOne({ botconfs: 'botconfs' }, { $set: { settings: botconfs.settings } });

	if (msg.channel.id === settings.processingBugreportsChannel) {
		let fetchedmessage;
		try {
			fetchedmessage = await client.channels.get(settings.processingBugreportsChannel).fetchMessage(issueconfs.messageid);
		} catch (error) {
			msg.reply('This bugreport doesn\'t exist anymore').then(m => m.delete(10000));
		}

		if ((Object.keys(issueconfs.deny).length + Object.keys(issueconfs.approve).length + Object.keys(issueconfs.attachments).length + Object.keys(issueconfs.notes).length - 1) === 0) {
			const newField = `📝 **${msg.author.username}:** ${args.slice(1).join(' ')}`;
			const bugreportEmbed = new Discord.RichEmbed()
				.setTitle(fetchedmessage.embeds[0].title)
				.setDescription(fetchedmessage.embeds[0].description)
				.setColor('BLUE');

			for (let i = 0; i < fetchedmessage.embeds[0].fields.length; i++) {
				bugreportEmbed.addField(fetchedmessage.embeds[0].fields[i].name, fetchedmessage.embeds[0].fields[i].value);
			}

			bugreportEmbed.addField(`Comments:`, newField);

			await fetchedmessage.edit({
				embed: bugreportEmbed
			});
		} else {
			const newField = `📝 **${msg.author.username}:** ${args.slice(1).join(' ')}`;
			const bugreportEmbed = new Discord.RichEmbed()
				.setTitle(fetchedmessage.embeds[0].title)
				.setDescription(fetchedmessage.embeds[0].description)
				.setColor('BLUE');

			for (let i = 0; i < fetchedmessage.embeds[0].fields.length; i++) {
				if (fetchedmessage.embeds[0].fields[i].name === 'Comments:') {
					bugreportEmbed.addField(fetchedmessage.embeds[0].fields[i].name, `${fetchedmessage.embeds[0].fields[i].value} \n${newField}`);
				} else {
					bugreportEmbed.addField(fetchedmessage.embeds[0].fields[i].name, fetchedmessage.embeds[0].fields[i].value);
				}
			}

			await fetchedmessage.edit({
				embed: bugreportEmbed
			});
		}
		msg.delete();
		msg.reply('The note was added successfully to the report!').then(m => m.delete(10000));
	}
};

exports.conf = {
	enabled: true,
	guildOnly: true,
	aliases: [],
	userpermissions: []
};

exports.help = {
	name: 'addnote',
	description: 'You can submit a new bugreport by using this command',
	usage: 'bugreport {title of the bugreport} | {description}',
	example: ['bugreport ping command bug | There is just written ping but not how many ms this message needed to send'],
	category: 'trello',
	botpermissions: ['SEND_MESSAGES']
};