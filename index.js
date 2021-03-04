require("dotenv").config();
const { TOKEN, PREFIX, GUILD_ID, ROLE_ID, CHANNEL_ID } = process.env;

const prefix = PREFIX || "?";
const guild_id = GUILD_ID || "810730466171813908";
const verified_role_id = ROLE_ID || "816901542841155615";
const verification_channel_id = CHANNEL_ID || "816903561912385536";

const fs = require("fs");
const Discord = require("discord.js");
const client = new Discord.Client();
let roleName = "";

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  await client.user.setActivity("Verify in #verification");
  roleName = client.guilds.get(guild_id).roles.get(verified_role_id).name;
});

client.on("message", msg => {
  const args = msg.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);

  const command = args.shift().toLowerCase();

  // svm = set verification message
  if (
    !msg.author.bot &&
    msg.content.indexOf(prefix) === 0 &&
    command === "svm"
  ) {
    // If sender of message is not the guild owner, cancel action
    if (msg.member.guild.ownerID !== msg.member.id) return;

    const introMessageContent = fs.readFileSync("intro-message.md", {
      encoding: "utf8",
      flag: "r"
    });
    const communityGuidelinesContent = fs.readFileSync(
      "community-guidelines.md",
      { encoding: "utf8", flag: "r" }
    );
    const verificationMessageContent = fs.readFileSync(
      "verification-message.md",
      { encoding: "utf8", flag: "r" }
    );

    const embed = new Discord.RichEmbed();

    const welcomeTitle = `Welcome to ${msg.guild.name}!`;

    embed.addField(welcomeTitle, introMessageContent);
    embed.addField("🎗 Community Guidelines", communityGuidelinesContent);
    embed.addField("🔐 Getting Verified", verificationMessageContent);

    msg.channel.send({ embed }).then(message => {
      message.react("👍");
      fs.writeFileSync(
        "data.json",
        JSON.stringify({ messageId: message.id }, null, 4)
      );
    });
    msg.delete();
  }

  return;
});

client.on("messageReactionAdd", ({ message: { channel } }, user) => {
  if (/verification/.test(channel.name)) {
    channel.guild
      .fetchMember(user)
      .then(member => {
        member
          .addRole(verified_role_id)
          .then(() => {
            console.log(
              `The ${roleName} has been removed from member ${user.tag} successfully!`
            );
          })
          .catch(e => console.error("Error adding role"));
      })
      .catch(error => {
        console.error(error);
      });
  }
});

client.on("messageReactionRemove", ({ message: { channel } }, user) => {
  if (/verification/.test(channel.name)) {
    channel.guild
      .fetchMember(user)
      .then(member => {
        member
          .removeRole(verified_role_id)
          .then(() => {
            console.log(
              `The ${roleName} has been removed from member ${user.tag} successfully!`
            );
          })
          .catch(e => console.error("Error removing role"));
      })
      .catch(error => {
        console.error(error);
      });
  }
});

client.on("raw", ({ d: data, t: event }) => {
  if (["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(event)) {
    const { channel_id, user_id, message_id, emoji } = data;

    const channel = client.channels.get(channel_id);

    if (!channel.messages.has(message_id))
      channel.fetchMessage(message_id).then(message => {
        const reaction = message.reactions.get(
          emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name
        );

        const user = client.users.get(user_id);

        if (reaction) reaction.users.set(user_id, user);

        return client.emit(
          event === "MESSAGE_REACTION_ADD"
            ? "messageReactionAdd"
            : "messageReactionRemove",
          reaction,
          user
        );
      });
  }
});

client.on("guildMemberRemove", function(member) {
  try {
    const { messageId } = JSON.parse(fs.readFileSync("data.json"));
    const channel = client.channels.get(verification_channel_id);
    channel
      .fetchMessage(messageId)
      .then(message => {
        message.reactions.map(reaction => {
          reaction.remove(member.user.id);
        });
      })
      .catch(console.error);
  } catch (e) {
    console.error(
      `data.json doesn't exist. Re-run ${prefix}svm in the #verification channel and delete the previous message.`
    );
  }
});


  client.login(process.env.Verification);