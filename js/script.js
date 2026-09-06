// ==========================================================================
// 📢 ข้อความประกาศประจำสัปดาห์
// ==========================================================================
let CURRENT_ANNOUNCEMENT = "ปิดระบบการโอนเงิน";

if (localStorage.getItem('savedAnnouncement')) {
    CURRENT_ANNOUNCEMENT = localStorage.getItem('savedAnnouncement');
}

// ข้อมูล Admin
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

let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let tasks = [];

// ฟังก์ชันเปิด/ปิด Modal Login
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (isAdmin) {
            alert('คุณเข้าสู่ระบบแอดมินอยู่แล้วครับ!');
        } else {
            if (loginModal) loginModal.classList.add('show');
        }
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (loginModal) loginModal.classList.remove('show');
        clearLoginForm();
    });
}

function clearLoginForm() {
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (loginError) loginError.classList.add('hidden');
}

// ตรวจสอบการ Login
if (submitLogin) {
    submitLogin.addEventListener('click', () => {
        const user = usernameInput ? usernameInput.value.trim() : '';
        const pass = passwordInput ? passwordInput.value.trim() : '';

        if (user === ADMIN_USER && pass === ADMIN_PASS) {
            isAdmin = true;
            sessionStorage.setItem('isAdmin', 'true');
            if (loginModal) loginModal.classList.remove('show');
            clearLoginForm();
            updateUI();
        } else {
            if (loginError) loginError.classList.remove('hidden');
        }
    });
}

// ออกจากระบบ แอดมิน
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        isAdmin = false;
        sessionStorage.removeItem('isAdmin');
        updateUI();
    });
}

// ฟังก์ชันอัปเดตการแสดงผลหน้าเว็บตามสถานะสิทธิ์
function updateUI() {
    if (isAdmin) {
        if (adminPanel) adminPanel.classList.remove('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.remove('hidden'));
        
        const editAnnounceInput = document.getElementById('edit-announcement-input');
        if (editAnnounceInput) editAnnounceInput.value = CURRENT_ANNOUNCEMENT;
    } else {
        if (adminPanel) adminPanel.classList.add('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.add('hidden'));
    }
    fetchTasksFromSheets(); 
}

// ==========================================
// ฟังก์ชัน 1: ดึงข้อมูลจาก Google Sheets (ตารางงาน)
// ==========================================
function fetchTasksFromSheets() {
    if (!taskList) return;

    taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดตารางงานจาก Google Sheets...</td></tr>`;

    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            tasks = data; 
            renderTasks(); 
        })
        .catch(err => {
            console.error("Error fetching tasks:", err);
            taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #e63946; padding: 20px;">❌ ไม่สามารถโหลดข้อมูลตารางงานได้</td></tr>`;
        });
}

// ==========================================
// ฟังก์ชัน 2: วาดตารางงานบนหน้าเว็บ
// ==========================================
function renderTasks() {
    if (!taskList) return;
    taskList.innerHTML = '';
    
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0; padding: 20px;">ยังไม่มีงานค้างในขณะนี้ 🎉</td></tr>`;
        return;
    }

    tasks.forEach((task, index) => {
        const tr = document.createElement('tr');
        const taskDate = task.date || task.due_date;
        let thaiDate = '-';

        if (taskDate) {
            const safeDateStr = taskDate.replace(/-/g, "/");
            const dateObj = new Date(safeDateStr);
            
            if (!isNaN(dateObj.getTime())) {
                thaiDate = dateObj.toLocaleDateString('th-TH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                });
            } else {
                thaiDate = taskDate; 
            }
        }

        const name = task.name || task.task_name;
        const desc = task.desc || task.task_detail;
        const note = task.note || task.remark;

        tr.innerHTML = `
            <td>${index + 1}</td>
            <td style="font-weight:500; color:var(--dark-blue);">${name}</td>
            <td>${desc}</td>
            <td><span style="background-color:#ffe3e3; color:#e63946; padding:4px 10px; border-radius:20px; font-size:0.85rem; white-space: nowrap; display: inline-block; font-weight: 500;">${thaiDate}</span></td>
            <td style="font-style: italic; color:#718096;">${note || '-'}</td>
            ${isAdmin ? `
                <td class="admin-action-col">
                    <button class="btn-edit" onclick="openEditModal(${task.id})" title="แก้ไขงาน"><i class="fa-solid fa-pencil"></i></button>
                    <button class="btn-delete" onclick="deleteTask(${task.id})" title="ลบงาน"><i class="fa-solid fa-trash"></i></button>
                </td>
            ` : ''}
        `;
        taskList.appendChild(tr);
    });
}

