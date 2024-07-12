import ytSearch from 'yt-search';
import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
import axios from 'axios';
const { generateWAMessageFromContent, proto } = pkg;

const searchResultsMap = new Map();
let searchIndex = 1; 

const playcommand = async (m, Matrix) => {
  let selectedListId;
  const selectedButtonId = m?.message?.templateButtonReplyMessage?.selectedId;
  const interactiveResponseMessage = m?.message?.interactiveResponseMessage;

  if (interactiveResponseMessage) {
    const paramsJson = interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson;
    if (paramsJson) {
      const params = JSON.parse(paramsJson);
      selectedListId = params.id;
    }
  }

  const selectedId = selectedListId || selectedButtonId;

  const prefixMatch = m.body.match(/^[\\/!#.]/);
  const prefix = prefixMatch ? prefixMatch[0] : '/';
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';
  const text = m.body.slice(prefix.length + cmd.length).trim();

  const validCommands = ['play'];

  if (validCommands.includes(cmd)) {
    if (!text) {
      return m.reply('Please provide a search query.');
    }

    try {
      await m.React("🕘");

      const searchResults = await ytSearch(text);
      const videos = searchResults.videos.slice(0, 5); 

      if (videos.length === 0) {
        m.reply('No results found.');
        await m.React("❌");
        return;
      }

      videos.forEach((video, index) => {
        const uniqueId = searchIndex + index;
        searchResultsMap.set(uniqueId, video);
      });

      const currentResult = searchResultsMap.get(searchIndex);
      const buttons = [
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎧 Audio",
            id: `media_audio_${searchIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎥 Video",
            id: `media_video_${searchIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎵 Audio Document",
            id: `media_audiodoc_${searchIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎦 Video Document",
            id: `media_videodoc_${searchIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "⏩ Next",
            id: `next_${searchIndex + 1}`
          })
        }
      ];

      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `𝞢𝙏𝞖𝞘𝞦-𝞛𝘿 YouTube Search\n\n*🔍Title:* ${currentResult.title}\n*✍️Author:* ${currentResult.author.name}\n*🥸 Views:* ${currentResult.views}\n*🏮 Duration:* ${currentResult.timestamp}\n`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Powered By 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "",
                gifPlayback: true,
                subtitle: "",
                hasMediaAttachment: false 
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons
              }),
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              }
            }),
          },
        },
      }, {});

      await Matrix.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      });
      await m.React("✅");

      searchIndex += 1; 
    } catch (error) {
      console.error("Error processing your request:", error);
      m.reply('Error processing your request.');
      await m.React("❌");
    }
  } else if (selectedId) { 
    if (selectedId.startsWith('next_')) {
      const nextIndex = parseInt(selectedId.replace('next_', ''));
      const currentResult = searchResultsMap.get(nextIndex);

      if (!currentResult) {
        return m.reply('No more results.');
      }
      const buttons = [
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎧 Audio",
            id: `media_audio_${nextIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎥 Video",
            id: `media_video_${nextIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎵 Audio Document",
            id: `media_audiodoc_${nextIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "🎦 Video Document",
            id: `media_videodoc_${nextIndex}`
          })
        },
        {
          "name": "quick_reply",
          "buttonParamsJson": JSON.stringify({
            display_text: "⏩ Next",
            id: `next_${nextIndex + 1}`
          })
        }
      ];

      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `𝞢𝙏𝞖𝞘𝞦-𝞛𝘿 YouTube Search\n\n*🔍Title:* ${currentResult.title}\n*✍️ Author:* ${currentResult.author.name}\n*🥸 Views:* ${currentResult.views}\n*🏮 Duration:* ${currentResult.timestamp}\n`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Powered By 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "",
                gifPlayback: true,
                subtitle: "",
                hasMediaAttachment: false 
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons
              }),
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
              }
            }),
          },
        },
      }, {});

      await Matrix.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
      });
    } else if (selectedId.startsWith('media_')) {
      const parts = selectedId.split('_');
      const type = parts[1];
      const key = parseInt(parts[2]);
      const selectedMedia = searchResultsMap.get(key);

      if (selectedMedia) {
        try {
          const videoUrl = selectedMedia.url;

          const apiResponse = await axios.get(`https://allinonedl.osc-fr1.scalingo.io/download?url=${videoUrl}`);
          const lowQualityUrl = apiResponse.data.data.low;
          const highQualityUrl = apiResponse.data.data.high;

          let finalMediaBuffer, mimeType, content;
          
          if (type === 'audio' || type === 'audiodoc') {
            finalMediaBuffer = await axios.get(lowQualityUrl, { responseType: 'arraybuffer' });
            mimeType = 'audio/mp3';
          } else {
            finalMediaBuffer = await axios.get(highQualityUrl, { responseType: 'arraybuffer' });
            mimeType = 'video/mp4';
          }

          const fileSizeInMB = finalMediaBuffer.data.length / (1024 * 1024);

          if (type === 'audio' && fileSizeInMB <= 300) {
            content = { audio: finalMediaBuffer.data, mimetype: 'audio/mpeg', caption: 'Downloaded by 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿' };
          } else if (type === 'video' && fileSizeInMB <= 300) {
            content = { video: finalMediaBuffer.data, mimetype: 'video/mp4', caption: 'Downloaded by 𝞢𝙏𝞖𝞘𝞦-𝞛𝘿' };
          } else if (type === 'audiodoc') {
            content = { document: finalMediaBuffer.data, mimetype: 'audio/mp3', fileName: `${selectedMedia.title}.mp3` };
          } else if (type === 'videodoc') {
            content = { document: finalMediaBuffer.data, mimetype: 'video/mp4', fileName: `${selectedMedia.title}.mp4` };
          } else {
            return m.reply('File size is too large to send.');
          }

          await Matrix.sendMessage(m.from, content, { quoted: m });
        } catch (error) {
          console.error('Error processing media download:', error);
          m.reply('Error processing media download.');
        }
      }
    }
  }
};

export default playcommand;
