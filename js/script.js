// =============================================
// نظام إدارة العملاء - الوظائف الرئيسية
// =============================================

// التحكم في القائمة الجانبية داخل الـ iframe
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const btn = document.querySelector('#btn');
    sidebar.classList.toggle('close');
    
    if(sidebar.classList.contains('close')) {
        btn.textContent = '☰';
    } else {
        btn.textContent = '×';
    }
}

// تهيئة الصفحة الرئيسية وإعداد الأحداث
document.addEventListener('DOMContentLoaded', function() {
    const sidebarFrame = document.getElementById('sidebar-frame');
    const homeSection = document.querySelector('.home-section');

    // الاستماع لرسائل من الـ iframe
    window.addEventListener('message', function(event) {
        if (event.data === 'toggleSidebar') {
            homeSection.classList.toggle('sidebar-close');
        } else if (event.data.type === 'loadPage') {
            loadPageContent(event.data.page);
        }
    });

    // تهيئة صفحة العملاء
    if (document.getElementById('clientsTableBody')) {
        displayClients();
        setupSearch();
    }
});

// تحميل محتوى الصفحات المختلفة بشكل ديناميكي
async function loadPageContent(page) {
    const homeSection = document.querySelector('.home-section');
    console.log('Loading page:', page);
    
    try {
        let content;
        switch(page) {
            case 'home':
                content = `<div class="text">الصفحة الرئيسية</div>`;
                break;
            case 'fawry':
                const fawryResponse = await fetch('fawry.html');
                content = await fawryResponse.text();
                break;
            case 'clients':
                content = `
                <div class="clients-container">
                    <h2>إدارة العملاء</h2>
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="بحث عن عميل...">
                    </div>
                    <button id="addClientBtn" onclick="addNewClient()">إضافة عميل جديد</button>
                    <div class="table-container">
                        <table class="clients-table">
                            <thead>
                                <tr>
                                    <th>كود العميل</th>
                                    <th>اسم العميل</th>
                                    <th>رقم الهاتف</th>
                                    <th>إجمالي الرصيد</th>
                                    <th>العنوان</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody id="clientsTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>`;
                break;
            default:
                content = `<div class="text">الصفحة غير موجودة</div>`;
        }
        homeSection.innerHTML = content;

        // تهيئة صفحة العملاء بعد تحميلها
        if (page === 'clients') {
            displayClients();
            setupSearch();
        }
    } catch (error) {
        console.error('Error loading content:', error);
        homeSection.innerHTML = `<div class="text">حدث خطأ في تحميل المحتوى: ${error.message}</div>`;
    }
}

// بيانات العملاء
const clients = [
    { 
        id: 1, 
        name: "أحمد محمد", 
        phone: "01012345678", 
        address: "القاهرة", 
        balance: {
            type: "فوري",
            amount: 5000
        }
    },
    { 
        id: 2, 
        name: "محمد علي", 
        phone: "01123456789", 
        address: "الإسكندرية", 
        balance: {
            type: "امان",
            amount: 3500
        }
    },
    { 
        id: 3, 
        name: "علي أحمد", 
        phone: "01234567890", 
        address: "الجيزة", 
        balance: {
            type: "كاش",
            amount: 7000
        }
    }
];

