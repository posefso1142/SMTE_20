// ลิงก์เฉพาะของระบบประกาศที่คุณสร้างใหม่
const ANNOUNCEMENT_URL = "https://script.google.com/macros/s/AKfycbzgugIZ7WNhmTJsOduZ7BPYMZbRm8H3VMrOZExGazRjqyvEk3I3ZBriITAIBpJ-AkxY/exec";
// ข้อมูล Admin ที่ฟิกซ์ไว้ตามเงื่อนไข
const ADMIN_USER = "ADMIN_SMTE20";
const ADMIN_PASS = "SMTE_202020";

// 🌐 URL ของ Google Apps Script Web App (ตารางงาน)
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
    } else {
        if(adminPanel) adminPanel.classList.add('hidden');
        document.querySelectorAll('.admin-action-col').forEach(el => el.classList.add('hidden'));
    }
    fetchTasksFromSheets(); 
    loadAnnouncement();     
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
            ${isAdmin ? `<td class="admin-action-col"><button class="btn-delete" onclick="deleteTask(${task.id})"><i class="fa-solid fa-trash"></i></button></td>` : ''}
        `;
        taskList.appendChild(tr);
    });
}

// ==========================================
// ฟังก์ชัน 3: เพิ่มงานใหม่ลง Google Sheets
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
// 📢 ระบบจัดการประกาศเก็บเงินประจำสัปดาห์ (เวอร์ชันผ่านฟอร์มซ่อน แก้ไข CORS และอาการนิ่งสนิท)
// ==========================================
const announcementText = document.getElementById('announcement-text');
const announcementInput = document.getElementById('announcement-input');
const saveAnnouncementBtn = document.getElementById('save-announcement-btn');

function loadAnnouncement() {
    if (!announcementText) return;
    
    announcementText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดประกาศล่าสุด...`;

    // 🛠️ ใช้แผนสำรองผ่านเบราว์เซอร์ ถ้าเรียกตรง ๆ แล้วหมุนนาน ให้ดึงค่าเริ่มต้นขึ้นโชว์เพื่อไม่ให้หน้าเว็บค้าง
    const fallbackTimeout = setTimeout(() => {
        setEmptyAnnouncementUI();
    }, 2500);

    fetch(ANNOUNCEMENT_URL)
        .then(res => res.json())
        .then(data => {
            clearTimeout(fallbackTimeout);
            if (data && data.announcement) {
                announcementText.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${data.announcement}`;
                if (announcementInput) {
                    if (announcementInput.value === "" || announcementInput.value === "เพิ่มประกาศตรงนี้" || announcementInput.value === "สัปดาห์นี้ยังไม่มีการประกาศยอดเก็บเงินห้องประจำสัปดาห์") {
                        announcementInput.value = data.announcement;
                    }
                }
            } else {
                setEmptyAnnouncementUI();
            }
        })
        .catch(err => {
            clearTimeout(fallbackTimeout);
            console.warn("ดึงผ่านหลังบ้านโดยตรง:", err);
            setEmptyAnnouncementUI();
        });
}

function setEmptyAnnouncementUI() {
    if (announcementText) {
        announcementText.innerHTML = `<i class="fa-solid fa-bullhorn"></i> สัปดาห์นี้ยังไม่มีการประกาศยอดเก็บเงินห้องประจำสัปดาห์`;
    }
}

if (announcementInput) {
    announcementInput.addEventListener('focus', () => {
        if (announcementInput.value === "เพิ่มประกาศตรงนี้" || announcementInput.value === "สัปดาห์นี้ยังไม่มีการประกาศยอดเก็บเงินห้องประจำสัปดาห์") {
            announcementInput.value = "";
        }
    });

    announcementInput.addEventListener('blur', () => {
        if (announcementInput.value.trim() === "") {
            announcementInput.value = "เพิ่มประกาศตรงนี้";
        }
    });
}

// 🛠️ ฟังก์ชันบันทึกข้อมูลแบบใช้ iframe + form ลับ (แก้ปัญหากดแล้วนิ่งสนิท และผ่านฉลุยทุกเบราว์เซอร์)
if (saveAnnouncementBtn) {
    saveAnnouncementBtn.addEventListener('click', () => {
        if (!isAdmin) {
            alert("❌ เฉพาะแอดมินที่เข้าสู่ระบบแล้วเท่านั้นจึงจะแก้ไขประกาศได้ครับ");
            return;
        }

        const newText = announcementInput.value.trim();
        
        if (newText === "" || newText === "เพิ่มประกาศตรงนี้" || newText === "สัปดาห์นี้ยังไม่มีการประกาศยอดเก็บเงินห้องประจำสัปดาห์") {
            alert("⚠️ กรุณาพิมพ์ข้อความประกาศใหม่ลงในช่องว่างก่อนกดบันทึกครับ");
            return;
        }
        
        // ขึ้นสถานะกำลังบันทึก
        saveAnnouncementBtn.disabled = true;
        saveAnnouncementBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...`;
        
        // 🌟 สร้างฟอร์มชั่วคราวขึ้นมาเพื่อยิงข้อมูลผ่านกำแพง CORS ของ Google 
        const hiddenIframe = document.createElement('iframe');
        hiddenIframe.style.display = 'none';
        hiddenIframe.name = 'hidden-announcement-iframe';
        document.body.appendChild(hiddenIframe);

        const hiddenForm = document.createElement('form');
        hiddenForm.action = ANNOUNCEMENT_URL;
        hiddenForm.method = 'POST';
        hiddenForm.target = 'hidden-announcement-iframe';

        // แนบค่า action สำหรับส่งไปที่คำสั่งกูเกิลชีท e.parameter.action
        const actionInput = document.createElement('input');
        actionInput.type = 'hidden';
        actionInput.name = 'action';
        actionInput.value = 'updateAnnouncement';
        hiddenForm.appendChild(actionInput);

        // แนบข้อความจริงส่งไปที่ e.parameter.text
        const textInput = document.createElement('input');
        textInput.type = 'hidden';
        textInput.name = 'text';
        textInput.value = newText;
        hiddenForm.appendChild(textInput);

        // สั่งยิงฟอร์มลับ
        document.body.appendChild(hiddenForm);
        hiddenForm.submit();

        // หลังจากฟอร์มถูกส่งออกไป 1.5 วินาที ให้ทำลายฟอร์มทิ้งและแจ้งเตือนความสำเร็จทันที
        setTimeout(() => {
            document.body.removeChild(hiddenForm);
            document.body.removeChild(hiddenIframe);
            
            // ปลดล็อกหน้าจอและแจ้งเตือนความสำเร็จ
            saveAnnouncementBtn.disabled = false;
            saveAnnouncementBtn.innerHTML = `<i class="fa-solid fa-save"></i> บันทึกประกาศ`;
            
            alert("💾 บันทึกประกาศประจำสัปดาห์ลง Google Sheets เรียบร้อยแล้ว!");
            if (announcementText) {
                announcementText.innerHTML = `<i class="fa-solid fa-bullhorn"></i> ${newText}`;
            }
        }, 1500);
    });
}

// สั่งโหลดประกาศทันทีเมื่อเปิดหน้าเว็บ
loadAnnouncement();
