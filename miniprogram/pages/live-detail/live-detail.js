const { loadLives, loadLivePlayUrl } = require('../../services/content');
const recommend = require('../../data/recommend');
const { findById, quickToast } = require('../../utils/mock');

const VIDEO_SOURCE_CANDIDATES = [];
function uniqueVideoSources(sources) {
  return sources
    .map((source) => String(source || '').trim())
    .filter(Boolean)
    .filter((source, index, list) => list.indexOf(source) === index);
}

function preferredLiveVideoUrl(live) {
  return String((live && (live.hlsUrl || live.liveUrl)) || '').trim();
}

Page({
  data: {
    live: null,
    videoUrl: '',
    currentTime: '',
    nearby: recommend.corridor.slice(0, 3)
  },

  onLoad(options) {
    this.videoSourceIndex = -1;
    this.refreshClock();
    this.clockTimer = setInterval(() => {
      this.refreshClock();
    }, 1000);

    loadLives().then((lives) => {
      const live = findById(lives, options.id);
      this.setData({
        live
      });
      if (live) {
        this.prepareVideo(live);
        this.refreshPlayUrl(live);
      }
    });
  },

  onUnload() {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
  },

  refreshClock() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    this.setData({
      currentTime: `${date} ${time}`
    });
  },

  prepareVideo(live) {
    const remoteSource = preferredLiveVideoUrl(live);
    this.videoSourceCandidates = uniqueVideoSources([
      remoteSource
    ]);

    if (remoteSource) {
      this.useVideoSource(remoteSource);
      return;
    }

    this.setData({ videoUrl: '' });
  },

  refreshPlayUrl(live) {
    loadLivePlayUrl(live.id)
      .then((payload) => {
        const playUrl = String((payload && payload.playUrl) || '').trim();
        if (!playUrl) return;
        this.prepareVideo({
          ...live,
          hlsUrl: playUrl
        });
      })
      .catch((error) => {
        console.warn('load live play url failed', error);
      });
  },

  useVideoSource(source) {
    const candidates = this.videoSourceCandidates && this.videoSourceCandidates.length ? this.videoSourceCandidates : VIDEO_SOURCE_CANDIDATES;
    this.videoSourceIndex = Math.max(0, candidates.indexOf(source));
    this.setData({ videoUrl: source });
  },

  tryNextVideoSource() {
    const candidates = this.videoSourceCandidates && this.videoSourceCandidates.length ? this.videoSourceCandidates : VIDEO_SOURCE_CANDIDATES;
    const currentIndex = candidates.indexOf(this.data.videoUrl);
    const nextIndex = Math.max(this.videoSourceIndex || 0, currentIndex) + 1;
    const nextSource = candidates[nextIndex];
    if (nextSource) {
      this.videoSourceIndex = nextIndex;
      this.setData({ videoUrl: nextSource });
      quickToast('正在切换备用视频源');
      return;
    }
    this.videoSourceIndex = candidates.length;
    this.setData({ videoUrl: '' });
    quickToast('视频源暂不可用，已切换为封面预览');
  },

  onFullscreen() {
    if (this.data.videoUrl) {
      quickToast('正在播放海林村实时视频');
      return;
    }
    quickToast('视频源暂不可用，当前显示封面');
  },

  onVideoError(event) {
    console.warn('live video error', event.detail);
    this.tryNextVideoSource();
  }

  // 真实直播密钥、萤石云 token 或 HLS 鉴权应由后端维护。
  // 后端可返回 liveUrl / hlsUrl，小程序端只负责播放地址。
});
