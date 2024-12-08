module.exports.config = {
  name: "prefix",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "ManhG",
  description: "Xem prefix của BOT",
  commandCategory: "Admin",
  usages: "",
  cooldowns: 5,
};

module.exports.handleEvent = async ({ event, api, Threads, Users }) => {
  const { threadID, messageID, body, senderID } = event;
  if (senderID == global.data.botID) return; // Ngăn bot tự phản hồi lại mình

  if (this.config.credits !== "ManhG") { 
    return api.sendMessage("Sai credits!", threadID, messageID);
  }

  function sendReply(message) {
    // Gửi tin nhắn với tệp đính kèm từ mảng global.a và thu hồi sau 30 giây
    api.sendMessage(
      { body: `${message}\n\n🔔 Ghi chú: Tin nhắn này sẽ tự thu hồi sau 30 giây`, attachment: global.a.splice(0, 1) },
      threadID,
      (error, info) => {
        if (error) return;
        // Đặt thời gian 30 giây để thu hồi tin nhắn
        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 30000);
      }
    );
  }

  const dataThread = await Threads.getData(threadID);
  const data = dataThread.data; 
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};

  const triggers = ["mpre", "mprefix", "prefix", "dấu lệnh", "prefix của bot là gì", "daulenh", "Lunar"];
  const prefixGroup = threadSetting.PREFIX || global.config.PREFIX;
  const totalCommands = global.client.commands.size; // Tổng số lệnh bot hiện có
  const totalUsers = global.data.allUserID.length; // Tổng số người dùng bot
  const totalGroups = global.data.allThreadID.length; // Tổng số nhóm sử dụng bot

  // Lấy thời gian hiện tại với múi giờ Việt Nam (UTC+7)
  const currentDate = new Date();
  const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
  const time = currentDate.toLocaleTimeString('vi-VN', options);
  const date = currentDate.toLocaleDateString('vi-VN', options);

  const responseTemplate = `==== [ PREFIX BOT ] ====
──────────────────
✏️ Prefix của nhóm: ${prefixGroup}
📎 Prefix hệ thống: ${global.config.PREFIX}
📝 Tổng có: ${totalCommands} lệnh
👥 Tổng người dùng bot: ${totalUsers}
🏘️ Tổng nhóm: ${totalGroups}
──────────────────
⏰ Time: ${time} || ${date}`;

  triggers.forEach(trigger => {
    const triggerFormatted = new RegExp(`^${trigger}$`, "i"); // Tạo biểu thức chính quy để so khớp không phân biệt chữ hoa chữ thường
    if (triggerFormatted.test(body)) {
      return sendReply(responseTemplate);
    }
  });
};

module.exports.run = async ({ event, api }) => {
  return api.sendMessage("Đã xảy ra lỗi", event.threadID);
};