// عرض العملاء في الجدول
function displayClients(clientsToShow = clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    clientsToShow.forEach(client => {
        // حساب إجمالي الرصيد
        const totalBalance = client.balance ? parseFloat(client.balance.amount) : 0;
        const isDebtor = totalBalance < 0;
        
        // تنسيق العنوان
        const formattedAddress = formatAddress(client.address);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.id}</td>
            <td>${client.name} ${isDebtor ? '<span class="debtor-label">مدين</span>' : ''}</td>
            <td>${client.phone}</td>
            <td class="${isDebtor ? 'negative-balance' : ''}">${isDebtor ? '-' : ''}${Math.abs(totalBalance).toFixed(2)} جنيه</td>
            <td class="address-cell">${formattedAddress}</td>
            <td class="actions-cell">
                <button class="action-btn send-btn" onclick="handleTransaction(${client.id}, 'send')">
                    <i class="fas fa-paper-plane"></i>
                    إرسال
                </button>
                <button class="action-btn receive-btn" onclick="handleTransaction(${client.id}, 'receive')">
                    <i class="fas fa-hand-holding-usd"></i>
                    استلام
                </button>
                <button class="action-btn edit-btn" onclick="editClient(${client.id})">
                    <i class="fas fa-edit"></i>
                    تعديل
                </button>
                <button class="action-btn delete-btn" onclick="deleteClient(${client.id})">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// دالة لتنسيق العنوان
function formatAddress(address) {
    if (!address) return '';
    
    // تقسيم العنوان عند الفواصل أو علامات الترقيم
    const parts = address.split(/[,،]/);
    
    // تنظيف الأجزاء وإزالة المسافات الزائدة
    const cleanParts = parts
        .map(part => part.trim())
        .filter(part => part.length > 0);
    
    // إعادة تجميع العنوان مع علامات HTML للتنسيق
    return cleanParts.join('<br>');
}

// معالجة عمليات الإرسال والاستلام
function handleTransaction(clientId, type) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (type === 'send') {
        // الحصول على تاريخ اليوم والوقت الحالي
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const currentHour = today.getHours();

        // إنشاء خيارات الأيام والشهور والسنوات والساعات
        const daysOptions = Array.from({length: 31}, (_, i) => `<option value="${i + 1}" ${i + 1 === currentDay ? 'selected' : ''}>${i + 1}</option>`).join('');
        const monthsOptions = Array.from({length: 12}, (_, i) => `<option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>${i + 1}</option>`).join('');
        const yearsOptions = Array.from({length: 10}, (_, i) => {
            const year = currentYear + i;
            return `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`;
        }).join('');
        const hoursOptions = Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === currentHour ? 'selected' : ''}>${i}:00</option>`).join('');

        // إظهار النافذة المنبثقة للإرسال
        const modalHtml = `
            <div id="sendModal" class="modal">
                <div class="modal-content">
                    <span class="close-btn" onclick="closeModal('sendModal')">&times;</span>
                    <h3>إرسال رصيد</h3>
                    <div class="modal-scroll-content">
                        <div class="client-info">
                            <p><strong>كود العميل:</strong> ${client.id}</p>
                            <p><strong>اسم العميل:</strong> ${client.name}</p>
                            <p><strong>الرصيد الحالي:</strong> ${client.balance ? client.balance.amount : 0} جنيه (${client.balance ? client.balance.type : 'غير محدد'})</p>
                        </div>
                        <div class="form-group amount-section">
                            <label for="amount">المبلغ:</label>
                            <div class="amount-container">
                                <div class="amount-input-wrapper">
                                    <div class="amount-field">
                                        <input type="text" 
                                               id="amount" 
                                               class="form-control amount-input"
                                               oninput="updateRemainingBalance(this.value, '${client.balance ? client.balance.amount : 0}')"
                                               placeholder="أدخل المبلغ">
                                    </div>
                                </div>
                                <select id="balanceType" class="form-control balance-type-select">
                                    <option value="فوري">فوري</option>
                                    <option value="امان">أمان</option>
                                    <option value="كاش">كاش</option>
                                </select>
                            </div>
                            <div class="balance-info">
                                <p id="remainingBalance" class="remaining-balance">الرصيد المتبقي: ${client.balance ? client.balance.amount : 0}</p>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>نوع الدفع:</label>
                            <div class="payment-type-container">
                                <label class="radio-label">
                                    <input type="radio" name="paymentType" value="current" checked onchange="togglePaymentFields()">
                                    <span>دفع حالي</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="paymentType" value="delayed" onchange="togglePaymentFields()">
                                    <span>دفع آجل</span>
                                </label>
                            </div>
                        </div>
                        <div id="paymentDateFields" class="form-group payment-date-fields" style="display: none;">
                            <label>تاريخ السداد:</label>
                            <div class="date-inputs-container">
                                <div class="date-input-group">
                                    <div class="date-input-wrapper">
                                        <input type="number" id="paymentDay" class="date-input" min="1" max="31" value="${currentDay}">
                                        <select class="date-select" onchange="document.getElementById('paymentDay').value = this.value">
                                            ${daysOptions}
                                        </select>
                                    </div>
                                    <div class="date-input-wrapper">
                                        <input type="number" id="paymentMonth" class="date-input" min="1" max="12" value="${currentMonth}">
                                        <select class="date-select" onchange="document.getElementById('paymentMonth').value = this.value">
                                            ${monthsOptions}
                                        </select>
                                    </div>
                                    <div class="date-input-wrapper">
                                        <input type="number" id="paymentYear" class="date-input" min="${currentYear}" max="${currentYear + 10}" value="${currentYear}">
                                        <select class="date-select" onchange="document.getElementById('paymentYear').value = this.value">
                                            ${yearsOptions}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="time-input-container">
                                <div class="time-toggle">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="enableTime" onchange="toggleTimeInputs(this.checked)">
                                        <span class="checkbox-text">تحديد وقت السداد</span>
                                    </label>
                                </div>
                                <div class="time-inputs-group" style="display: none;">
                                    <div class="time-input-wrapper">
                                        <input type="text" id="paymentHour" class="time-input" value="12" readonly disabled>
                                        <select class="time-select" onchange="document.getElementById('paymentHour').value = this.value" disabled>
                                            ${Array.from({ length: 12 }, (_, i) => {
                                                const hour = (i + 1).toString().padStart(2, '0');
                                                return `<option value="${hour}">${hour}</option>`;
                                            }).join('')}
                                        </select>
                                    </div>
                                    <select id="timePeriod" class="period-select" disabled>
                                        <option value="مساءً" selected>مساءً</option>
                                        <option value="صباحاً">صباحاً</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="button-group">
                        <button onclick="submitTransfer(${client.id})" class="submit-btn">تأكيد</button>
                        <button onclick="closeModal('sendModal')" class="cancel-btn">إلغاء</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // إضافة مستمعي الأحداث لتزامن القيم
        ['Day', 'Month', 'Year', 'Hour'].forEach(type => {
            const input = document.getElementById(`payment${type}`);
            if (input) {
                const select = input.parentElement.querySelector('select');
                
                input.addEventListener('input', function() {
                    const value = this.value;
                    if (value && value >= this.min && value <= this.max) {
                        select.value = value;
                    }
                });
            }
        });

        // إظهار النافذة المنبثقة
        const modal = document.getElementById('sendModal');
        modal.style.display = 'block';
    }
}

