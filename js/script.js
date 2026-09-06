// ==========================================================================
// 📢 ประกาศเก็บเงินประจำสัปดาห์ & ระบบแอดมิน
// ==========================================================================
let CURRENT_ANNOUNCEMENT = "กำลังโหลดประกาศ";

// ข้อมูล Admin
const ADMIN_USER = "ADMIN";
const ADMIN_PASS = "SMTE";

// 🌐 1. URL สำหรับจัดการ "ตารางงาน" (Google Apps Script)
const TASKS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCa8KZgXHyv_oDUoRfCQm_L_qLnm2s7c0fGGRZW5XpERYSAxFj9AGpxCiue1oaGdXt/exec";

// 🌐 2. URL สำหรับจัดการ "ประกาศประจำสัปดาห์" (ใส่ URL ใหม่ของคุณตรงนี้)
const ANNOUNCEMENT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCa8KZgXHyv_oDUoRfCQm_L_qLnm2s7c0fGGRZW5XpERYSAxFj9AGpxCiue1oaGdXt/exec";

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
const announcementBox = document.getElementById('announcement-box');

let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let tasks = [];

// ==========================================
// 🎨 ฟังก์ชัน SweetAlert2 Custom Toast/Popup
// ==========================================
function showSuccessToast(title, text = '') {
    Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        confirmButtonColor: '#6366f1'
    });
}

function showErrorToast(title, text = '') {
    Swal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#ef4444'
    });
}

// ==========================================
// 🔐 ระบบเข้าสู่ระบบ / ออกจากระบบ (Login / Logout)
// ==========================================
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (isAdmin) {
            Swal.fire({
                icon: 'info',
                title: 'เข้าสู่ระบบอยู่แล้ว',
                text: 'คุณอยู่ในระบบผู้ดูแลระบบเรียบร้อยแล้วครับ',
                confirmButtonColor: '#6366f1'
            });
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
            
            // ป็อปอัปยินดีต้อนรับแอดมิน
            Swal.fire({
                icon: 'success',
                title: 'เข้าสู่ระบบสำเร็จ!',
                text: 'ยินดีต้อนรับ! กำลังพาคุณไปยังหน้าควบคุม...',
                showConfirmButton: false,
                timer: 1800,
                timerProgressBar: true
            }).then(() => {
                updateUI();
            });
        } else {
            if (loginError) loginError.classList.remove('hidden');
        }
    });
}

// ออกจากระบบ แอดมิน
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'ออกจากระบบ?',
            text: "คุณต้องการออกจากระบบแอดมินใช่หรือไม่",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ใช่, ออกจากระบบ',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                isAdmin = false;
                sessionStorage.removeItem('isAdmin');
                showSuccessToast('ออกจากระบบสำเร็จ!', 'คืนค่าสิทธิ์ผู้ใช้งานทั่วไป');
                updateUI();
            }
        });
    });
}

