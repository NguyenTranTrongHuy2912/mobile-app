/**
 * callEngine.ts
 * Tiện ích cốt lõi cho WebRTC Call: Định dạng thời gian, sinh URL Jitsi, script tự động join & phân quyền
 */
import { PermissionsAndroid, Platform } from 'react-native';

export function formatCallDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function requestAndroidCallPermissions(isVideo: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const perms: any[] = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (isVideo) {
      perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }
    const result = await PermissionsAndroid.requestMultiple(perms);
    const audioOk =
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const videoOk =
      !isVideo ||
      result[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED;
    return audioOk && videoOk;
  } catch (err) {
    console.warn('[CallEngine] Lỗi yêu cầu quyền Android:', err);
    return false;
  }
}

export function buildJitsiRoomUrl(params: {
  roomId: string | null;
  participantName: string;
  isVideo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}): string {
  const cleanRoom = (params.roomId || 'room').replace(/[^a-zA-Z0-9]/g, '_');
  const jitsiRoomId = `HQChat_${cleanRoom}`;

  const configParams = [
    `userInfo.displayName="${encodeURIComponent(params.participantName)}"`,
    'config.prejoinConfig.enabled=false',
    'config.prejoinPageEnabled=false',
    'config.requireDisplayName=false',
    `config.startAudioOnly=${!params.isVideo ? 'true' : 'false'}`,
    `config.startWithAudioMuted=${params.isMuted ? 'true' : 'false'}`,
    `config.startWithVideoMuted=${!params.isVideo || params.isVideoOff ? 'true' : 'false'}`,
    'config.disableDeepLinking=true',
    'config.disableInviteFunctions=true',
    'config.enableInsecureRoomNameCompletion=true',
    'config.enableWelcomePage=false',
    'config.toolbarButtons=[]',
    'config.p2p.enabled=true',
    'config.resolution=720',
    'interfaceConfig.TOOLBAR_BUTTONS=[]',
    'interfaceConfig.SETTINGS_SECTIONS=[]',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
    'interfaceConfig.SHOW_BRAND_WATERMARK=false',
    'interfaceConfig.SHOW_POWERED_BY=false',
    'interfaceConfig.MOBILE_APP_PROMO=false',
    'interfaceConfig.DEFAULT_BACKGROUND="%230F141C"',
    'interfaceConfig.VERTICAL_FILMSTRIP=false',
    'interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true',
  ].join('&');

  return `https://meet.element.io/${jitsiRoomId}#${configParams}`;
}

export const INJECTED_CALL_SCRIPT = `
  (function() {
    // 1. Chống Android Chromium tiết kiệm pin gây ngắt / tắt tiếng (anti-throttling)
    try {
      Object.defineProperty(document, 'hidden', { get: function() { return false; }, configurable: true });
      Object.defineProperty(document, 'visibilityState', { get: function() { return 'visible'; }, configurable: true });
    } catch (e) {}

    // 2. Tự động vượt qua màn hình chờ prejoin / join meeting
    function autoJoin() {
      var selectors = [
        '[data-testid="prejoin.joinMeeting"]',
        'button[aria-label="Join meeting"]',
        'button[aria-label="Tham gia cuộc họp"]',
        '.action-btn.primary',
        'button.join-button',
        'div[role="button"][aria-label*="Join"]'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el) {
          el.click();
          return true;
        }
      }
      var allBtns = document.querySelectorAll('button, div[role="button"]');
      for (var j = 0; j < allBtns.length; j++) {
        var txt = (allBtns[j].textContent || allBtns[j].innerText || '').trim().toLowerCase();
        if (txt === 'join meeting' || txt === 'join' || txt === 'tham gia') {
          allBtns[j].click();
          return true;
        }
      }
      return false;
    }

    var joinInterval = setInterval(autoJoin, 300);
    setTimeout(function() { clearInterval(joinInterval); }, 20000);

    // 3. Liên tục đảm bảo tất cả luồng audio/video được phát và không bị mute
    function ensureMediaPlaying() {
      var mediaEls = document.querySelectorAll('audio, video');
      for (var k = 0; k < mediaEls.length; k++) {
        var m = mediaEls[k];
        if (m.muted && m.id !== 'localVideo') {
          m.muted = false;
        }
        m.volume = 1.0;
        if (m.paused) {
          m.play().catch(function() {});
        }
      }
      if (window.APP && window.APP.conference) {
        try {
          if (window.APP.conference.isLocalAudioMuted && window.APP.conference.isLocalAudioMuted()) {
            window.APP.conference.muteAudio(false);
          }
        } catch(e) {}
      }
    }
    var mediaInterval = setInterval(ensureMediaPlaying, 800);
    setTimeout(function() { clearInterval(mediaInterval); }, 120000);

    var style = document.createElement('style');
    style.innerHTML = \`
      .watermark, .jitsi-icon, #header, .header, .leftwatermark, 
      .chrome-extension-banner, .deep-linking-mobile, .mobile-browser, 
      .filmstrip__videos, [data-testid="filmstrip.toolbar"],
      .toolbox-content, .toolbox-row, .context-menu, .notice, .banner,
      .prejoin-dialog-btn, .prejoin-second-row, [data-testid="prejoin.screen"] header,
      .invite-more-container, .modal-dialog-form, .reactions-menu,
      .filmstrip, #filmstripWrapper, .subject, .videocontainer__toolbar {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      body, html, #react, .videocontainer {
        background-color: #0F141C !important;
        overflow: hidden !important;
      }
      #largeVideo, #largeVideoContainer, video {
        object-fit: cover !important;
        width: 100vw !important;
        height: 100vh !important;
      }
      #localVideo, #localVideoContainer {
        border-radius: 12px !important;
        overflow: hidden !important;
      }
    \`;
    document.head.appendChild(style);
  })();
  true;
`;