// تحديث الرصيد المتبقي
function updateRemainingBalance(inputValue, currentBalance) {
    const amountInput = document.getElementById('amount');
    const remainingBalance = document.getElementById('remainingBalance');
    
    // تنظيف المدخلات (إزالة أي أحرف غير رقمية)
    let amount = inputValue.replace(/[^\d.]/g, '');
    
    // التأكد من عدم وجود أكثر من نقطة عشرية واحدة
    const decimalCount = (amount.match(/\./g) || []).length;
    if (decimalCount > 1) {
        amount = amount.replace(/\./g, function(match, index, original) {
            return index === original.indexOf('.') ? match : '';
        });
    }
    
    // تحديث قيمة حقل المبلغ
    amountInput.value = amount;
    
    // حساب الرصيد المتبقي
    const remaining = parseFloat(currentBalance) - (amount ? parseFloat(amount) : 0);
    const formattedRemaining = remaining.toFixed(2);
    
    // تحديث عرض الرصيد المتبقي مع تغيير اللون حسب القيمة
    remainingBalance.innerHTML = `
        <div class="balance-details">
            <span class="balance-label">الرصيد المتبقي:</span>
            <span class="balance-value ${remaining < 0 ? 'negative' : 'positive'}">
                ${formattedRemaining}
            </span>
        </div>
    `;
}

