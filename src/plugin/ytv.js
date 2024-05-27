import ytdl from 'ytdl-core';
import pkg, { prepareWAMessageMedia } from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, proto } = pkg;

// Global map to store video details
const videoMap = new Map();
let videoIndex = 1; // Global index for video links

const song = async (m, Matrix) => {
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
  
  const validCommands = ['ytv'];

  if (validCommands.includes(cmd)) {
    if (!text || !ytdl.validateURL(text)) {
      return m.reply('Please provide a valid YouTube URL.');
    }

    try {
      await m.React("🕘");

      // Get video info
      const info = await ytdl.getInfo(text);
      const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

      if (formats.length === 0) {
        m.reply('No downloadable formats found.');
        await m.React("❌");
        return;
      }

      const qualityButtons = formats.map((format, index) => {
        const uniqueId = videoIndex + index;
        videoMap.set(uniqueId, { ...format, videoId: info.videoDetails.videoId });
        return {
          "header": "",
          "title": `${format.qualityLabel} (${format.container})`,
          "description": ``,
          "id": `quality_${uniqueId}` 
        };
      });

      const msg = generateWAMessageFromContent(m.from, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: `Ethix-MD Video Downloader\n\n🔍 Select the desired quality to download the video.\n\n📌 Simply select a quality from the list below to get started.\n\n`
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "© Powered By Ethix-MD"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                ...(await prepareWAMessageMedia({ image: { url: info.videoDetails.thumbnails[0].url } }, { upload: Matrix.waUploadToServer })),
                title: info.videoDetails.title,
                gifPlayback: true,
                subtitle: "",
                hasMediaAttachment: false 
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                      title: "🎬 Select a video quality",
                      sections: [
                        {
                          title: "Available Qualities",
                          highlight_label: "💡 Choose Quality",
                          rows: qualityButtons
                        },
                      ]
                    })
                  },
                ],
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

      videoIndex += formats.length;
    } catch (error) {
      console.error("Error processing your request:", error);
      m.reply('Error processing your request.');
      await m.React("❌");
    }
  } else if (selectedId) { 
    const key = parseInt(selectedId.replace('quality_', ''));
    const selectedFormat = videoMap.get(key); 

    if (selectedFormat) {
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${selectedFormat.videoId}`;
        const videoStream = ytdl(videoUrl, { format: selectedFormat });
        const finalVideoBuffer = await streamToBuffer(videoStream);

        await Matrix.sendMessage(m.from, { video: finalVideoBuffer, mimetype: 'video/mp4', caption: `Title: ${selectedFormat.title}\nQuality: ${selectedFormat.qualityLabel}\n\n> Powered by Ethix-MD` }, { quoted: m });
      } catch (error) {
        console.error("Error fetching video details:", error);
        m.reply('Error fetching video details.');
      }
    } else {
    }
  }
};

const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

export default song;
