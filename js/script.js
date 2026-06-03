// ข้อมูล Admin ที่ฟิกซ์ไว้ตามเงื่อนไข
const ADMIN_USER = "ADMIN_SMTE20";
const ADMIN_PASS = "SMTE_202020";

// อ้างอิง DOM Elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.querySelector('.close-modal');
const submitLogin = document.getElementById('submitLogin');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logoutBtn');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');

// เช็กสถานะการ Login จากเซสชัน (ถ้าเคยล็อกอินแล้วกดรีเฟรชก็จะไม่หลุด)
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';

// โหลดข้อมูลงานเริ่มต้นจาก LocalStorage (ถ้าไม่มีจะใช้ค่าว่าง)
let tasks = JSON.parse(localStorage.getItem('classroom_tasks')) || [];

// ฟังก์ชันเปิด/ปิด Modal Login
loginBtn.addEventListener('click', () => {
    if (isAdmin) {
        alert('คุณเข้าสู่ระบบแอดมินอยู่แล้วครับ!');
    } else {
        loginModal.classList.add('show');
    }
});

closeModal.addEventListener('click', () => {
    loginModal.classList.remove('show');
    clearLoginForm();
});

// ฟังก์ชันเคลียร์ค่าในฟอร์ม Login
function clearLoginForm() {
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.classList.add('hidden');
}

// ตรวจสอบการ Login
submitLogin.addEventListener('click', () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        loginModal.classList.remove('show');
        clearLoginForm();
        updateUI();
    } else {
        loginError.classList.remove('hidden');
    }
});

// ออกจากระบบ แอดมิน
logoutBtn.addEventListener('click', () => {
    isAdmin = false;
    sessionStorage.removeItem('isAdmin');
    updateUI();
});

// ฟังก์ชันอัปเดตการแสดงผลหน้าเว็บตามสถานะสิทธิ์ (Admin / User ทั่วไป)
function updateUI() {
    if (isAdmin) {
        adminPanel.classList.remove('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.remove('hidden'));
    } else {
        adminPanel.classList.add('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.add('hidden'));
    }
    renderTasks();
}

// ฟังก์ชันแสดงรายการงานในตาราง
function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0;">ยังไม่มีงานค้างในขณะนี้ 🎉</td></tr>`;
        return;
    }

    tasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        
        // แปลงฟอร์แมตวันที่ให้เป็นแบบไทยอ่านง่าย
        const dateObj = new Date(task.date);
        const thaiDate = task.date ? dateObj.toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'}) : '-';

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td style="font-weight:500; color:var(--dark-blue);">${task.name}</td>
            <td>${task.desc}</td>
            <td><span style="background-color:#ffe3e3; color:#e63946; padding:4px 8px; border-radius:20px; font-size:0.85rem;">${thaiDate}</span></td>
            <td style="font-style: italic; color:#718096;">${task.note || '-'}</td>
            ${isAdmin ? `<td class="admin-action-col"><button class="btn-delete" onclick="deleteTask(${index})"><i class="fa-solid fa-trash"></i></button></td>` : ''}
        `;
        taskList.appendChild(tr);
    });
}

// เพิ่มงานใหม่ (แอดมินเท่านั้น)
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const newTask = {
        name: document.getElementById('task-name').value,
        desc: document.getElementById('task-desc').value,
        date: document.getElementById('task-date').value,
        note: document.getElementById('task-note').value
    };

    tasks.push(newTask);
    localStorage.setItem('classroom_tasks', JSON.stringify(tasks));
    taskForm.reset();
    renderTasks();
});

// ลบงาน (แอดมินเท่านั้น)
window.deleteTask = function(index) {
    if (!isAdmin) return;
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบงานนี้ออก?')) {
        tasks.splice(index, 1);
        localStorage.setItem('classroom_tasks', JSON.stringify(tasks));
        renderTasks();
    }
};

// รันฟังก์ชันตรวจสอบเมื่อเปิดหน้าเว็บครั้งแรก
updateUI();