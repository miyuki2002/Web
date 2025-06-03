// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const sensorRef = db.ref('Sensor');
const statusRef = db.ref('Status');
const controlRef = db.ref('Control');

const notify = document.getElementById('notify');

// Biến toàn cục cho lịch
let currentDate = new Date();

// Tên các tháng bằng tiếng Việt
const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

// Hàm tạo lịch tháng
function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const calendarDates = document.getElementById('calendarDates');
    const currentMonthEl = document.getElementById('currentMonth');
    
    // Cập nhật tiêu đề tháng
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    calendarDates.innerHTML = '';
    
    // Thêm các ngày của tháng trước (nếu cần)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const dateEl = document.createElement('div');
        dateEl.className = 'calendar-date other-month';
        dateEl.textContent = daysInPrevMonth - i;
        calendarDates.appendChild(dateEl);
    }
    
    // Thêm các ngày của tháng hiện tại
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateEl = document.createElement('div');
        dateEl.className = 'calendar-date';
        dateEl.textContent = day;
        
        // Highlight ngày hiện tại
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dateEl.classList.add('today');
        }
        
        calendarDates.appendChild(dateEl);
    }
    
    const totalCells = calendarDates.children.length;
    const remainingCells = 42 - totalCells;
    
    for (let day = 1; day <= remainingCells; day++) {
        const dateEl = document.createElement('div');
        dateEl.className = 'calendar-date other-month';
        dateEl.textContent = day;
        calendarDates.appendChild(dateEl);
    }
}

// Hàm cập nhật thời gian nhỏ
function updateSmallTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const timeElement = document.getElementById('currentTimeSmall');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

// Hàm khởi tạo lịch
function initializeCalendar() {
    generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    updateSmallTime();
    
    // Xử lý nút điều hướng
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });
}

// Khởi tạo lịch và cập nhật thời gian
initializeCalendar();
setInterval(updateSmallTime, 1000);

function showNotification(msg) {
    notify.textContent = msg;
    notify.style.display = 'block';
    setTimeout(() => notify.style.display = 'none', 3000);
}

// Xử lý dữ liệu cảm biến
sensorRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    document.getElementById('waterLevel').textContent = (data.waterlevel ?? 'N') + '%';
    document.getElementById('soilMoisture').textContent = data.Soilmoisture ?? 'N';
    document.getElementById('phValue').textContent = data.pH ?? 'N';
    document.getElementById('Tds').textContent = data.TDS ? parseFloat(data.TDS).toFixed(2) + ' ppm' : 'N ppm';
    document.getElementById('temperature').textContent = data.Temp ? parseFloat(data.Temp).toFixed(2) + ' Độ C' : 'N Độ C';
    
    const rainStatus = data.Rain;
    const rainDuration = data.Raintime ?? 0;
    let weatherText = 'N';
    
    if (rainStatus === false || rainStatus === 0) {
        weatherText = 'Nắng';
    } else if (rainStatus === true || rainStatus === 1) {
        weatherText = `Mưa (${rainDuration} phút)`;
    }
    
    document.getElementById('rainStatus').textContent = weatherText;
});

let currentMode = 'AUTO';