// تنفيذ عملية التحويل
function submitTransfer(clientId) {
    const client = clients.find(c => c.id === clientId);
    const amount = parseFloat(document.getElementById('amount').value);
    const balanceType = document.getElementById('balanceType').value;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    
    if (!amount || isNaN(amount) || amount <= 0) {
        showAlert('الرجاء إدخال مبلغ صحيح', 'error');
        return;
    }

    const currentBalance = parseFloat(client.balance ? client.balance.amount : 0);
    const newBalance = currentBalance - amount;

    if (paymentType === 'current') {
        // التحقق من كفاية الرصيد للدفع الفوري
        if (newBalance < 0) {
            showAlert('عذراً، الرصيد غير كافي لإتمام العملية', 'error');
            return;
        }

        // تحديث رصيد العميل للدفع الفوري
        client.balance = {
            amount: newBalance.toFixed(2),
            type: balanceType
        };
        
        showAlert(`تم خصم ${amount} من رصيد العميل. الرصيد الجديد: ${newBalance.toFixed(2)}`, 'success');
    } else {
        // معالجة الدفع الآجل
        const day = document.getElementById('paymentDay').value;
        const month = document.getElementById('paymentMonth').value;
        const year = document.getElementById('paymentYear').value;
        const isTimeEnabled = document.getElementById('enableTime').checked;

        // التحقق من إدخال التاريخ كاملاً
        if (!day || day === "اليوم") {
            showAlert('الرجاء تحديد يوم السداد', 'error');
            return;
        }
        if (!month || month === "الشهر") {
            showAlert('الرجاء تحديد شهر السداد', 'error');
            return;
        }
        if (!year || year === "السنة") {
            showAlert('الرجاء تحديد سنة السداد', 'error');
            return;
        }

        // التحقق من صحة التاريخ
        const selectedDate = new Date(year, month - 1, day);
        const currentDate = new Date();
        
        if (isNaN(selectedDate.getTime())) {
            showAlert('الرجاء إدخال تاريخ صحيح', 'error');
            return;
        }

        if (selectedDate < currentDate) {
            showAlert('لا يمكن تحديد تاريخ سابق للتاريخ الحالي', 'error');
            return;
        }

        // تجميع معلومات الوقت والتاريخ
        let paymentDate = `${day}/${month}/${year}`;
        if (isTimeEnabled) {
            const hour = document.getElementById('paymentHour').value;
            const period = document.getElementById('timePeriod').value;
            
            if (hour === "الساعة") {
                showAlert('الرجاء تحديد ساعة السداد', 'error');
                return;
            }
            
            paymentDate += ` ${hour}:00 ${period}`;
        }

        // تحديث رصيد العميل للدفع الآجل
        client.balance = {
            amount: newBalance.toFixed(2),
            type: balanceType
        };

        // إضافة المعاملة للمدفوعات الآجلة
        if (!client.delayedPayments) {
            client.delayedPayments = [];
        }

        client.delayedPayments.push({
            amount: amount,
            dueDate: paymentDate,
            balanceType: balanceType,
            status: 'pending'
        });

        showAlert(`تم تسجيل المبلغ ${amount} كدفعة آجلة بتاريخ ${paymentDate} وتم خصمه من الرصيد. الرصيد الجديد: ${newBalance.toFixed(2)}`, 'success');
    }

    // تحديث عرض الجدول
    displayClients();
    
    // إغلاق النافذة المنبثقة
    closeModal('sendModal');
}

// دالة عرض التنبيهات
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // تنسيق التنبيه
    Object.assign(alertDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        zIndex: '9999',
        direction: 'rtl',
        backgroundColor: type === 'success' ? '#4CAF50' : '#f44336',
        color: 'white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        minWidth: '300px',
        fontSize: '14px',
        fontWeight: 'bold'
    });
    
    document.body.appendChild(alertDiv);
    
    // إزالة التنبيه بعد 3 ثواني
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// إغلاق النافذة المنبثقة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// البحث عن العملاء
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredClients = clients.filter(client => 
                client.name.toLowerCase().includes(searchTerm) ||
                client.phone.includes(searchTerm) ||
                client.address.toLowerCase().includes(searchTerm)
            );
            displayClients(filteredClients);
        });
    }
}

