module.exports.config = {
    name: 'ytb',
    version: '1.0.0',
    hasPermssion: 0,
    credits: 'DungUwU',
    description: 'Phát nhạc hoặc video thông qua link YouTube hoặc từ khoá tìm kiếm',
    commandCategory: 'Tiện ích',
    usages: 'ytb < keyword/url >',
    cooldowns: 5,
    usePrefix: true, // Sử dụng prefix cá nhân cho người dùng
    images: [],
    dependencies: {
        'moment-timezone': '',
        'axios': '',
        'fs-extra': '',
        'ytdl-core': '',
        'axios': '',
        '@ffmpeg-installer/ffmpeg': '',
        'fluent-ffmpeg': ''
    }
};

// Lưu trữ prefix cho từng người dùng
global.userPrefix = {};

const mediaSavePath = __dirname + '/cache/Youtube/';
const key = "AIzaSyAygWrPYHFVzL0zblaZPkRcgIFZkBNAW9g";

// Hàm để đặt prefix cho người dùng
const setUserPrefix = (userID, prefix) => {
    global.userPrefix[userID] = prefix;
};

// Hàm lấy prefix của người dùng
const getUserPrefix = (userID) => {
    return global.userPrefix[userID] || "ytb"; // Trả về "ytb" nếu người dùng chưa đặt prefix
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, body, senderID } = event;
    const { author, videoID, IDs, type: reply_type } = handleReply;
    if (senderID != author) return;

    const { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync, statSync } = global.nodemodule['fs-extra'];
    const moment = global.nodemodule['moment-timezone'];
    const currentTime = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
    const axios = global.nodemodule['axios'];

    // Hàm tải media
    const downloadMedia = async (videoID, type) => {
        const filePath = `${mediaSavePath}${Date.now()}${senderID}.${(type == 'video') ? 'mp4' : 'm4a'}`;
        const errObj = { filePath, error: 1 };
        try {
            const mediaObj = { filePath, error: 0 };
            let ytdlOptions;

            if (!existsSync(mediaSavePath)) mkdirSync(mediaSavePath, { recursive: true });

            if (type == 'video') {
                ytdlOptions = { quality: '18' };
            } else {
                ytdlOptions = { filter: 'audioonly' };
            }

            await new Promise((resolve, reject) => {
                const ytdl = global.nodemodule['ytdl-core'];
                const ffmpeg = global.nodemodule['fluent-ffmpeg'];
                const startTime = Date.now();
                const stream = ytdl('https://www.youtube.com/watch?v=' + videoID, ytdlOptions);

                if (type == 'video') {
                    stream.pipe(createWriteStream(filePath))
                        .on('error', (err) => reject(err))
                        .on('close', () => resolve());
                } else {
                    ffmpeg.setFfmpegPath(global.nodemodule['@ffmpeg-installer/ffmpeg'].path);
                    ffmpeg(stream)
                        .audioCodec("aac")
                        .save(filePath)
                        .on("error", err => reject(err))
                        .on("end", () => {
                            console.log('☑️ Đã tải xuống, chuyển đổi trong ' + (Date.now() - startTime) + 'ms');
                            resolve();
                        });
                }
            });

            return mediaObj;
        } catch (e) {
            console.log(e);
            return errObj;
        }
    };

    // Phần xử lý khi người dùng phản hồi lệnh
    switch (reply_type) {
        case 'download':
            {
                const { filePath, error } = await downloadMedia(videoID, body == '1' ? 'video' : 'audio');
                const mediaData = {
                    title: (await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${key}`)).data.items[0].snippet.title,
                    duration: prettyTime((await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoID}&key=${key}`))).data.items[0].contentDetails.duration)
                };

                if (error != 0) {
                    api.sendMessage('❎ Đã có lỗi xảy ra', threadID, messageID);
                    if (existsSync(filePath)) unlinkSync(filePath);
                } else {
                    api.unsendMessage(handleReply.messageID);
                    if ((statSync(filePath).size > 50331648 && body == 1) || (statSync(filePath).size > 26214400 && body == 2)) {
                        api.sendMessage('⚠️ Không thể gửi vì kích thước tệp quá lớn', threadID, messageID);
                        unlinkSync(filePath);
                    } else {
                        api.sendMessage({
                            body: `[ YOUTUBE DOWNLOAD CONVERT ]\n──────────────────\n📝 Tiêu đề: ${mediaData.title}\n⏳ Thời lượng: ${mediaData.duration}\n⏰ Time: ${currentTime}`,
                            attachment: createReadStream(filePath)
                        }, threadID, (err) => {
                            if (err) {
                                console.log(err);
                                api.sendMessage('❎ Đã có lỗi xảy ra', threadID, messageID);
                            }
                            if (existsSync(filePath)) unlinkSync(filePath);
                        }, messageID);
                    }
                }
                break;
            }
        case 'list':
            {
                if (isNaN(body) || body < 1 || body > IDs.length) {
                    api.sendMessage('⚠️ Vui lòng chọn số từ 1 đến ' + IDs.length, threadID, messageID);
                } else {
                    api.unsendMessage(handleReply.messageID);
                    const chosenIndex = parseInt(body) - 1;
                    const chosenID = IDs[chosenIndex];
                    api.sendMessage('[ YOUTUBE SELECT ]\n──────────────────\n1. Tải video\n2. Tải âm thanh video\n\n📌 Reply (phản hồi) STT để thực hiện yêu cầu', threadID,
                        (error, info) => {
                            if (!error) {
                                global.client.handleReply.push({
                                    type: 'download',
                                    name: this.config.name,
                                    messageID: info.messageID,
                                    author: senderID,
                                    videoID: chosenID
                                });
                            }
                        },
                        messageID);
                }
                break;
            }
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const userPrefix = getUserPrefix(senderID); // Lấy prefix của người dùng

    if (args.length == 0) return api.sendMessage(`❎ Phần tìm kiếm không được để trống. Sử dụng lệnh: ${userPrefix} <từ khóa/link YouTube>`, threadID, messageID);

    // Nếu người dùng muốn thay đổi prefix của họ
    if (args[0] === 'prefix' && args[1]) {
        const newPrefix = args[1];
        setUserPrefix(senderID, newPrefix);
        return api.sendMessage(`✅ Prefix của bạn đã được đổi thành: ${newPrefix}`, threadID, messageID);
    }

    // Xử lý lệnh ytb với input của người dùng
    const input = args.join(' ');
    const urlPatten = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/gm;
    const isValidUrl = urlPatten.test(input);

    // Tìm kiếm và tải video từ YouTube
    const axios = global.nodemodule['axios'];
  
    const getBasicInfo = async (keyword) => {
        try {
            const mediaData = (await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${keyword}&type=video&key=${key}`))).data.items;
            return mediaData;
        } catch (e) {
            throw e;
        }
    };

    try {
        // Thực hiện lệnh tải video hoặc audio từ link YouTube hoặc từ khóa
        if (isValidUrl) {
            let videoID = input.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
            (videoID[2] !== undefined) ? videoID = videoID[2].split(/[^0-9a-z_\-]/i)[0] : videoID = videoID[0];
    
            api.sendMessage(`[ YOUTUBE SELECT ]\n──────────────────\n1. Tải video\n2. Tải âm thanh video\n\n📌 Reply (phản hồi) STT để thực hiện yêu cầu`, threadID, (error, info) => {
                if (!error) {
                    global.client.handleReply.push({
                        type: 'download',
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        videoID
                    });
                }
            },
            messageID);
        } else {
            let IDs = [], msg = '', result = await getBasicInfo(input);
    
            for (let i = 0; i < result.length; i++) {
                const id = result[i].id.videoId;
                if (id !== undefined) {
                    IDs.push(id);
                    const mediaDuration = (await axios.get(encodeURI(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${key}`))).data.items[0].contentDetails.duration;
                    msg += `\n──────────────────\n${i + 1}. ${result[i].snippet.title}\n⏳ Thời lượng: ${prettyTime(mediaDuration)}`;
                }
            }
    
            msg = `[ YOUTUBE SEARCH ]\n──────────────────\n📝 Có ${IDs.length} kết quả trùng với từ khóa tìm kiếm của bạn:${msg}\n──────────────────\n\n📌 Reply (phản hồi) STT của video muốn tải`;
            api.sendMessage(msg, threadID, (error, info) => {
                if (!error) {
                    global.client.handleReply.push({
                        type: 'list',
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        IDs
                    });
                }
            }, messageID);
        }
    } catch (e) {
        api.sendMessage('❎ Đã xảy ra lỗi:\n' + e, threadID, messageID);
    }
};

// Hàm chuyển đổi định dạng thời gian từ YouTube
const prettyTime = (time) => {
    let newTimeArray = [];
    time = time.slice(2);

    if (time.includes('H')) {
        newTimeArray.push(time.split('H')[0]);
        time = time.split('H')[1];
    } else newTimeArray.push(0);
    if (time.includes('M')) {
        newTimeArray.push(time.split('M')[0]);
        time = time.split('M')[1];
    } else newTimeArray.push(0);
    if (time.includes('S')) {
        newTimeArray.push(time.split('S')[0]);
    } else newTimeArray.push(0);

    newTimeArray = newTimeArray.map(item => {
        if (parseInt(item) < 10) {
            return '0' + item;
        } else return item;
    });
    return newTimeArray.join(':');
};
