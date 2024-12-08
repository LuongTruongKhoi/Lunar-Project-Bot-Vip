const fs = require('fs');
const path = require('path');
const axios = require('axios');

module.exports.config = {
  name: "api",
  version: "2.2.3",
  hasPermssion: 2,
  credits: "",
  description: "Tải link/quản lý link ảnh/video/nhạc ở kho lưu trữ API",
  commandCategory: "Admin",
  usages: "",
  usePrefix: false, 
  cooldowns: 5,
  images: [
    "https://i.imgur.com/4YizjdD.png",
    "",
  ],
};

module.exports.run = async function ({ api, event, Users, args }) {
  try {
    if (event.senderID != 61565397262958) return api.sendMessage('Xin lỗi! lệnh này chỉ admin mới dùng được', event.threadID, event.messageID);
    const projectHome = path.resolve('./');
    const srcapi = path.join(projectHome, 'data_api/datajson');
    global.srcapi = srcapi;

    switch (args[0]) {
      case 'cre': {
        if (args.length === 1) {
          api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
          return;
        }

        const fileName = args[1];
        const filePath = path.join(srcapi, `${fileName}.json`);

        if (fs.existsSync(filePath)) {
          api.sendMessage(`⚠️ File ${fileName}.json đã tồn tại!`, event.threadID, event.messageID);
        } else {
          fs.writeFileSync(filePath, '[]', 'utf-8');
          api.sendMessage(`✅ Tạo file ${fileName}.json thành công!`, event.threadID, event.messageID);
        }
        break;
      }

      case 'add': {
        if (args.length === 1) {
          api.sendMessage("⚠️ Vui lòng nhập tên tệp", event.threadID, event.messageID);
          return;
        }

        const tip = args[1];
        const dataPath = path.join(srcapi, `${tip}.json`);
        if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '[]', 'utf-8');
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

        let successCount = 0;
        let failureCount = 0;

        for (const attachment of event.messageReply.attachments) {
          try {
            const response = await axios.get(`https://catbox-mnib.onrender.com/upload?url=${encodeURIComponent(attachment.url)}`);
            if (Array.isArray(response.data)) {
              data.push(...response.data.map(linkObj => linkObj.url));
              successCount += response.data.length;
            } else {
              data.push(response.data.url);
              successCount++;
            }
          } catch (error) {
            failureCount++;
          }
        }

        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
        api.sendMessage(`[  PUBLISH DATA IN SCR API  ]\n────────────────────\n✅ Tải lên thành công: ${successCount}\n❎ Tải lên thất bại: ${failureCount}\n📂File JSON: ${tip}`, event.threadID, event.messageID);
        break;
      }

      case 'check': {
        const files = fs.readdirSync(srcapi);
        let fileIndex = 1;
        let totalLinks = 0;

        const results = [];

        for (const file of files) {
          const filePath = path.join(srcapi, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const linksArray = JSON.parse(fileContent);

          totalLinks += linksArray.length;
          results.push(`${fileIndex}. ${file} - tổng ${linksArray.length} link`);
          fileIndex++;
        }

        const messageToSend = `[ Danh Sách API Hiện Có ]\n──────────────────\n${results.join('\n')}\n\n──────────────────\n|› 📝 Tổng tất cả link: ${totalLinks}\n\n|› 📌 Reply (phản hồi) STT để check link status\n|› 🗑️ Reply (phản hồi) del + STT để xóa file tương ứng\n|› ✏️ Reply (phản hồi) rename + STT + tên mới để đổi tên file tương ứng\n|› 📎 Reply (phản hồi) delline + STT + số lượng để xoá số lượng API gần đây nhất\n`;

        api.sendMessage(messageToSend, event.threadID, (error, info) => {
          if (!error) {
            global.client.handleReply.push({
              type: "choosee",
              name: module.exports.config.name,
              author: info.senderID,
              messageID: info.messageID,
              dataaa: files,
            });
          }
        });
        break;
      }

      case 'ship': {
        const { messageReply, type } = event;

        let name = args[1];
        const apiName = args.slice(1).join(' ');

        let text, uid;
        if (type === "message_reply") {
          text = messageReply.body;
          uid = messageReply.senderID;
        } else {
          uid = event.senderID;
        }

        if (!text && !name) {
          return api.sendMessage(`📝 Vui Lòng Nhập Tên API Muốn Share`, event.threadID, event.messageID);
        }

        if (type !== "message_reply" && !name) {
          return api.sendMessage(`📝 Vui Lòng Reply Người Muốn Share`, event.threadID, event.messageID);
        }

        fs.readFile(`./api-phglnh/api/${apiName}.json`, "utf-8", async (err, data) => {
          if (err) {
            return api.sendMessage(`🔎 Rất Tiếc API ${apiName} Mà Bạn Cần Hiện Không Có Trên Hệ Thống ${global.config.BOTNAME}`, event.threadID, event.messageID);
          }

          try {
            const response = await axios.post("https://api.mocky.io/api/mock", {
              status: 200,
              content: data,
              content_type: "application/json",
              charset: "UTF-8",
              secret: "HungCTer",
              expiration: "never"
            });

            const link = response.data.link;
            const use = await Users.getNameUser(uid);
            api.sendMessage(`☑️ Đã gửi API ${apiName}\n👤 ${use} Vui Lòng Check Tin Nhắn Riêng Hoặc Spam Để Nhận API`, event.threadID, event.messageID);
            api.sendMessage(`📝 Bạn Được Admin Share Riêng 1 API\n🔰 Tên API: ${apiName}\n🔗 Link: ${link}\n`, uid);
          } catch (error) {
            console.log(error);
            api.sendMessage(`⚠️ Lỗi: ${error.message}`, event.threadID, event.messageID);
          }
        });

        break;
      }

      default:
        api.sendMessage({
          body: ``,
          attachment: (await axios.get(`https://i.imgur.com/zfnc29s.png`, { responseType: 'stream' })).data
        }, event.threadID, event.messageID);
    }
  } catch (error) {
    console.log(error);
    api.sendMessage(`❎ Đã xảy ra lỗi trong quá trình thực hiện lệnh: ${error}`, event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
  const { threadID: tid, messageID: mid, body } = event;
  const args = body.split(" ");

  switch (handleReply.type) {
    case 'choosee':
      const choose = parseInt(args[0]);
      api.unsendMessage(handleReply.messageID);

      if (!isNaN(choose) && args.length === 1) {
        const selectedFile = handleReply.dataaa[choose - 1];

        if (!selectedFile) {
          return api.sendMessage('❎ Lựa chọn không nằm trong danh sách!', tid, mid);
        }
        const filePath = path.join(global.srcapi, selectedFile);

        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const linksArray = JSON.parse(fileContent);

          let liveCount = 0;
          let deadCount = 0;

          const chunkSize = 10;
          const linkChunks = [];
          for (let i = 0; i < linksArray.length; i += chunkSize) {
            linkChunks.push(linksArray.slice(i, i + chunkSize));
          }

          const checkLinkPromises = linkChunks.map(async chunk => {
            await Promise.all(chunk.map(async link => {
              try {
                const response = await axios.head(link);
                if (response.status === 200) {
                  liveCount++;
                } else {
                  deadCount++;
                }
              } catch (error) {
                deadCount++;
              }
            }));
          });

          await Promise.all(checkLinkPromises);

          if (deadCount === 0) {
            return api.sendMessage(`✅ File ${selectedFile} không có liên kết nào die!`, tid, mid);
          }

          api.sendMessage(`|› 🗂️ Name file: ${selectedFile}\n|› 📝 Total: ${linksArray.length}\n|› ✅ Live: ${liveCount}\n|› ❎ Die: ${deadCount}\n\n──────────────────\n|› 📌 Thả cảm xúc '👍' để lọc link die\n|› ✏️ Lưu ý, trong quá trình lọc vẫn sẽ có sự khác biệt về số lượng link die so với khi check`, tid, async (error, info) => {
            if (!error) {
              global.client.handleReaction.push({
                name: module.exports.config.name,
                messageID: info.messageID,
                author: event.senderID,
                selectedFile: selectedFile
              });
            }
          });
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi trong quá trình kiểm tra file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'del' && !isNaN(parseInt(args[1]))) {
        try {
          const selectedFileIndex = parseInt(args[1]) - 1;
          const files = handleReply.dataaa;

          if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }

          const selectedFile = files[selectedFileIndex];
          const filePath = path.join(global.srcapi, selectedFile);
          fs.unlinkSync(filePath);
          api.sendMessage(`✅ Đã xóa file ${selectedFile} thành công!`, tid, mid);
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi xóa file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'rename' && !isNaN(parseInt(args[1])) && args.length === 3) {
        try {
          const selectedFileIndex = parseInt(args[1]) - 1;
          const newFileName = args[2];
          const files = handleReply.dataaa;

          if (selectedFileIndex < 0 || selectedFileIndex >= files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }

          const selectedFile = files[selectedFileIndex];
          const oldFilePath = path.join(global.srcapi, selectedFile);
          const newFilePath = path.join(global.srcapi, `${newFileName}.json`);

          if (fs.existsSync(newFilePath)) {
            return api.sendMessage(`❎ File ${newFileName}.json đã tồn tại!`, tid, mid);
          }

          fs.renameSync(oldFilePath, newFilePath);
          api.sendMessage(`✅ Đổi tên file ${selectedFile} thành ${newFileName}.json thành công!`, tid, mid);
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi đổi tên file: ${error}`, tid, mid);
        }
      } else if (args[0] === 'delline' && !isNaN(parseInt(args[1])) && !isNaN(parseInt(args[2]))) {
        try {
          const fileIndex = parseInt(args[1]);
          const numLinesToDelete = parseInt(args[2]);
          const files = handleReply.dataaa;

          if (fileIndex < 1 || fileIndex > files.length) {
            return api.sendMessage('❎ Lựa chọn không hợp lệ', tid, mid);
          }

          const selectedFile = files[fileIndex - 1];
          const filePath = path.join(global.srcapi, selectedFile);

          const fileContent = fs.readFileSync(filePath, 'utf8');
          const linksArray = JSON.parse(fileContent);

          if (linksArray.length === 0) {
            return api.sendMessage(`❎ File ${selectedFile} không có API nào để xóa!`, tid, mid);
          }

          const newLength = Math.max(0, linksArray.length - numLinesToDelete);
          const newLinksArray = linksArray.slice(0, newLength);

          fs.writeFileSync(filePath, JSON.stringify(newLinksArray, null, 2), 'utf-8');
          api.sendMessage(`✅ Đã xóa ${numLinesToDelete} API mới nhất trong file ${selectedFile} thành công!`, tid, mid);
        } catch (error) {
          console.log(error);
          api.sendMessage(`❎ Đã xảy ra lỗi khi xóa API: ${error}`, tid, mid);
        }
      } else {
        api.sendMessage("❎ Bạn không phải người dùng lệnh, vui lòng không thực hiện hành động này", tid, mid);
      }
      break;
  }
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
  const { messageID, selectedFile } = handleReaction;
  const { threadID } = event;

  if (event.reaction == '👍') {
    try {
      api.unsendMessage(handleReaction.messageID);

      const filePath = path.join(global.srcapi, selectedFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const linksArray = JSON.parse(fileContent);

      let liveLinks = [];
      let deadLinks = [];

      const chunkSize = 10;
      const linkChunks = [];
      for (let i = 0; i < linksArray.length; i += chunkSize) {
        linkChunks.push(linksArray.slice(i, i + chunkSize));
      }

      const checkLinkPromises = linkChunks.map(async chunk => {
        await Promise.all(chunk.map(async link => {
          try {
            const response = await axios.head(link);
            if (response.status === 200) {
              liveLinks.push(link);
            } else {
              deadLinks.push(link);
            }
          } catch (error) {
            deadLinks.push(link);
          }
        }));
      });

      await Promise.all(checkLinkPromises);

      fs.writeFileSync(filePath, JSON.stringify(liveLinks, null, 2), 'utf-8');

      api.sendMessage(`✅ Đã lọc thành công ${deadLinks.length} link die từ file ${selectedFile}`, threadID, messageID);
    } catch (error) {
      console.log(error);
    }
  }
};