// تغيير نوع الرصيد
function showBalanceTypes(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const balanceType = prompt(`
        اختر نوع الرصيد:
        1. فوري
        2. امان
        3. كاش
        4. خزينة
        
        النوع الحالي: ${client.balance.type}
    `);

    if (!balanceType) return;

    const types = {
        '1': 'فوري',
        '2': 'امان',
        '3': 'كاش',
        '4': 'خزينة'
    };

    if (types[balanceType]) {
        client.balance.type = types[balanceType];
        displayClients();
    }
}

// تعديل بيانات عميل
function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) return;

    const name = prompt("اسم العميل:", client.name);
    if (!name) return;
    
    const phone = prompt("رقم الهاتف:", client.phone);
    if (!phone) return;
    
    const address = prompt("العنوان:", client.address);
    if (!address) return;
    
    const amount = prompt("الرصيد:", client.balance.amount);
    if (!amount) return;

    client.name = name;
    client.phone = phone;
    client.address = address;
    client.balance.amount = parseFloat(amount);

    displayClients();
}

// حذف عميل
function deleteClient(id) {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
        clients = clients.filter(client => client.id !== id);
        displayClients();
    }
}

// إضافة عميل جديد
function addNewClient() {
    const modal = document.getElementById('addClientModal');
    const form = document.getElementById('addClientForm');
    
    // عرض النافذة المنبثقة
    modal.style.display = 'block';
    
    // إعادة تعيين النموذج
    form.reset();
    
    // معالجة تقديم النموذج
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const newName = document.getElementById('newClientName').value;
        const newPhone = document.getElementById('newClientPhone').value;
        
        // التحقق من وجود العميل بنفس الاسم أو رقم الهاتف
        const existingClient = clients.find(client => 
            client.name === newName || client.phone === newPhone
        );
        
        if (existingClient) {
            showAlert('هذا العميل موجود بالفعل! يرجى التحقق من الاسم ورقم الهاتف.');
            return;
        }
        
        // إنشاء عميل جديد
        const newClient = {
            id: clients.length + 1,
            name: newName,
            phone: newPhone,
            address: document.getElementById('newClientAddress').value,
            balance: {
                type: document.getElementById('balanceType').value,
                amount: parseFloat(document.getElementById('newClientBalance').value) || 0
            }
        };
        
        // إضافة العميل إلى المصفوفة
        clients.push(newClient);
        
        // تحديث عرض الجدول
        displayClients();
        
        // إغلاق النافذة المنبثقة
        modal.style.display = 'none';
        
        // عرض رسالة نجاح
        showAlert('تم إضافة العميل بنجاح!', 'success');
    };
}

