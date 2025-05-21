// Triển khai Chart.js để hiển thị dữ liệu cảm biến
let dataChart;
let chartType = 'waterLevel';
let timeRange = 'day';

// Khởi tạo biểu đồ với các giá trị mặc định
function initChart() {
    const ctx = document.getElementById('dataChart').getContext('2d');
    
    // Thiết lập các giá trị mặc định cho Chart.js
    Chart.defaults.font.family = "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.color = '#2c3e50';
    Chart.defaults.elements.line.borderWidth = 3;
    Chart.defaults.elements.point.radius = 4;
    Chart.defaults.elements.point.hoverRadius = 6;
    
    // Tạo gradient cho biểu đồ
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(231, 76, 60, 0.3)');
    gradient.addColorStop(1, 'rgba(231, 76, 60, 0.0)');
    
    dataChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Mực nước (%)',
                data: [],
                borderColor: '#e74c3c',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#e74c3c',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Thống kê dữ liệu theo thời gian',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#2c3e50',
                    bodyColor: '#2c3e50',
                    borderColor: '#e1e1e1',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    boxPadding: 5,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Thời gian',
                        padding: {top: 10, bottom: 0}
                    },
                    ticks: {
                        padding: 8
                    }
                },
                y: {
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    title: {
                        display: true,
                        text: 'Giá trị',
                        padding: {top: 0, left: 0, right: 10, bottom: 0}
                    },
                    beginAtZero: true,
                    ticks: {
                        padding: 10
                    }
                }
            }
        }
    });
}

// Hàm lấy và xử lý dữ liệu từ Firebase
function fetchChartData() {
    // Xác định giới hạn thời gian dựa trên khoảng thời gian đã chọn
    let timeLimit;
    switch(timeRange) {
        case 'day':
            timeLimit = 24 * 60 * 60 * 1000; // 24 giờ tính bằng mili giây
            break;
        case 'week':
            timeLimit = 7 * 24 * 60 * 60 * 1000; // 7 ngày
            break;
        case 'month':
            timeLimit = 30 * 24 * 60 * 60 * 1000; // 30 ngày
            break;
        default:
            timeLimit = 24 * 60 * 60 * 1000; // Mặc định: 1 ngày
    }
    
    const startTime = Date.now() - timeLimit;
    
    // Tham chiếu đến cơ sở dữ liệu Firebase
    const historyRef = db.ref('History');
    
    // Truy vấn dữ liệu dựa trên timestamp
    historyRef.orderByChild('timestamp').startAt(startTime).on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        // Kiểm tra xem có dữ liệu không, nếu không thì sử dụng dữ liệu mẫu
        if (Object.keys(data).length === 0) {
            const mockData = generateMockData(timeLimit);
            processChartData(mockData);
        } else {
            processChartData(data);
        }
    });
}

// Tạo dữ liệu mẫu để kiểm thử khi không có dữ liệu lịch sử
function generateMockData(timeLimit) {
    const now = Date.now();
    const mockData = {};
    let interval;
    
    // Thiết lập khoảng thời gian dựa trên phạm vi thời gian
    switch(timeRange) {
        case 'day':
            interval = 60 * 60 * 1000; // 1 giờ
            break;
        case 'week':
            interval = 6 * 60 * 60 * 1000; // 6 giờ
            break;
        case 'month':
            interval = 24 * 60 * 60 * 1000; // 1 ngày
            break;
        default:
            interval = 60 * 60 * 1000; // Mặc định: 1 giờ
    }
    
    // Tạo các điểm dữ liệu
    for (let time = now - timeLimit; time <= now; time += interval) {
        const id = `mock_${time}`;
        mockData[id] = {
            timestamp: time,
            waterlevel: Math.floor(Math.random() * 100),
            pH: (Math.random() * 6 + 4).toFixed(1),
            TDS: Math.floor(Math.random() * 500),
            Soilmoisture: Math.floor(Math.random() * 100),
            temp: Math.floor(Math.random() * 15 + 20) // 20-35 độ
        };
    }
    
    return mockData;
}

