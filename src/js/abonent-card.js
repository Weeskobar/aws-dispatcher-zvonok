document.addEventListener('DOMContentLoaded', () => {
    const callerName = document.querySelector('.caller-name');
    const callerNumbers = document.querySelectorAll('.caller-number');

        // Обработчик получения данных о звонящем
    window.electronAPI.onCallerData((event, callerData) => {
        if (callerData) {
            if (callerData.name) {
                callerName.textContent = callerData.name;
            }
            if (callerData.number) {
                callerNumbers.forEach(element => {
                    element.textContent = callerData.number;
                });
            }
        }
    });
})