// =============================================
// الأنماط CSS
// =============================================
const styles = `
    .clients-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .search-box {
        margin-bottom: 15px;
    }

    .search-box input {
        width: 100%;
        padding: 12px;
        border: 2px solid #eee;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .search-box input:focus {
        border-color: #2196F3;
        outline: none;
        box-shadow: 0 0 5px rgba(33,150,243,0.3);
    }

    #addClientBtn {
        background-color: #4CAF50;
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
    }

    #addClientBtn:hover {
        background-color: #45a049;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    #addClientBtn:before {
        content: '+';
        font-size: 18px;
        font-weight: bold;
    }

    .table-container {
        overflow-x: auto;
        margin-top: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .clients-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        min-width: 800px;
    }

    .clients-table th,
    .clients-table td {
        padding: 15px;
        text-align: right;
        border-bottom: 1px solid #eee;
    }

    .clients-table th {
        background-color: #f8f9fa;
        font-weight: bold;
        color: #333;
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 1;
    }

    .clients-table th:first-child {
        border-radius: 0 8px 0 0;
    }

    .clients-table th:last-child {
        border-radius: 8px 0 0 0;
    }

    .clients-table tr:last-child td:first-child {
        border-radius: 0 0 8px 0;
    }

    .clients-table tr:last-child td:last-child {
        border-radius: 0 0 0 8px;
    }

    .clients-table tr:hover {
        background-color: #f5f9ff;
    }

    .clients-table td {
        vertical-align: middle;
    }

    .actions-cell {
        white-space: nowrap;
        display: flex;
        gap: 5px;
        justify-content: flex-end;
    }

    .action-btn {
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 13px;
    }

    .action-btn i {
        font-size: 14px;
    }

    .send-btn {
        background-color: #2196F3;
        color: white;
    }

    .send-btn:hover {
        background-color: #1976D2;
        transform: translateY(-2px);
    }

    .receive-btn {
        background-color: #4CAF50;
        color: white;
    }

    .receive-btn:hover {
        background-color: #45a049;
        transform: translateY(-2px);
    }

    .edit-btn {
        background-color: #FF9800;
        color: white;
    }

    .edit-btn:hover {
        background-color: #F57C00;
        transform: translateY(-2px);
    }

    .delete-btn {
        background-color: #f44336;
        color: white;
    }

    .delete-btn:hover {
        background-color: #d32f2f;
        transform: translateY(-2px);
    }

    .transaction-modal .modal-content {
        max-width: 400px;
    }

    .transaction-modal label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    .transaction-modal input,
    .transaction-modal select {
        width: 100%;
        padding: 10px;
        border: 2px solid #eee;
        border-radius: 8px;
        margin-bottom: 15px;
    }

    #addClientModal {
        display: none;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        overflow-y: auto;
        padding: 20px;
    }

    #addClientModal .modal-content {
        background-color: #fff;
        margin: 20px auto;
        padding: 30px;
        border-radius: 12px;
        width: 90%;
        max-width: 500px;
        position: relative;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
        from {
            transform: translateY(-50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    #addClientForm {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group label {
        font-weight: bold;
        color: #333;
    }

    .form-group input {
        padding: 12px;
        border: 2px solid #eee;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .form-group input:focus {
        border-color: #2196F3;
        outline: none;
        box-shadow: 0 0 5px rgba(33,150,243,0.3);
    }

    .balance-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .balance-input-group {
        display: flex;
        gap: 10px;
    }

    .balance-input-group input {
        flex: 1;
    }

    .balance-input-group select {
        padding: 12px;
        border: 2px solid #eee;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .balance-input-group select:focus {
        border-color: #2196F3;
        outline: none;
        box-shadow: 0 0 5px rgba(33,150,243,0.3);
    }

    .modal-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
    }

    .modal-buttons button {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }

    .modal-buttons button[type="submit"] {
        background-color: #4CAF50;
        color: white;
    }

    .modal-buttons button[type="submit"]:hover {
        background-color: #45a049;
        transform: translateY(-2px);
    }

    .modal-buttons button[type="button"] {
        background-color: #f44336;
        color: white;
    }

    .modal-buttons button[type="button"]:hover {
        background-color: #d32f2f;
        transform: translateY(-2px);
    }

    .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 2000;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    }
    
    .alert-error {
        background-color: #f44336;
    }
    
    .alert-success {
        background-color: #4CAF50;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    .clients-table td.address-cell {
        max-width: 200px;
        white-space: normal;
        line-height: 1.5;
        padding: 12px 15px;
    }

    .clients-table td.address-cell br {
        content: '';
        display: block;
        margin: 5px 0;
    }

    @media screen and (max-width: 768px) {
        .clients-container {
            padding: 10px;
        }

        .search-box {
            flex-direction: column;
        }

        .search-box input {
            width: 100%;
        }

        #addClientBtn {
            width: 100%;
            justify-content: center;
        }

        .clients-table th,
        .clients-table td {
            padding: 10px;
        }

        .action-btn {
            padding: 6px 12px;
            font-size: 12px;
        }

        #addClientModal .modal-content {
            padding: 20px;
        }
    }

    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
        overflow: hidden;
    }

    .modal-content {
        position: relative;
        background-color: #fefefe;
        margin: 20px auto;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    .modal-scroll-content {
        flex: 1;
        overflow-y: auto;
        padding-right: 10px;
        margin-bottom: 20px;
    }

    .button-group {
        position: sticky;
        bottom: 0;
        background-color: #fefefe;
        padding: 15px 0 0;
        margin-top: auto;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: center;
        gap: 10px;
        z-index: 10;
    }

    .submit-btn, .cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        min-width: 100px;
        transition: all 0.3s ease;
    }

    .submit-btn {
        background-color: #4CAF50;
        color: white;
    }

    .submit-btn:hover {
        background-color: #45a049;
    }

    .cancel-btn {
        background-color: #f44336;
        color: white;
    }

    .cancel-btn:hover {
        background-color: #da190b;
    }

    .close-btn {
        position: absolute;
        right: 10px;
        top: 10px;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        z-index: 11;
    }

    .close-btn:hover {
        color: #000;
    }

    .payment-date-fields {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    @media screen and (max-height: 600px) {
        .modal-content {
            margin: 10px auto;
            max-height: 90vh;
        }

        .button-group {
            padding: 10px 0 0;
        }

        .submit-btn, .cancel-btn {
            padding: 8px 16px;
        }
    }

    .debtor-label {
        background-color: #ff4444;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        margin-right: 8px;
    }

    .negative-balance {
        color: #ff4444;
        font-weight: bold;
    }

    .payment-type-container {
        display: flex;
        gap: 20px;
        margin: 10px 0;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 5px;
        cursor: pointer;
    }

    .date-inputs-container {
        margin: 15px 0;
    }

    .date-input-group {
        display: flex;
        gap: 15px;
        justify-content: center;
    }

    .date-input-wrapper {
        position: relative;
        width: 100px;
    }

    .date-input {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 8px;
        text-align: center;
        background-color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .date-input:hover {
        border-color: #4CAF50;
    }

    .date-input:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }

    .date-select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        opacity: 0;
        z-index: 1;
    }

    .date-select option {
        padding: 8px;
        font-size: 14px;
        background-color: white;
        color: #333;
        text-align: center;
    }

    @media screen and (max-width: 480px) {
        .date-input-group {
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        .date-input-wrapper {
            width: 150px;
        }
    }

    .modal-content {
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
        padding: 20px;
    }

    .payment-date-fields {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
        margin-top: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .time-input-container {
        margin: 15px 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .time-inputs-group {
        display: flex;
        align-items: center;
        gap: 5px;
        margin: 10px 0;
    }

    .time-input-wrapper {
        position: relative;
        width: 60px;
    }

    .time-input {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 8px;
        text-align: center;
        background-color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .time-input:hover {
        border-color: #4CAF50;
    }

    .time-select {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        opacity: 0;
        z-index: 1;
    }

    .time-separator {
        font-size: 20px;
        font-weight: bold;
        margin: 0 2px;
        color: #666;
    }

    .period-select {
        padding: 8px 15px;
        font-size: 14px;
        border: 2px solid #ddd;
        border-radius: 8px;
        background-color: white;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-right: 10px;
    }

    .period-select:hover {
        border-color: #4CAF50;
    }

    .period-select:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }

    @media screen and (max-width: 480px) {
        .time-inputs-group {
            flex-wrap: wrap;
            justify-content: center;
        }

        .time-input-wrapper {
            width: 70px;
        }
    }

    .amount-section {
        margin: 20px 0;
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 15px;
    }

    .amount-container {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 15px;
    }

    .amount-input-wrapper {
        position: relative;
        flex: 2;
    }

    .amount-field {
        position: relative;
        display: flex;
        align-items: center;
        background-color: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .amount-field:hover {
        border-color: #4CAF50;
    }

    .amount-field:focus-within {
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }

    .amount-input {
        width: 100%;
        padding: 12px;
        font-size: 18px;
        border: none;
        background: transparent;
        text-align: center;
        direction: ltr;
    }

    .amount-input:focus {
        outline: none;
    }

    .currency-label {
        position: absolute;
        right: 12px;
        color: #666;
        font-weight: bold;
        pointer-events: none;
        padding: 0 8px;
        background-color: white;
        border-right: 2px solid #ddd;
        height: 100%;
        display: flex;
        align-items: center;
    }

    .amount-field:hover .currency-label {
        border-right-color: #4CAF50;
    }

    .amount-field:focus-within .currency-label {
        border-right-color: #4CAF50;
        color: #4CAF50;
    }

    .balance-type-select {
        flex: 1;
        padding: 12px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .balance-type-select:hover {
        border-color: #4CAF50;
    }

    .balance-type-select:focus {
        outline: none;
        border-color: #4CAF50;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
    }

    .time-toggle {
        margin-bottom: 10px;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
    }

    .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }

    .checkbox-text {
        font-size: 14px;
        color: #333;
    }

    .time-input-wrapper.disabled,
    .period-select:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .time-input:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    .balance-details {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
    }

    .balance-label {
        font-weight: bold;
        color: #333;
    }

    .balance-value {
        font-size: 16px;
        font-weight: bold;
    }

    .balance-value.positive {
        color: #4CAF50;
    }

    .balance-value.negative {
        color: #f44336;
    }

    .amount-input {
        text-align: center;
        direction: ltr;
    }
`;

