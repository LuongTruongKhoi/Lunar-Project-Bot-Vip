const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports.config = {
  name: "appstore",
  version: "1.0.1",
  usePrefix: false,
  hasPermssion: 0,
  credits: "tiến",
  description: "Tìm kiếm và xem thông tin ứng dụng trên App Store",
  commandCategory: "Tiện ích",
  usages: "[tên ứng dụng]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  if (args.length === 0) {
    api.sendMessage("Vui lòng nhập tên ứng dụng cần tìm.", event.threadID, event.messageID);
    return;
  }

  const appName = args.join(" ");
  const encodedAppName = encodeURIComponent(appName);

  try {
    const response = await axios.get(`https://itunes.apple.com/search?term=${encodedAppName}&entity=software`);
    const apps = response.data.results;

    if (apps.length > 0) {
      const attachments = [];
      const searchResults = apps.slice(0, 5).map((app, index) => {
        return `${index + 1}. ${app.trackName} - ${app.artistName}`;
      }).join("\n");

      for (let i = 0; i < apps.slice(0, 5).length; i++) {
        const imageUrl = apps[i].artworkUrl512; // Sử dụng URL có độ phân giải cao hơn
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imagePath = path.join(__dirname, `appstore_image_${i}.jpg`);
        await sharp(imageResponse.data)
          .resize(800)
          .sharpen()
          .toFile(imagePath);
        attachments.push(fs.createReadStream(imagePath));
      }

      api.sendMessage({
        body: `Tìm thấy ${apps.length} ứng dụng:\n\n${searchResults}\n\nHãy nhập số để chọn ứng dụng bạn muốn xem thông tin.`,
        attachment: attachments
      }, event.threadID, (error, info) => {
        for (let i = 0; i < attachments.length; i++) {
          fs.unlinkSync(path.join(__dirname, `appstore_image_${i}.jpg`));
        }
        global.client.handleReply.push({
          type: "chooseApp",
          name: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          apps: apps.slice(0, 5)
        });
      }, event.messageID);

    } else {
      api.sendMessage("Không tìm thấy ứng dụng nào với tên bạn cung cấp.", event.threadID, event.messageID);
    }
  } catch (error) {
    api.sendMessage("Đã xảy ra lỗi khi tìm kiếm ứng dụng.", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { author, apps } = handleReply;

  if (event.senderID !== author) return;

  const choice = parseInt(event.body);
  if (isNaN(choice) || choice < 1 || choice > apps.length) {
    api.sendMessage("Lựa chọn không hợp lệ. Vui lòng thử lại.", event.threadID, event.messageID);
    return;
  }

  const appInfo = apps[choice - 1];
  const price = appInfo.formattedPrice || "Miễn phí";

  const message = `
Tên ứng dụng: ${appInfo.trackName}
Nhà phát triển: ${appInfo.artistName}
Giá: ${price}
Điểm đánh giá: ${appInfo.averageUserRating ? appInfo.averageUserRating : "Chưa có đánh giá"}
Số lượt đánh giá: ${appInfo.userRatingCount ? appInfo.userRatingCount : "Chưa có"}
Mô tả ngắn: ${appInfo.description.substring(0, 200)}...
Link: ${appInfo.trackViewUrl}
  `;

  const imageUrl = appInfo.artworkUrl512;
  const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const imagePath = path.join(__dirname, 'selected_app_image.jpg');

  await sharp(imageResponse.data)
    .resize(800)
    .sharpen()
    .toFile(imagePath);

  api.sendMessage({
    body: message,
    attachment: fs.createReadStream(imagePath)
  }, event.threadID, () => {
    fs.unlinkSync(imagePath); 
  }, event.messageID);
};