// Xử lý và hiển thị dữ liệu trong biểu đồ
function processChartData(data) {
    const labels = [];
    const values = [];
    
    // Chuyển đổi đối tượng thành mảng và sắp xếp theo timestamp
    const dataArray = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    
    // Xác định trường dữ liệu cần hiển thị dựa trên loại biểu đồ đã chọn
    let dataField, chartLabel, chartColor;
    
    switch(chartType) {
        case 'waterLevel':
            dataField = 'waterlevel';
            chartLabel = 'Mực nước (%)';
            chartColor = '#e74c3c'; // Đỏ
            break;
        case 'soilMoisture':
            dataField = 'Soilmoisture';
            chartLabel = 'Độ ẩm đất';
            chartColor = '#3498db'; // Xanh dương
            break;
        case 'temperature':
            dataField = 'temp';
            chartLabel = 'Nhiệt độ (°C)';
            chartColor = '#f39c12'; // Cam
            break;
        case 'phValue':
            dataField = 'pH';
            chartLabel = 'Độ pH';
            chartColor = '#2ecc71'; // Xanh lá
            break;
        case 'tds':
            dataField = 'TDS';
            chartLabel = 'TDS (ppm)';
            chartColor = '#9b59b6'; // Tím
            break;
        default:
            dataField = 'waterlevel';
            chartLabel = 'Mực nước (%)';
            chartColor = '#e74c3c';
    }
    
    // Tạo gradient cho nền biểu đồ
    const ctx = document.getElementById('dataChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${chartColor}30`); // 30% độ trong suốt
    gradient.addColorStop(1, `${chartColor}05`); // 5% độ trong suốt
    
    // Trích xuất dữ liệu cho biểu đồ
    dataArray.forEach(item => {
        const date = new Date(item.timestamp);
        
        // Định dạng ngày tháng dựa trên khoảng thời gian
        let formattedDate;
        switch(timeRange) {
            case 'day':
                formattedDate = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                break;
            case 'week':
            case 'month':
                formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
                break;
            default:
                formattedDate = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        
        labels.push(formattedDate);
        values.push(item[dataField] || 0);
    });
    
    // Thêm hiệu ứng hoạt họa khi cập nhật biểu đồ
    const animation = {
        tension: {
            duration: 1000,
            easing: 'linear'
        },
        x: {
            type: 'number',
            easing: 'linear',
            duration: 300,
            from: NaN, // điểm ban đầu được bỏ qua
            delay(ctx) {
                if (ctx.type !== 'data' || ctx.xStarted) {
                    return 0;
                }
                ctx.xStarted = true;
                return ctx.index * 80;
            }
        },
        y: {
            type: 'number',
            easing: 'linear',
            duration: 300,
            from: values.length > 0 ? values[0] : 0,
            delay(ctx) {
                if (ctx.type !== 'data' || ctx.yStarted) {
                    return 0;
                }
                ctx.yStarted = true;
                return ctx.index * 80;
            }
        }
    };
    
    // Cập nhật dữ liệu biểu đồ
    dataChart.data.labels = labels;
    dataChart.data.datasets[0].label = chartLabel;
    dataChart.data.datasets[0].data = values;
    dataChart.data.datasets[0].borderColor = chartColor;
    dataChart.data.datasets[0].backgroundColor = gradient;
    dataChart.data.datasets[0].pointBackgroundColor = chartColor;
    dataChart.data.datasets[0].pointHoverBorderColor = chartColor;
    
    // Thêm tùy chọn hoạt họa
    dataChart.options.animations = animation;
    
    dataChart.update();
}

// Trình nghe sự kiện cho bộ chọn
document.getElementById('chartTypeSelector').addEventListener('change', (e) => {
    chartType = e.target.value;
    fetchChartData();
});

document.getElementById('timeRangeSelector').addEventListener('change', (e) => {
    timeRange = e.target.value;
    fetchChartData();
});

// Khởi tạo biểu đồ khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    fetchChartData();
    
    // Làm mới dữ liệu mỗi phút
    setInterval(fetchChartData, 60000);
}); 