const API_BASE_URL = "http://us.apsara.lol:55071";

let countdownInterval = null;
let statusPollInterval = null;
let paymentConfirmed = false;

async function confirmAndPay() {
    document.getElementById("qrcode-box").innerHTML =
        "<p style='font-size:13px;color:#666;'>កំពុងបង្កើតកូដទូទាត់...</p>";

    document.getElementById("qr-timeout-overlay").style.display = "none";
    document.getElementById("paymentModal").style.display = "block";

    const payload = {
        player_name: currentOrder.ign,
        platform: currentOrder.platform,
        category: currentOrder.category.toLowerCase(),
        value: currentOrder.value
    };

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/create-order`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        console.log("CREATE ORDER:", result);

        if (!result.success) {
            alert("⚠️ " + (result.error || "Create order failed"));
            closeModal();
            return;
        }

        const transactionId = result.transaction_id;

        if (!transactionId) {
            alert("❌ transaction_id មិនមាន!");
            closeModal();
            return;
        }

        document.getElementById("qrcode-box").innerHTML = "";

        new QRCode(
            document.getElementById("qrcode-box"),
            {
                text: result.khqr_string,
                width: 190,
                height: 190
            }
        );

        startCountdownTimer(420);
        startPaymentPolling(transactionId);

    } catch (error) {
        console.error(error);
        alert("❌ មិនអាចភ្ជាប់ API បានទេ!");
        closeModal();
    }
}

function startPaymentPolling(transactionId) {

    if (statusPollInterval) {
        clearInterval(statusPollInterval);
    }

    statusPollInterval = setInterval(async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/check-status/${transactionId}`
            );

            const result = await response.json();

            console.log("STATUS:", result);

            if (
                result.success &&
                result.order_status === "paid"
            ) {
                paymentConfirmed = true;

                clearInterval(countdownInterval);
                clearInterval(statusPollInterval);

                document.getElementById(
                    "paymentModal"
                ).style.display = "none";

                triggerSuccessAlert();
            }

        } catch (error) {
            console.error("Polling error:", error);
        }
    }, 4000);
}

function startCountdownTimer(seconds) {

    clearInterval(countdownInterval);

    let timer = seconds;

    const display =
        document.getElementById("countdown-timer");

    countdownInterval = setInterval(() => {

        const m = String(
            Math.floor(timer / 60)
        ).padStart(2, "0");

        const s = String(
            timer % 60
        ).padStart(2, "0");

        display.innerText = `${m}:${s}`;

        timer--;

        if (timer < 0) {

            if (paymentConfirmed) {
                return;
            }

            clearInterval(countdownInterval);
            clearInterval(statusPollInterval);

            document.getElementById(
                "qr-timeout-overlay"
            ).style.display = "flex";

            setTimeout(closeModal, 4000);
        }

    }, 1000);
}

function closeModal() {
    document.getElementById(
        "paymentModal"
    ).style.display = "none";

    clearInterval(countdownInterval);
    clearInterval(statusPollInterval);
}
