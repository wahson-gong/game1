GameGlobal.canvas = wx.createCanvas();

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

canvas.width = windowInfo.screenWidth;
canvas.height = windowInfo.screenHeight;

export const SCREEN_WIDTH = windowInfo.screenWidth;
export const SCREEN_HEIGHT = windowInfo.screenHeight;

/** 设计稿高度，用于等比缩放跳跃/下落/滑行距离 */
export const DESIGN_HEIGHT = 844;
export const SCALE = SCREEN_HEIGHT / DESIGN_HEIGHT;
