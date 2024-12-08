exports.config = {
  name: 'checkdie',
  version: '1.0.1',
usePrefix: false,
  hasPermssion: 1,
  credits: 'Mây Trắng',
  description: 'Kiểm tra những tài khoản Facebook đã bị vô hiệu hóa',
  commandCategory: 'Admin',
  usages: '/checkdie',
  cooldowns: 5
};

const axios = require('axios');

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  const accessToken = '6628568379%7Cc1e620fa708a1d5696fb991c1bde5662';

  api.getThreadInfo(threadID, async (err, info) => {
    if (err) return api.sendMessage("Không thể lấy thông tin nhóm.", threadID, messageID);

    const { participantIDs } = info;
    let dieAccounts = [];

    for (const userID of participantIDs) {
      try {
        await axios.get(`https://graph.facebook.com/${userID}`, {
          params: {
            access_token: accessToken
          }
        });
      } catch (error) {
        if (error.response && error.response.status === 404) {
          dieAccounts.push(userID);
        }
      }
    }

    if (dieAccounts.length === 0) {
      return api.sendMessage("Không có tài khoản nào bị vô hiệu hóa.", threadID, messageID);
    }

    let message = "📋 Danh sách các tài khoản bị vô hiệu hóa:\n";
    for (const [index, userID] of dieAccounts.entries()) {
      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "Không tên";
      message += `${index + 1}. ${userName} (ID: ${userID})\n`;
    }

    return api.sendMessage(message, threadID, messageID);
  });
};