// Status handling
statusRef.on('value', snapshot => {
    const status = snapshot.val() || {};
    console.log('Status from Firebase:', status);
    
    currentMode = status.Mode || 'AUTO';
    updateModeUI();

    // Đồng bộ trạng thái Bơm
    const pumpOnBtn = document.getElementById('pumpOn');
    const pumpOffBtn = document.getElementById('pumpOff');
    
    pumpOnBtn.className = pumpOnBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    pumpOffBtn.className = pumpOffBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    
    if (status.Pump === 'ON') {
        pumpOnBtn.classList.add('btn-on-active');
        pumpOffBtn.classList.add('btn-inactive');
    } else if (status.Pump === 'OFF') {
        pumpOnBtn.classList.add('btn-inactive');
        pumpOffBtn.classList.add('btn-off-active');
    } else {
        pumpOnBtn.classList.add('btn-inactive');
        pumpOffBtn.classList.add('btn-inactive');
    }

    // Đồng bộ trạng thái Xả
    const drainOnBtn = document.getElementById('drainOn');
    const drainOffBtn = document.getElementById('drainOff');
    
    drainOnBtn.className = drainOnBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    drainOffBtn.className = drainOffBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    
    if (status.Drain === 'ON') {
        drainOnBtn.classList.add('btn-on-active');
        drainOffBtn.classList.add('btn-inactive');
    } else if (status.Drain === 'OFF') {
        drainOnBtn.classList.add('btn-inactive');
        drainOffBtn.classList.add('btn-off-active');
    } else {
        drainOnBtn.classList.add('btn-inactive');
        drainOffBtn.classList.add('btn-inactive');
    }
    
    // Đồng bộ trạng thái Tưới
    const irrigateOnBtn = document.getElementById('irrigateOn');
    const irrigateOffBtn = document.getElementById('irrigateOff');
    
    irrigateOnBtn.className = irrigateOnBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    irrigateOffBtn.className = irrigateOffBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    
    if (status.Irrigation === 'ON') {
        irrigateOnBtn.classList.add('btn-on-active');
        irrigateOffBtn.classList.add('btn-inactive');
    } else if (status.Irrigation === 'OFF') {
        irrigateOnBtn.classList.add('btn-inactive');
        irrigateOffBtn.classList.add('btn-off-active');
    } else {
        irrigateOnBtn.classList.add('btn-inactive');
        irrigateOffBtn.classList.add('btn-inactive');
    }

    // Đồng bộ trạng thái Mái che
    const roofOpenBtn = document.getElementById('roofOpen');
    const roofCloseBtn = document.getElementById('roofClose');
    
    roofOpenBtn.className = roofOpenBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    roofCloseBtn.className = roofCloseBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    
    if (status.Cover === 'OPEN') {
        roofOpenBtn.classList.add('btn-on-active');
        roofCloseBtn.classList.add('btn-inactive');
    } else if (status.Cover === 'CLOSE') {
        roofOpenBtn.classList.add('btn-inactive');
        roofCloseBtn.classList.add('btn-off-active');
    } else {
        roofOpenBtn.classList.add('btn-inactive');
        roofCloseBtn.classList.add('btn-inactive');
    }
});

function updateModeUI() {
    const manualControls = document.getElementById('manualControls');
    document.getElementById('autoBtn').className = currentMode === 'AUTO' ? 'active-mode' : 'inactive-mode';
    document.getElementById('manualBtn').className = currentMode === 'MANUAL' ? 'active-mode' : 'inactive-mode';
    manualControls.className = currentMode === 'MANUAL' ? '' : 'disabled';
}

// Xử lý điều khiển
document.getElementById('autoBtn').addEventListener('click', () => {
    if (currentMode !== 'AUTO') {
        controlRef.child("Mode").set(true);
        showNotification('Đã chuyển sang chế độ AUTO');
    }
});

document.getElementById('manualBtn').addEventListener('click', () => {
    if (currentMode !== 'MANUAL') {
        controlRef.child("Mode").set(false);
        showNotification('Đã chuyển sang chế độ MANUAL');
    }
});

function handleControl(refName, state) {
    if (currentMode !== 'MANUAL') {
        showNotification('Hệ thống đang ở chế độ AUTO. Vui lòng chuyển sang MANUAL để điều khiển.');
        return;
    }
    controlRef.update({ [refName]: state });
}

// Trình xử lý sự kiện nút
document.getElementById('pumpOn').onclick = () => handleControl('Pump', true);
document.getElementById('pumpOff').onclick = () => handleControl('Pump', false);
document.getElementById('drainOn').onclick = () => handleControl('Drain', true);
document.getElementById('drainOff').onclick = () => handleControl('Drain', false);
document.getElementById('irrigateOn').onclick = () => handleControl('Irrigation', true);
document.getElementById('irrigateOff').onclick = () => handleControl('Irrigation', false);
document.getElementById('roofOpen').onclick = () => handleControl('Cover', true);
document.getElementById('roofClose').onclick = () => handleControl('Cover', false); 