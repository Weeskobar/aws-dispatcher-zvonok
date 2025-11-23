document.addEventListener('DOMContentLoaded', () => {
    const answerBtn = document.getElementById('answerBtn');
    const declineBtn = document.getElementById('declineBtn');
    const notificationBtn = document.getElementById('notificationBtn');
    const callerName = document.querySelector('.caller-name');
    const callerNumber = document.querySelector('.caller-number');

    let audio = null;
    
    // Функция для воспроизведения звука через HTML5 Audio (пока не работает)
function playHTML5Ringtone() {
        stopHTML5Ringtone();
        
        try {
            // Используем абсолютный путь через протокол file
            const ringtonePath = require('path').join(__dirname, '../assets/sounds/ringtone.wav');
            audio = new Audio(`file://${ringtonePath}`);
            
            audio.loop = true;
            audio.volume = 0.7;
            
            // Обработчики для отладки
            audio.addEventListener('canplaythrough', () => {
                console.log('Audio can play through');
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('Автовоспроизведение заблокировано:', error);
                        // Показываем кнопку для ручного воспроизведения
                        showManualPlayButton();
                    });
                }
            });
            
            audio.addEventListener('error', (e) => {
                console.error('Audio error:', e, audio.error);
                // Fallback на базовый путь
                fallbackAudio();
            });
            
            audio.addEventListener('loadstart', () => {
                console.log('Audio loading started');
            });
            
        } catch (error) {
            console.error('Ошибка создания audio элемента:', error);
            fallbackAudio();
        }
    }
    
    function fallbackAudio() {
        try {
            // Пробуем относительный путь как запасной вариант
            audio = new Audio('../assets/sounds/ringtone.wav');
            audio.loop = true;
            audio.volume = 0.7;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Не удалось воспроизвести звук:', error);
                });
            }
        } catch (error) {
            console.error('Fallback audio также не сработал:', error);
        }
    }
    
    function stopHTML5Ringtone() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio = null;
        }
    }

    // Обработчик получения данных о звонящем
    window.electronAPI.onCallerData((event, callerData) => {
        if (callerData) {
            if (callerData.name) {
                callerName.textContent = callerData.name;
            }
            if (callerData.number) {
                callerNumber.textContent = callerData.number;
            }
        }
    });

        // Обработчик воспроизведения звука (fallback)
    window.electronAPI.onPlayRingtone(() => {
        playHTML5Ringtone();
    });

    // Обработчик остановки звука
    window.electronAPI.onStopRingtone(() => {
        stopHTML5Ringtone();
    });

    // Принятие звонка
    answerBtn.addEventListener('click', async () => {
    stopHTML5Ringtone();
    try {
        // Получает текущие данные о звонящем
        const currentCallerData = {
            name: callerName.textContent,
            number: callerNumber.textContent
        };
        
        const result = await window.electronAPI.answerCall(currentCallerData); // Передаёт данные в карточку
        console.log(result);
    } catch (error) {
        console.error('Ошибка при принятии звонка:', error);
    }
});

    // Отклон звонка
    declineBtn.addEventListener('click', async () => {
        stopHTML5Ringtone();
        try {
            const result = await window.electronAPI.declineCall();
            console.log(result);
        } catch (error) {
            console.error('Ошибка при отклонении звонка:', error);
        }
    });

    //Создание обращения
    notificationBtn.addEventListener('click', async() => {
        stopHTML5Ringtone();
        try{
            const result = await window.electronAPI.createNotificstion();
            console.log(result);
        } catch (error) {
            console.error('Ошибка при создании обращения:', error);
        }
    }); 

    // Останавливаем звук при закрытии окна
    window.addEventListener('beforeunload', () => {
        stopHTML5Ringtone();
    });
});