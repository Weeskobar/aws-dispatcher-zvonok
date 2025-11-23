const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let callWindow;
let audioProcess = null;
// Вибрация изначально включена
let currentVibrationEnabled = true;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');

  // Открываем DevTools в режиме разработки
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}
// Рингдон (пока не рабоатет)
function playRingtone() {
  // Останавливаем предыдущий звук, если он играет
  stopRingtone();
  
  const ringtonePath = path.join(__dirname, 'src', 'assets', 'sounds', 'ringtone.wav');
  try {
    if (process.platform === 'win32') {
      audioProcess = spawn('powershell', [
        '-c', 
        `(New-Object Media.SoundPlayer "${ringtonePath}").PlaySync();`
      ]);
    } else if (process.platform === 'darwin') {
      // macOS
      audioProcess = spawn('afplay', [ringtonePath]);
    } else {
      // Linux
      audioProcess = spawn('aplay', [ringtonePath]);
    }
    
    audioProcess.on('error', (error) => {
      console.warn('Не удалось воспроизвести звук системным способом:', error);
      // Fallback: используем HTML5 audio через рендерер
      if (callWindow) {
        callWindow.webContents.send('play-ringtone');
      }
    });
    
  } catch (error) {
    console.warn('Ошибка воспроизведения звука:', error);
    // Fallback: используем HTML5 audio
    if (callWindow) {
      callWindow.webContents.send('play-ringtone');
    }
  }
}

function stopRingtone() {
  if (audioProcess) {
    audioProcess.kill();
    audioProcess = null;
  }
  
  // Также останавливаем HTML5 audio если он играет
  if (callWindow) {
    callWindow.webContents.send('stop-ringtone');
  }
}

// Вибрация при звонке 
function startVibration() {
  if (!callWindow) return;
  
  let position = callWindow.getPosition();
  let originalX = position[0];
  let originalY = position[1];
  let vibrationStep = 0;
  
  // Сохраняем исходный размер окна
  const originalSize = callWindow.getSize();
  const originalWidth = originalSize[0];
  const originalHeight = originalSize[1];
  //Вибрация окна
  vibrationInterval = setInterval(() => {
    if (!callWindow || callWindow.isDestroyed()) {
      clearInterval(vibrationInterval);
      return;
    }
    
    // Очень маленькие смещения
    const patterns = [
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    
    const [dx, dy] = patterns[vibrationStep % patterns.length];
    
    // Всегда устанавливаем одинаковый размер
    callWindow.setBounds({
      x: originalX + dx,
      y: originalY + dy,
      width: originalWidth,
      height: originalHeight
    });
    
    vibrationStep++;
    
  }, 50); // Еще более медленная вибрация
}
//Окно звонка
function createCallWindow(callerData) {
  callWindow = new BrowserWindow({
    width: 450,
    height: 600,
    parent: mainWindow,
    modal: true,
    show: false,
    resizable: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Автоматическое закрытие через 30 секунд
  setTimeout(() => {
    if (callWindow && !callWindow.isDestroyed()) {
      callWindow.close();
      stopRingtone();
    }
  }, 30000);

  callWindow.loadFile('src/call-popup.html');

  callWindow.on('closed', () => {
    callWindow = null;
  });

  // Передаем данные о звонящем когда окно готово
  callWindow.once('ready-to-show', () => {
    callWindow.show();    

    //Проверка статуса вибрации
    console.log(currentVibrationEnabled)

    // Запускаем вибрацию только если она включена
    if (currentVibrationEnabled) {
      startVibration();
    }

    playRingtone();
    
    // Отправляем данные о звонящем в окно
    if (callerData) {
      callWindow.webContents.send('caller-data', callerData);
    }
  });
}
//Карточка абонента
function createAbonentCardWindow(callerData){
  abonentCardWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: true,
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  abonentCardWindow.loadFile("src/abonent-card.html")
  
  abonentCardWindow.on('closed', () => {
    abonentCardWindow = null;
  });

  // Передаем данные о звонящем когда окно готово
  abonentCardWindow.once('ready-to-show', () => {
    abonentCardWindow.show();    
    // Отправляем данные о звонящем в окно
    if (callerData) {
      abonentCardWindow.webContents.send('caller-data', callerData);
    }
  });
}

//Запуск приложения
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработчики IPC
ipcMain.handle('show-call-popup', (event, callerData) => {
  if (!callWindow) {
    createCallWindow(callerData);
  }
  return true;
});

ipcMain.handle('answer-call', (event, callerData) => {
  console.log('Звонок принят');
  if (callWindow) {
    callWindow.close();
    stopRingtone();
    createAbonentCardWindow(callerData)
  }
  // Здесь можно добавить логику для принятия звонка
  return 'Звонок принят';
});

ipcMain.handle('decline-call', () => {
  console.log('Звонок отклонен');
  if (callWindow) {
    callWindow.close();
    stopRingtone();
  }
  // Здесь можно добавить логику для отклонения звонка
  return 'Звонок отклонен';
});

ipcMain.handle('create-notification', () => {
  console.log('Создано обращение');
  if (callWindow) {
    callWindow.close();
    stopRingtone();
  }
  // Здесь можно добавить логику для создания обращения
  return 'Создано обращение';
});
// Обработчик статуса активации вибрации
ipcMain.handle('set-vibration-enabled', (event, enabled) => {
  currentVibrationEnabled = enabled;
  console.log('Вибрация установлена:', enabled ? 'включена' : 'выключена');
  return `Вибрация ${enabled ? 'включена' : 'выключена'}`;
});

ipcMain.handle('start-vibration', () => {
  startVibration();
  return 'Вибрация запущена';
});
// Обработчики для управления звуком
ipcMain.handle('play-ringtone', () => {
  playRingtone();
  return 'Звонок воспроизводится';
});

ipcMain.handle('stop-ringtone', () => {
  stopRingtone();
  return 'Звонок остановлен';
});