const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

// =============================================
// نافذة إضافة عميل جديد
// =============================================
const modalHtml = `
    <div id="addClientModal">
        <div class="modal-content">
            <h2>إضافة عميل جديد</h2>
            <form id="addClientForm">
                <div class="form-group">
                    <label for="newClientName">اسم العميل:</label>
                    <input type="text" id="newClientName" required>
                </div>
                
                <div class="form-group">
                    <label for="newClientPhone">رقم الهاتف:</label>
                    <input type="text" id="newClientPhone" required>
                </div>
                
                <div class="form-group">
                    <label for="newClientAddress">العنوان:</label>
                    <input type="text" id="newClientAddress" required>
                </div>
                
                <div class="form-group balance-group">
                    <label>الرصيد:</label>
                    <div class="balance-input-group">
                        <input type="number" id="newClientBalance" required placeholder="أدخل المبلغ">
                        <select id="balanceType" required>
                            <option value="فوري">فوري</option>
                            <option value="امان">أمان</option>
                            <option value="كاش">كاش</option>
                            <option value="خزينة">خزينة</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-buttons">
                    <button type="button" onclick="document.getElementById('addClientModal').style.display = 'none';">إلغاء</button>
                    <button type="submit">إضافة</button>
                </div>
            </form>
        </div>
    </div>
`;

