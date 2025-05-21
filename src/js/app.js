// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const sensorRef = db.ref('Sensor');
const statusRef = db.ref('Status');
const controlRef = db.ref('Control');

const notify = document.getElementById('notify');

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
    document.getElementById('temperature').textContent = (data.temp ?? 'N') + ' Độ C';
});

let currentMode = 'AUTO';

// Status handling
statusRef.on('value', snapshot => {
    const status = snapshot.val() || {};
    // 1) Cập nhật chế độ
    currentMode = status.Mode || 'AUTO';
    updateModeUI();

    // 2) Đồng bộ trạng thái Bơm
    const pumpOnBtn = document.getElementById('pumpOn');
    const pumpOffBtn = document.getElementById('pumpOff');
    if (status.Pump === 'ON') {
        pumpOnBtn.classList.add('on-btn');
        pumpOffBtn.classList.remove('on-btn');
        pumpOnBtn.disabled = false;
        pumpOffBtn.disabled = false;
    } else {
        pumpOnBtn.classList.remove('on-btn');
        pumpOffBtn.classList.add('off-btn');
        pumpOnBtn.disabled = false;
        pumpOffBtn.disabled = false;
    }

    // 3) Đồng bộ trạng thái Xả
    const drainOnBtn = document.getElementById('drainOn');
    const drainOffBtn = document.getElementById('drainOff');
    if (status.Drain === 'ON') {
        drainOnBtn.classList.add('on-btn');
        drainOffBtn.classList.remove('on-btn');
        drainOnBtn.disabled = false;
        drainOffBtn.disabled = false;
    } else {
        drainOnBtn.classList.remove('on-btn');
        drainOffBtn.classList.add('off-btn');
        drainOnBtn.disabled = false;
        drainOffBtn.disabled = false;
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
    controlRef.child("Mode").set(false);
});

document.getElementById('manualBtn').addEventListener('click', () => {
    controlRef.child("Mode").set(true);
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
document.getElementById('irrigateOn').onclick = () => handleControl('Irrigate', true);
document.getElementById('irrigateOff').onclick = () => handleControl('Irrigate', false); 