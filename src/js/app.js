// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const sensorRef = db.ref('Sensor');
const statusRef = db.ref('Status');
const controlRef = db.ref('Control');

const notify = document.getElementById('notify');

// Hàm hiển thị thời gian thực
function updateCurrentTime() {
    const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const dateTimeString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

updateCurrentTime();
setInterval(updateCurrentTime, 1000);

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
    document.getElementById('Tds').textContent = (data.TDS ?? 'N') + ' ppm';
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
    
    // Cập nhật chế độ
    currentMode = status.Mode || 'AUTO';
    updateModeUI();

    // Đồng bộ trạng thái Bơm
    const pumpOnBtn = document.getElementById('pumpOn');
    const pumpOffBtn = document.getElementById('pumpOff');
    
    pumpOnBtn.className = pumpOnBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    pumpOffBtn.className = pumpOffBtn.className.replace(/\b(btn-on-active|btn-off-active|btn-inactive)\b/g, '').trim();
    
    console.log('Pump status:', status.Pump); // Debug
    
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
    
    console.log('Drain status:', status.Drain); // Debug
    
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
    
    console.log('Irrigation status:', status.Irrigation); // Debug
    
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