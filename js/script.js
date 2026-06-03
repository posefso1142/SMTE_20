// ข้อมูล Admin ที่ฟิกซ์ไว้ตามเงื่อนไข
const ADMIN_USER = "ADMIN_SMTE20";
const ADMIN_PASS = "SMTE_202020";

// 🌐 URL ของ Google Apps Script Web App
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCa8KZgXHyv_oDUoRfCQm_L_qLnm2s7c0fGGRZW5XpERYSAxFj9AGpxCiue1oaGdXt/exec";

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

// เช็กสถานะการ Login จากเซสชัน
let isAdmin = sessionStorage.getItem('isAdmin') === 'true';

// 🔄 ตัวแปรเก็บข้อมูลงาน (เปลี่ยนจากโหลด LocalStorage เป็น Array ว่างเพื่อรอโหลดจาก Google Sheets)
let tasks = [];

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

// ฟังก์ชันอัปเดตการแสดงผลหน้าเว็บตามสถานะสิทธิ์
function updateUI() {
    if (isAdmin) {
        if(adminPanel) adminPanel.classList.remove('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.remove('hidden'));
    } else {
        if(adminPanel) adminPanel.classList.add('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.add('hidden'));
    }
    fetchTasksFromSheets(); // ดึงข้อมูลใหม่จาก Google Sheets ทุกครั้งที่อัปเดต UI
}

// ==========================================
// ฟังก์ชัน 1: ดึงข้อมูลจาก Google Sheets
// ==========================================
function fetchTasksFromSheets() {
    if (!taskList) return;

    // แสดงสถานะระหว่างรอโหลดข้อมูล
    taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดตารางงานจาก Google Sheets...</td></tr>`;

    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            tasks = data; // เอาข้อมูลที่ได้เก็บเข้าตัวแปร tasks
            renderTasks(); // สั่งวาดตารางงาน
        })
        .catch(err => {
            console.error("Error fetching tasks:", err);
            taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #e63946; padding: 20px;">❌ ไม่สามารถโหลดข้อมูลตารางงานได้</td></tr>`;
        });
}

// ==========================================
// ฟังก์ชัน 2: วาดตารางงานบนหน้าเว็บ (คงดีไซน์เดิม)
// ==========================================
function renderTasks() {
    taskList.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0; padding: 20px;">ยังไม่มีงานค้างในขณะนี้ 🎉</td></tr>`;
        return;
    }

    tasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        
        // ฟอร์แมตวันที่ให้เป็นแบบไทยอ่านง่ายเหมือนเดิม (รองรับทั้งชื่อตัวแปร .date และ .due_date)
        const taskDate = task.date || task.due_date;
        const dateObj = new Date(taskDate);
        const thaiDate = taskDate ? dateObj.toLocaleDateString('th-TH', {day: 'numeric', month: 'short', year: '2-digit'}) : '-';

        // รองรับโครงสร้างตัวแปรจาก Google Sheets (name หรือ task_name)
        const name = task.name || task.task_name;
        const desc = task.desc || task.task_detail;
        const note = task.note || task.remark;

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td style="font-weight:500; color:var(--dark-blue);">${name}</td>
            <td>${desc}</td>
            <td><span style="background-color:#ffe3e3; color:#e63946; padding:4px 8px; border-radius:20px; font-size:0.85rem;">${thaiDate}</span></td>
            <td style="font-style: italic; color:#718096;">${note || '-'}</td>
            ${isAdmin ? `<td class="admin-action-col"><button class="btn-delete" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button></td>` : ''}
        `;
        taskList.appendChild(tr);
    });
}

// ==========================================
// ฟังก์ชัน 3: เพิ่มงานใหม่ลง Google Sheets (แอดมินเท่านั้น)
// ==========================================
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const submitBtn = taskForm.querySelector("button[type='submit']");
    const taskId = Math.floor(Math.random() * 100000); // สุ่มรหัส id เป็นตัวเลขอ้างอิง

    const newTask = {
        action: "add",
        id: taskId,
        task_name: document.getElementById('task-name').value,
        task_detail: document.getElementById('task-desc').value,
        due_date: document.getElementById('task-date').value,
        remark: document.getElementById('task-note').value
    };

    // ล็อคปุ่มชั่วคราวขณะกำลังส่งข้อมูล
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...`;
    }

    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
    })
    .then(() => {
        alert('➕ เพิ่มงานใหม่ลง Google Sheets สำเร็จ!');
        taskForm.reset();
        fetchTasksFromSheets(); // โดดร่มไปดึงข้อมูลล่าสุดมาแสดงผลใหม่
    })
    .catch(err => {
        console.error("Error adding task:", err);
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    })
    .finally(() => {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-plus"></i> เพิ่มงานใหม่`;
        }
    });
});

// ==========================================
// ฟังก์ชัน 4: ลบงานออกจาก Google Sheets (แอดมินเท่านั้น)
// ==========================================
window.deleteTask = function(idToDelete) {
    if (!isAdmin) return;
    
    if (confirm('⚠️ คุณแน่ใจหรือไม่ที่จะลบงานนี้ออกจาก Google Sheets อย่างถาวร?')) {
        const dataToSend = {
            action: "delete",
            id: idToDelete
        };

        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend)
        })
        .then(() => {
            alert('🗑️ ลบงานออกจากระบบสำเร็จ!');
            fetchTasksFromSheets(); // โหลดข้อมูลล่าสุดมาแสดงผลใหม่
        })
        .catch(err => {
            console.error("Error deleting task:", err);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        });
    }
};

// รันฟังก์ชันตรวจสอบเมื่อเปิดหน้าเว็บครั้งแรก
updateUI();
