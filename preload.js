const { contextBridge, ipcRenderer } = require('electron');

window.close = () => {
    ipcRenderer.send('close-window');
};

contextBridge.exposeInMainWorld('electronAPI', {
  showCallPopup: (callerData) => ipcRenderer.invoke('show-call-popup', callerData),
  answerCall: (callerData) => ipcRenderer.invoke('answer-call', callerData),
  declineCall: () => ipcRenderer.invoke('decline-call'),
  createNotificstion: () => ipcRenderer.invoke('create-notification'),
  onCallerData: (callback) => ipcRenderer.on('caller-data', callback),
  onPlayRingtone: (callback) => ipcRenderer.on('play-ringtone', callback),
  onStopRingtone: (callback) => ipcRenderer.on('stop-ringtone', callback),
  startVibration: () => ipcRenderer.invoke('start-vibration'),
  stopVibration: () => ipcRenderer.invoke('stop-vibration'),
  setVibrationEnabled: (enabled) => ipcRenderer.invoke('set-vibration-enabled', enabled)
});