// ==========================================
// ฟังก์ชัน 3: เพิ่มงานใหม่ลง Google Sheets
// ==========================================
if (taskForm) {
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const submitBtn = taskForm.querySelector("button[type='submit']");
        const taskId = Math.floor(Math.random() * 100000); 

        const newTask = {
            action: "add",
            id: taskId,
            task_name: document.getElementById('task-name').value,
            task_detail: document.getElementById('task-desc').value,
            due_date: document.getElementById('task-date').value,
            remark: document.getElementById('task-note').value
        };

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
            // หน่วงเวลา 1.5 วินาที เพื่อรอให้ Google Sheets บันทึกข้อมูลเสร็จเรียบร้อย
            setTimeout(() => {
                fetchTasksFromSheets(); 
            }, 1500);
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
}

// ==========================================
// ฟังก์ชัน 4: ลบงานออกจาก Google Sheets
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
            setTimeout(() => {
                fetchTasksFromSheets(); 
            }, 1500);
        })
        .catch(err => {
            console.error("Error deleting task:", err);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล");
        });
    }
};

// รันฟังก์ชันตรวจสอบเมื่อเปิดหน้าเว็บครั้งแรก
updateUI();

// ==========================================
// 📢 ระบบแสดงผลและจัดการบันทึกประกาศ
// ==========================================
const announcementBox = document.getElementById('announcement-box'); 
const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');

function loadAnnouncement() {
    if (!announcementBox) return;
    announcementBox.innerHTML = `<p><i class="fa-solid fa-bullhorn"></i> ประกาศสัปดาห์นี้: ${CURRENT_ANNOUNCEMENT}</p>`;
}

if (saveAnnouncementBtn) {
    saveAnnouncementBtn.addEventListener('click', () => {
        const editInput = document.getElementById('edit-announcement-input');
        const newAnnounce = editInput ? editInput.value.trim() : '';
        if (newAnnounce === '') {
            alert('กรุณากรอกข้อความประกาศก่อนบันทึก!');
            return;
        }
        CURRENT_ANNOUNCEMENT = newAnnounce;
        localStorage.setItem('savedAnnouncement', newAnnounce);
        loadAnnouncement();
        alert('💾 บันทึกและเปลี่ยนประกาศประจำสัปดาห์สำเร็จ!');
    });
}

loadAnnouncement();

// ==========================================
// 🌓 ระบบควบคุมการสลับโหมดมืด
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggleBtn && themeToggleBtn.querySelector('i')) {
        themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (themeToggleBtn.querySelector('i')) {
            themeToggleBtn.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    });
}

// ==========================================
// ✏️ ระบบเปิด/ปิดและบันทึกหน้าต่างแก้ไขข้อมูลงาน
// ==========================================
const editModal = document.getElementById('editModal');
const closeEditModal = document.querySelector('.close-edit-modal');
const editTaskForm = document.getElementById('edit-task-form');

window.openEditModal = function(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    if(document.getElementById('edit-task-id')) document.getElementById('edit-task-id').value = task.id;
    if(document.getElementById('edit-task-name')) document.getElementById('edit-task-name').value = task.name || task.task_name || '';
    if(document.getElementById('edit-task-desc')) document.getElementById('edit-task-desc').value = task.desc || task.task_detail || '';
    
    let rawDate = task.date || task.due_date || '';
    if (rawDate.includes('T')) rawDate = rawDate.split('T')[0];
    if(document.getElementById('edit-task-date')) document.getElementById('edit-task-date').value = rawDate;
    
    if(document.getElementById('edit-task-note')) document.getElementById('edit-task-note').value = task.note || task.remark || '';

    if (editModal) editModal.classList.add('show');
};

if (closeEditModal) {
    closeEditModal.addEventListener('click', () => {
        if (editModal) editModal.classList.remove('show');
    });
}

if (editTaskForm) {
    editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const submitBtn = editTaskForm.querySelector("button[type='submit']");
        const idToSend = document.getElementById('edit-task-id').value;

        const updatedTask = {
            action: "edit", 
            id: idToSend,
            task_name: document.getElementById('edit-task-name').value,
            task_detail: document.getElementById('edit-task-desc').value,
            due_date: document.getElementById('edit-task-date').value,
            remark: document.getElementById('edit-task-note').value
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...`;
        }

        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask)
        })
        .then(() => {
            alert('📝 แก้ไขข้อมูลงานใน Google Sheets สำเร็จ!');
            if (editModal) editModal.classList.remove('show');
            setTimeout(() => {
                fetchTasksFromSheets(); 
            }, 1500);
        })
        .catch(err => {
            console.error("Error editing task:", err);
            alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข`;
            }
        });
    });
}