const modalElement = document.createElement('div');
modalElement.innerHTML = modalHtml;
document.body.appendChild(modalElement);

// =============================================
// تبديل ظهور حقول تواريخ السداد
function togglePaymentFields() {
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    const dateFields = document.getElementById('paymentDateFields');
    const enableTimeCheckbox = document.getElementById('enableTime');
    
    if (paymentType === 'delayed') {
        // تحديث التاريخ الحالي
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // تحديث قيم الحقول
        document.getElementById('paymentDay').value = currentDay;
        document.getElementById('paymentMonth').value = currentMonth;
        document.getElementById('paymentYear').value = currentYear;

        // إعادة تعيين حقول الوقت
        enableTimeCheckbox.checked = false;
        toggleTimeInputs(false);

        // إظهار الحقول
        dateFields.style.display = 'block';
    } else {
        dateFields.style.display = 'none';
    }
}

// دالة تفعيل/تعطيل حقول الوقت
function toggleTimeInputs(enabled) {
    const timeInputsGroup = document.querySelector('.time-inputs-group');
    const hourInput = document.getElementById('paymentHour');
    const hourSelect = hourInput.nextElementSibling;
    const periodSelect = document.getElementById('timePeriod');
    
    timeInputsGroup.style.display = enabled ? 'flex' : 'none';
    hourInput.disabled = !enabled;
    hourSelect.disabled = !enabled;
    periodSelect.disabled = !enabled;

    if (enabled) {
        hourInput.value = '12';
        periodSelect.value = 'مساءً';
    }
}

// =============================================
// التحقق من دعم اللمس
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    // الجهاز يدعم اللمس
    console.log("This device supports touch.");
    document.addEventListener('touchstart', function(event) {
        // التعامل مع حدث اللمس
    });
} else {
    // الجهاز لا يدعم اللمس
    console.log("This device does not support touch.");
}
