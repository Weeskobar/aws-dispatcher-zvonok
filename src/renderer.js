document.addEventListener('DOMContentLoaded', () => {
    const simulateCallBtn = document.getElementById('simulateCall');
    const statusDiv = document.getElementById('status');
    const vibrationOnBtn = document.getElementById('vibrationOn');
    const vibrationOffBtn = document.getElementById('vibrationOff');

    // Пример данных о звонящих для симуляции (потом заменить на данные из API)
    const sampleCallers = [
        { name: "Иван Петров", number: "+7 (912) 345-67-89"},
        { name: "Мария Сидорова", number: "+7 (923) 456-78-90" },
        { name: "Алексей Козлов", number: "+7 (934) 567-89-01" },
        { name: "Елена Николаева", number: "+7 (945) 678-90-12" }
    ];
    
    // Обработчики для кнопок включения/выключения вибрации
    vibrationOnBtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.setVibrationEnabled(true);
            statusDiv.textContent = 'Вибрация включена';
            setTimeout(() => {
                statusDiv.textContent = 'Готов к работе';
            }, 2000);
        } catch (error) {
            console.error('Ошибка при включении вибрации:', error);
            statusDiv.textContent = 'Ошибка: ' + error.message;
        }
    });

    vibrationOffBtn.addEventListener('click', async () => {
        try {
            await window.electronAPI.setVibrationEnabled(false);
            statusDiv.textContent = 'Вибрация выключена';
            setTimeout(() => {
                statusDiv.textContent = 'Готов к работе';
            }, 2000);
        } catch (error) {
            console.error('Ошибка при выключении вибрации:', error);
            statusDiv.textContent = 'Ошибка: ' + error.message;
        }
    });
    // Симуляция звонка
    simulateCallBtn.addEventListener('click', async () => {
        try {
            statusDiv.textContent = 'Открываем окно звонка...';
            
            // Случайный выбор звонящего из примера
            const randomCaller = sampleCallers[Math.floor(Math.random() * sampleCallers.length)];
            
            await window.electronAPI.showCallPopup(randomCaller);
            statusDiv.textContent = `Окно звонка открыто: ${randomCaller.name}`;
            
            // Сбросим статус через 2 секунды
            setTimeout(() => {
                statusDiv.textContent = 'Готов к работе';
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка при открытии окна звонка:', error);
            statusDiv.textContent = 'Ошибка: ' + error.message;
        }
    });
    
});