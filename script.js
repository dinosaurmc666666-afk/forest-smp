let selectedRank = "";
let selectedPrice = 0;
let finalPrice = 0;
let discountAmount = 0;
let checkInterval = null;

// បើកផ្ទាំង Modal ដំបូង (Step 1)
function openModal(rankName, rankPrice) {
    selectedRank = rankName;
    selectedPrice = rankPrice;
    finalPrice = rankPrice; 
    discountAmount = 0;
    
    document.getElementById('modal-rank-name').innerText = rankName;
    
    // Clear ចោលទិន្នន័យចាស់
    document.getElementById('mc-username').value = "";
    document.getElementById('mc-email').value = "";
    document.getElementById('mc-promo').value = "";
    document.getElementById('promo-message').innerText = "";
    document.getElementById('promo-row').style.display = "none";
    
    // បង្ហាញ Step 1 លាក់ផ្សេងទៀត
    document.getElementById('step-1-input').style.display = 'block';
    document.getElementById('step-2-verify').style.display = 'none';
    document.getElementById('step-3-payment').style.display = 'none';
    
    document.getElementById('buyModal').style.display = 'flex';
}

// មុខងារគណនា Promo Code
function applyPromo() {
    const code = document.getElementById('mc-promo').value.trim().toUpperCase();
    const msg = document.getElementById('promo-message');
    
    if (code === "FORESTMC20") { 
        discountAmount = selectedPrice * 0.20;
        finalPrice = selectedPrice - discountAmount;
        msg.style.color = "#00e676";
        msg.innerText = "✅ ទទួលបានការបញ្ចុះតម្លៃ 20% រួចរាល់!";
    } else if (code === "") {
        discountAmount = 0;
        finalPrice = selectedPrice;
        msg.innerText = "";
    } else {
        discountAmount = 0;
        finalPrice = selectedPrice;
        msg.style.color = "#ff5252";
        msg.innerText = "❌ កូដប្រូម៉ូសិនមិនត្រឹមត្រូវទេ!";
    }
}

// ជំហានទី ២៖ ផ្ទៀងផ្ទាត់ (Verification & Total)
function goToStep2(event) {
    event.preventDefault();
    applyPromo(); 

    const username = document.getElementById('mc-username').value;
    const email = document.getElementById('mc-email').value;
    
    document.getElementById('verify-username').innerText = username;
    document.getElementById('verify-email').innerText = email;
    document.getElementById('verify-rank').innerText = selectedRank + " ($" + selectedPrice.toFixed(2) + ")";
    
    if (discountAmount > 0) {
        document.getElementById('promo-row').style.display = "flex";
        document.getElementById('verify-discount').innerText = "-$" + discountAmount.toFixed(2);
    } else {
        document.getElementById('promo-row').style.display = "none";
    }
    
    document.getElementById('verify-total').innerText = "$" + finalPrice.toFixed(2);
    
    document.getElementById('step-1-input').style.display = 'none';
    document.getElementById('step-2-verify').style.display = 'block';
}

// មុខងារថយក្រោយមក Step 1
function backToStep1() {
    document.getElementById('step-1-input').style.display = 'block';
    document.getElementById('step-2-verify').style.display = 'none';
}

// ជំហានទី ៣៖ បង្កើត KHQR ពេលចុច Next
function generatePayment() {
    const username = document.getElementById('mc-username').value;
    const orderId = "FMC" + Math.floor(Math.random() * 100000);

    document.getElementById('step-2-verify').style.display = 'none';
    document.getElementById('step-3-payment').style.display = 'block';

    // 🔗 ភ្ជាប់ទៅកាន់ Render Backend URL របស់អ្នក
    fetch("https://pay-pszc.onrender.com/api/generate-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            "orderId": orderId,
            "amount": finalPrice
        })
    })
    .then(response => response.json())
    .then(res => {
        if (res.status === "SUCCESS" && res.qrCode) {
            const canvas = document.getElementById('khqr-canvas');
            
            QRCode.toCanvas(canvas, res.qrCode, { width: 180, margin: 1 }, function (error) {
                if (error) console.error("QR Code Error:", error);
            });

            startCheckingPayment(orderId, username, res.qrCode);
        } else {
            alert("មិនអាចបង្កើត KHQR បានទេ៖ " + (res.message || ""));
            closeModal();
        }
    })
    .catch(err => {
        alert("កំហុស៖ មិនអាចតភ្ជាប់ទៅ Python Cloud Server បានឡើយ។ សូមប្រាកដថាប្រព័ន្ធនៅលើ Render បានរត់ (Live) ជោគជ័យ។");
        closeModal();
    });
}

// ប្រព័ន្ធ Polling ឆែកលុយចូល
function startCheckingPayment(orderId, username, qrCodeString) {
    checkInterval = setInterval(() => {
        // 🔗 ភ្ជាប់ទៅកាន់ Render Backend URL របស់អ្នកដើម្បី Check ស្ថានភាពលុយ
        fetch("https://pay-pszc.onrender.com/api/check-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "orderId": orderId,
                "username": username,
                "rankName": selectedRank,
                "qrCode": qrCodeString
            })
        })
        .then(response => response.json())
        .then(res => {
            if (res.status === "PAID") { 
                clearInterval(checkInterval);
                alert(`🎉 Payment Successfully!\n\nការទូទាត់ទទួលបានជោគជ័យ! Rank ${selectedRank} ត្រូវបានដំឡើងជូនអ្នកលេង [ ${username} ] រួចរាល់ហើយ!`);
                closeModal();
            }
        })
        .catch(err => console.log("កំពុងឆែកលុយ...", err));
    }, 3000);
}

// មុខងារបិទផ្ទាំង Modal
function closeModal() {
    document.getElementById('buyModal').style.display = 'none';
    if (checkInterval) clearInterval(checkInterval);
}
