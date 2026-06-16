// ==========================================================================
// 📢 ข้อความประกาศประจำสัปดาห์ (เวลาจะเปลี่ยนประกาศ ให้มาแก้ข้อความในเครื่องหมายคำพูดตรงนี้ได้เลยครับ!)
// ==========================================================================
let CURRENT_ANNOUNCEMENT = "ปิดระบบการโอนเงิน";

// โหลดค่าประกาศล่าสุดจากคลังข้อมูลในเบราว์เซอร์ (ถ้ามี) เพื่อให้แอดมินบันทึกเปลี่ยนได้แบบเรียลไทม์
if (localStorage.getItem('savedAnnouncement')) {
    CURRENT_ANNOUNCEMENT = localStorage.getItem('savedAnnouncement');
}

// ข้อมูล Admin ที่ฟิกซ์ไว้ตามเงื่อนไข
const ADMIN_USER = "ADMIN_SMTE20";
const ADMIN_PASS = "SMTE_202020";

// 🌐 URL ของ Google Apps Script Web App (สำหรับระบบตารางงาน)
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

// ตัวแปรเก็บข้อมูลงาน
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
        
        // เมื่อเป็นแอดมิน ให้ดึงประกาศปัจจุบันไปใส่ในช่องกรอกแก้ไขด้วย
        const editAnnounceInput = document.getElementById('edit-announcement-input');
        if (editAnnounceInput) editAnnounceInput.value = CURRENT_ANNOUNCEMENT;
    } else {
        if(adminPanel) adminPanel.classList.add('hidden');
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
// ฟังก์ชัน 2: วาดตารางงานบนหน้าเว็บ (เพิ่มระบบปุ่มแก้ไขดินสอสีเหลืองข้างปุ่มลบ)
// ==========================================
function renderTasks() {
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
// ฟังก์ชัน 3: เพิ่มงานใหม่ลง Google Sheets (แอดมินเท่านั้น)
// ==========================================
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
        fetchTasksFromSheets(); 
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
            fetchTasksFromSheets(); 
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
const announcementText = document.getElementById('announcement-text');
const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');

function loadAnnouncement() {
    if (!announcementText) return;
    announcementText.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${CURRENT_ANNOUNCEMENT}`;
}

// ควบคุมการบันทึกประกาศใหม่
if (saveAnnouncementBtn) {
    saveAnnouncementBtn.addEventListener('click', () => {
        const newAnnounce = document.getElementById('edit-announcement-input').value.trim();
        if (newAnnounce === '') {
            alert('กรุณากรอกข้อความประกาศก่อนบันทึก!');
            return;
        }
        CURRENT_ANNOUNCEMENT = newAnnounce;
        localStorage.setItem('savedAnnouncement', newAnnounce); // เซฟลง LocalStorage เพื่อให้จดจำไว้
        loadAnnouncement();
        alert('💾 บันทึกและเปลี่ยนประกาศประจำสัปดาห์สำเร็จ!');
    });
}

// สั่งให้โหลดประกาศขึ้นมาแสดงผลทันทีที่เปิดหน้าเว็บครั้งแรก
loadAnnouncement();

// ==========================================
// 🌓 ระบบควบคุมการสลับโหมดมืด (Dark Mode / Light Mode)
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');

// ตรวจสอบสถานะสีธีมที่เคยเซฟไว้
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    if (themeToggleBtn) themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggleBtn.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
}

// ==========================================
// ✏️ ระบบเปิด/ปิดและบันทึกหน้าต่างแก้ไขข้อมูลงาน (แก้ไขให้ตรงกับ Google Sheets)
// ==========================================
const editModal = document.getElementById('editModal');
const closeEditModal = document.querySelector('.close-edit-modal');
const editTaskForm = document.getElementById('edit-task-form');

// ฟังก์ชันดึงค่าเดิมมากรอกแล้วเปิด Modal
window.openEditModal = function(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-name').value = task.name || task.task_name || '';
    document.getElementById('edit-task-desc').value = task.desc || task.task_detail || '';
    
    let rawDate = task.date || task.due_date || '';
    if (rawDate.includes('T')) rawDate = rawDate.split('T')[0];
    document.getElementById('edit-task-date').value = rawDate;
    
    document.getElementById('edit-task-note').value = task.note || task.remark || '';

    if (editModal) editModal.classList.add('show');
};

// ปิด Modal เมื่อกดกากบาท
if (closeEditModal) {
    closeEditModal.addEventListener('click', () => {
        if (editModal) editModal.classList.remove('show');
    });
}

// ยืนยันการแก้ไขข้อมูลส่งไป Google Sheets
if (editTaskForm) {
    editTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const submitBtn = editTaskForm.querySelector("button[type='submit']");
        const idToSend = document.getElementById('edit-task-id').value;

        const updatedTask = {
            action: "edit", 
            id: idToSend, // 🌟 ลบ parseInt() ออก เพื่อให้ชนิดข้อมูล (String) ตรงกับใน Google Sheets เป๊ะๆ
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
            fetchTasksFromSheets(); 
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