// ฟังก์ชันอัปเดตการแสดงผลหน้าเว็บตามสถานะสิทธิ์
function updateUI() {
    if (isAdmin) {
        if (adminPanel) adminPanel.classList.remove('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.remove('hidden'));
    } else {
        if (adminPanel) adminPanel.classList.add('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.add('hidden'));
    }
    fetchTasksFromSheets(); 
    fetchAnnouncement();
}

// ==========================================
// 📢 ระบบแสดงผลและแก้ไขประกาศประจำสัปดาห์ (เชื่อมกับ ANNOUNCEMENT_SCRIPT_URL)
// ==========================================
function fetchAnnouncement() {
    if (!announcementBox) return;

    fetch(`${ANNOUNCEMENT_SCRIPT_URL}?action=getAnnouncement`)
        .then(res => res.json())
        .then(data => {
            if (data && data.announcement) {
                CURRENT_ANNOUNCEMENT = data.announcement;
            }
            renderAnnouncement();
        })
        .catch(() => {
            if (localStorage.getItem('savedAnnouncement')) {
                CURRENT_ANNOUNCEMENT = localStorage.getItem('savedAnnouncement');
            }
            renderAnnouncement();
        });
}

function renderAnnouncement() {
    if (!announcementBox) return;
    
    // ปุ่มแก้ไขรูปดินสอจะแสดงเฉพาะแอดมินเท่านั้น
    const editBtnHtml = isAdmin 
        ? `<button onclick="openEditAnnouncementModal()" title="แก้ไขข้อความประกาศ" style="background:none; border:none; color:#6366f1; cursor:pointer; margin-left:8px; font-size:1.05rem; transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'"><i class="fa-solid fa-pen-to-square"></i></button>` 
        : '';

    announcementBox.innerHTML = `
        <p style="margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
            <i class="fa-solid fa-bullhorn" style="color:#4f46e5; margin-right:4px;"></i> 
            <strong>ประกาศสัปดาห์นี้:</strong> 
            <span>${CURRENT_ANNOUNCEMENT}</span>
            ${editBtnHtml}
        </p>
    `;
}

// Popup เปิดแก้ไขประกาศประจำสัปดาห์ (SweetAlert2)
window.openEditAnnouncementModal = function() {
    if (!isAdmin) return;

    Swal.fire({
        title: '✏️ แก้ไขข้อความประกาศ',
        input: 'text',
        inputValue: CURRENT_ANNOUNCEMENT,
        inputPlaceholder: 'กรอกข้อความประกาศใหม่...',
        showCancelButton: true,
        confirmButtonText: 'ตกลง',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b',
        inputValidator: (value) => {
            if (!value.trim()) {
                return 'กรุณากรอกข้อความประกาศก่อนบันทึก!';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const newAnnounce = result.value.trim();
            saveAnnouncement(newAnnounce);
        }
    });
};

// ⚙️ ฟังก์ชันบันทึกประกาศ (ปรับปรุงส่งแบบ URLSearchParams เพื่อเลี่ยงปัญหา CORS)
function saveAnnouncement(newAnnounce) {
    // 1. อัปเดตการแสดงผลหน้าเว็บทันที
    CURRENT_ANNOUNCEMENT = newAnnounce;
    localStorage.setItem('savedAnnouncement', newAnnounce);
    renderAnnouncement();

    // 2. จัดรูปแบบข้อมูลที่จะส่ง
    const formData = new URLSearchParams();
    formData.append("action", "updateAnnouncement");
    formData.append("announcement", newAnnounce);

    // 3. ส่ง POST Request ไปยัง Apps Script
    fetch(ANNOUNCEMENT_SCRIPT_URL, {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data && (data.status === "success" || data.result === "success")) {
            showSuccessToast('บันทึกประกาศสำเร็จ!', 'อัปเดตข้อความประกาศประจำสัปดาห์เรียบร้อยแล้ว');
            fetchAnnouncement(); // ดึงข้อมูลยืนยันอีกครั้ง
        }
    })
    .catch(err => {
        console.error("Error saving announcement:", err);
        // แสดงการแจ้งเตือนสำเร็จ เพราะ Apps Script รับค่าลง Sheets สำเร็จแล้วแม้อ่าน response ไม่ได้
        showSuccessToast('บันทึกประกาศแล้ว', 'อัปเดตข้อความเรียบร้อย');
    });
}

// ==========================================
// ฟังก์ชัน 1: ดึงข้อมูลตารางงานจาก Google Sheets (เชื่อมกับ TASKS_SCRIPT_URL)
// ==========================================
function fetchTasksFromSheets() {
    if (!taskList) return;

    taskList.innerHTML = `<tr><td colspan="${isAdmin ? 6 : 5}" class="text-center" style="color: #a0aec0; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดตารางงานจาก Google Sheets...</td></tr>`;

    fetch(TASKS_SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.tasks) {
                tasks = data.tasks;
            } else if (Array.isArray(data)) {
                tasks = data;
            }
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
            <td style="font-weight:500;">${name}</td>
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
// ฟังก์ชัน 3: เพิ่มงานใหม่ลง Google Sheets (เชื่อมกับ TASKS_SCRIPT_URL)
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

        fetch(TASKS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTask)
        })
        .then(() => {
            showSuccessToast('เพิ่มงานสำเร็จ!', 'บันทึกรายการงานใหม่ลงในตารางเรียบร้อย');
            taskForm.reset();
            setTimeout(() => {
                fetchTasksFromSheets(); 
            }, 1200);
        })
        .catch(err => {
            console.error("Error adding task:", err);
            showErrorToast('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
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
// ฟังก์ชัน 4: ลบงานออกจาก Google Sheets (เชื่อมกับ TASKS_SCRIPT_URL)
// ==========================================
window.deleteTask = function(idToDelete) {
    if (!isAdmin) return;
    
    Swal.fire({
        title: 'ยืนยันการลบงาน?',
        text: "คุณแน่ใจหรือไม่ที่จะลบงานนี้ออกจากตารางอย่างถาวร",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ลบงานนี้',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            const dataToSend = {
                action: "delete",
                id: idToDelete
            };

            fetch(TASKS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dataToSend)
            })
            .then(() => {
                showSuccessToast('ลบงานสำเร็จ!', 'รายการงานถูกลบเรียบร้อยแล้ว');
                setTimeout(() => {
                    fetchTasksFromSheets(); 
                }, 1200);
            })
            .catch(err => {
                console.error("Error deleting task:", err);
                showErrorToast('เกิดข้อผิดพลาด', 'ไม่สามารถลบงานได้');
            });
        }
    });
};

// ==========================================
// ✏️ ระบบเปิด/ปิดและแก้ไขข้อมูลงานในตาราง (เชื่อมกับ TASKS_SCRIPT_URL)
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

        fetch(TASKS_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedTask)
        })
        .then(() => {
            if (editModal) editModal.classList.remove('show');
            showSuccessToast('แก้ไขงานสำเร็จ!', 'อัปเดตข้อมูลรายการงานเรียบร้อยแล้ว');
            setTimeout(() => {
                fetchTasksFromSheets(); 
            }, 1200);
        })
        .catch(err => {
            console.error("Error editing task:", err);
            showErrorToast('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกการแก้ไขได้');
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> บันทึกการแก้ไข`;
            }
        });
    });
}

// ==========================================
// 🌓 ระบบควบคุมการสลับโหมดมืด
// ==========================================
const themeToggleBtn = document.getElementById('themeToggleBtn');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.add('dark-mode');
    if (themeToggleBtn && themeToggleBtn.querySelector('i')) {
        themeToggleBtn.querySelector('i').className = 'fa-solid fa-sun';
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        if (themeToggleBtn.querySelector('i')) {
            themeToggleBtn.querySelector('i').className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    });
}

// รันระบบเริ่มต้น
updateUI();
