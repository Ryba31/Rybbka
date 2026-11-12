// --- 1. Расчет нормы воды ---
const weightInput = document.getElementById('weight')
const calcBtn = document.getElementById('calcBtn')
const normDisplay = document.getElementById('normDisplay')
const progressText = document.getElementById('progressText')
const progressFill = document.getElementById('progressFill')

let dailyNorm = 2000 // Норма по умолчанию
let consumed = 0

// Формула: 30 мл на 1 кг веса (стандартная рекомендация)
function calculateNorm() {
    const weight = parseFloat(weightInput.value) || 70
    dailyNorm = Math.round(weight * 30)
    normDisplay.textContent = `Норма: ${dailyNorm} мл`
    updateUI()
}

// --- 2. Обновление интерфейса ---
function updateUI() {
    progressText.textContent = `${consumed} / ${dailyNorm} мл`
    const percent = Math.min((consumed / dailyNorm) * 100, 100)
    progressFill.style.width = percent + '%'
}

// --- 3. Быстрый ввод воды ---
document.querySelectorAll('.water-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount)
        consumed += amount
        updateUI()
    })
})

// Сброс
document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Сбросить счетчик за сегодня?')) {
        consumed = 0
        updateUI()
    }
})

calcBtn.addEventListener('click', calculateNorm)

// --- 4. Напоминания (Notifications API) ---
const notifyBtn = document.getElementById('notifyBtn')
const notifyStatus = document.getElementById('notifyStatus')
let reminderInterval = null

notifyBtn.addEventListener('click', async () => {
    // Запрашиваем разрешение
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
        notifyStatus.textContent = "Напоминания включены (каждый час)"
        notifyBtn.disabled = true

        // Отправляем тестовое уведомление сразу
        new Notification("Трекер воды", {body: "Не забудьте попить воды! 💧"})

        // Ставим интервал (например, каждый час = 3600000 мс)
        // Для теста в Android Studio можно поставить 10000 (10 секунд), чтобы проверить
        if (reminderInterval) clearInterval(reminderInterval)
        reminderInterval = setInterval(() => {
            new Notification("Время пить воду!", {body: "Поддержите водный баланс."})
        }, 3600000) // 1 час

    } else {
        notifyStatus.textContent = "Разрешение не получено"
    }
})

// Инициализация
calculateNorm()