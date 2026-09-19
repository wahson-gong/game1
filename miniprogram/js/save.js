import { BEST_KEY, MUSIC_KEY } from './constants';

export function getBestScore() {
  try {
    const v = wx.getStorageSync(BEST_KEY);
    return Number(v) || 0;
  } catch (e) {
    return 0;
  }
}

export function setBestScore(score) {
  try {
    wx.setStorageSync(BEST_KEY, String(Math.max(0, Math.floor(score))));
  } catch (e) {
    // ignore
  }
}

export function isMusicOn() {
  try {
    return wx.getStorageSync(MUSIC_KEY) !== '0';
  } catch (e) {
    return true;
  }
}

export function setMusicOn(on) {
  try {
    wx.setStorageSync(MUSIC_KEY, on ? '1' : '0');
  } catch (e) {
    // ignore
  }
}
